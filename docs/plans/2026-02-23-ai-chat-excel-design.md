# AI Chat Interface for Excel Template Generation

**Date:** 2026-02-23
**Status:** Approved
**Scope:** Azure Platform Calculator template (v1); extensible to all templates (v2+)

---

## Problem

The Azure pricing calculator template currently generates a spreadsheet with generic placeholder rows ("Compute Resource 1", "Storage Resource 2"). Users must manually look up SKUs, prices, and fill in every row after downloading. The 1,971-SKU pricing reference sheet is available but not used at generation time.

## Goal

Let users describe their Azure infrastructure in plain English and receive a fully pre-filled Excel workbook — with real SKU names, quantities, and actual AUD prices — in a single interaction.

---

## Approach A — Single-turn AI with Real SKU Lookup (Implemented)

### Overview

User types a natural language description → single AI call → server resolves real prices → pre-filled Excel download.

### Data Flow

```
User types in AIChatPanel
        ↓
POST /api/chat/[templateId]  { message, config }
        ↓
lib/ai/index.ts  →  resolves provider from env (anthropic | openai | azure)
        ↓
AI receives:
  - system prompt with compact service catalogue (~30KB of the 1,971 SKUs)
  - user message
        ↓
AI returns structured JSON: { resources[], summary }
        ↓
Server resolves unitMonthlyCost from full pricing lookup
        ↓
Response: { resources[], summary, totalMonthly }
        ↓
AIChatPanel shows summary + resource list + "Generate Excel" button
        ↓
POST /api/generate  { templateId, config: { ...existing, resources: [...] } }
        ↓
generateAzureCalculatorWorkbook uses real resource rows instead of placeholders
        ↓
.xlsx download
```

### New Files

| Path | Purpose |
|------|---------|
| `lib/ai/types.ts` | `AIProvider` interface, `AIMessage` type |
| `lib/ai/anthropic.ts` | Anthropic SDK implementation |
| `lib/ai/openai.ts` | OpenAI-compatible implementation (OpenAI + Azure OpenAI) |
| `lib/ai/index.ts` | Provider resolver from env vars |
| `app/api/chat/[templateId]/route.ts` | POST handler: message → AI → price lookup → resources |
| `components/TemplateModeSwitcher.tsx` | Generic [Manual \| AI Chat] tab wrapper |
| `components/AIChatPanel.tsx` | Azure-specific chat UI |
| `docs/ADDING_TEMPLATES.md` | Guide for adding new templates |
| `CLAUDE.md` | Project context for Claude Code |
| `.env.local.example` | Documents all AI provider env vars |

### Modified Files

| Path | Change |
|------|--------|
| `types/templates.ts` | Add `AzureResource` interface |
| `lib/templates/azure-calculator.ts` | New code path when `config.resources[]` present |
| `app/template/[id]/TemplateConfigurator.tsx` | Wrap with `TemplateModeSwitcher` for azure-calculator |

### Environment Variables

```bash
# Choose provider: anthropic | openai | azure (default: anthropic)
AI_PROVIDER=anthropic

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-...

# Azure OpenAI (uses OpenAI-compatible SDK)
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Key Data Shapes

**`AzureResource`** (added to `types/templates.ts`):
```typescript
interface AzureResource {
  name: string;           // display name e.g. "Key Vault"
  serviceName: string;    // exact key in pricing lookup e.g. "Key Vault"
  skuName: string;        // exact SKU key e.g. "Standard"
  environment: string;    // e.g. "Production"
  quantity: number;
  unitMonthlyCost: number; // resolved server-side, never from AI
  category: string;       // e.g. "Security" — for Excel grouping
  notes?: string;
}
```

**AI response contract:**
```json
{
  "resources": [
    {
      "name": "Fabric Capacity",
      "serviceName": "Microsoft Fabric Capacity",
      "skuName": "F64",
      "environment": "Production",
      "quantity": 1,
      "category": "Compute"
    }
  ],
  "summary": "I've matched 3 resources to real Azure SKUs totalling $2,841/mo."
}
```

The AI never invents prices. `unitMonthlyCost` is always resolved server-side from the pricing lookup after the AI responds. If a `serviceName|skuName` pair is not found, the row gets `unitMonthlyCost: 0` with a note: `"SKU not found — fill in manually"`.

### UI Components

**`TemplateModeSwitcher`** — generic, reusable across all templates:

```
┌─────────────────────────────────────┐
│  [ Manual Config ]  [ AI Chat ]     │  ← shown only when chatContent provided
├─────────────────────────────────────┤
│  (renders active tab content)       │
└─────────────────────────────────────┘
```

Props:
- `manualContent: React.ReactNode`
- `chatContent?: React.ReactNode` — omit to hide AI tab entirely

**`AIChatPanel`** — azure-calculator chat UI:

```
┌─────────────────────────────────────┐
│  Describe your Azure resources      │
│  ┌───────────────────────────────┐  │
│  │ 1 Fabric capacity in prod,    │  │
│  │ 1 Key Vault, 3 storage accts  │  │
│  └───────────────────────────────┘  │
│  [ Analyse Resources ]              │
│                                     │
│  ── After AI responds ──────────── │
│  ✓ Microsoft Fabric F64 × 1  Prod  │
│  ✓ Key Vault Standard × 1    Prod  │
│  ✓ Storage LRS Hot × 3       Prod  │
│  Est. monthly: $2,841               │
│                                     │
│  [ Generate & Download Excel ]      │
└─────────────────────────────────────┘
```

Key prop: `onGenerate: (resources: AzureResource[], config: TemplateConfig) => void`
This keeps download logic in the parent `TemplateConfigurator`, matching today's pattern.

### AI Provider Abstraction

```typescript
// lib/ai/types.ts
interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIProvider {
  complete(messages: AIMessage[], systemPrompt: string): Promise<string>;
}
```

Provider selection at runtime via `AI_PROVIDER` env var. The `openai` implementation covers both OpenAI and Azure OpenAI (Azure uses an OpenAI-compatible API, differing only in endpoint and auth headers — the `openai` npm package handles both).

### Extension to Other Templates

The chat API is routed as `/api/chat/[templateId]` not `/api/chat/azure`. Adding AI chat to a new template requires:

1. Creating `app/api/chat/[templateId]/route.ts` with a handler that understands that template's config
2. Building a `<TemplateChatPanel>` component with an appropriate system prompt
3. Passing `chatContent={<TemplateChatPanel ... />}` to `TemplateModeSwitcher` in that template's configurator

No changes needed to the switcher component, the provider abstraction, or the generate route.

---

## Approach C — AI Chat with Editable Resource Table (Future)

### Overview

After the AI returns its resource list, instead of going directly to Excel generation, show an editable table in the chat panel. Users can adjust quantities, swap SKUs, delete rows, or add new rows before generating.

### What Changes from Approach A

1. **`AIChatPanel` gets a review table** between the AI response and the Generate button:

```
┌─────────────────────────────────────────────────────────┐
│  [ textarea ] [ Analyse ]                               │
│                                                         │
│  AI summary: "Matched 3 resources..."                   │
│                                                         │
│  ┌──────────────┬────────────┬──────┬───┬─────────┬──┐ │
│  │ Resource     │ SKU        │ Env  │Qty│ /mo     │  │ │
│  ├──────────────┼────────────┼──────┼───┼─────────┼──┤ │
│  │ Fabric Cap.  │ F64      ▼ │ Prod │ 1 │ $2,400  │🗑│ │
│  │ Key Vault    │ Standard ▼ │ Prod │ 1 │    $18  │🗑│ │
│  │ Storage      │ LRS Hot  ▼ │ Prod │[3]│    $72  │🗑│ │
│  └──────────────┴────────────┴──────┴───┴─────────┴──┘ │
│  [ + Add row ]                  Total: $2,490/mo        │
│                                                         │
│  [ Generate & Download Excel ]                          │
└─────────────────────────────────────────────────────────┘
```

2. **Inline editing:** Quantity cells are directly editable inputs. SKU cells are dropdowns populated from `getServiceSkus(serviceName)`. Changing either triggers a client-side price recalculation (price data passed down from server with initial response).

3. **New API endpoint for SKU price lookup:** `GET /api/pricing/azure?service=Key+Vault&sku=Standard` — returns unit cost. Used when user changes a SKU dropdown.

4. **Add row:** Opens a service search input → SKU dropdown → environment + qty → appends to table.

### New Components Required

| Component | Purpose |
|-----------|---------|
| `ResourceTable.tsx` | Editable table with inline qty inputs + SKU dropdowns |
| `ResourceRow.tsx` | Single row with edit/delete controls |
| `ServiceSearch.tsx` | Searchable dropdown for Azure service names |

### New API Routes Required

| Route | Purpose |
|-------|---------|
| `GET /api/pricing/azure` | Returns unit price for a given service + SKU |

### Migration from Approach A

Approach C is a drop-in enhancement — the `onGenerate` callback interface and `AzureResource[]` type are unchanged. The only difference is that the resource list passes through the editable table before `onGenerate` is called.

### Considerations

- SKU dropdown options must be fetched per-service (can't ship all 1,971 to the client). Use the `GET /api/pricing/azure?service=...&skus=true` endpoint.
- Price recalculation on qty change is client-side (price per unit already in state). Price recalculation on SKU change requires a server round-trip.
- The add-row flow needs a service search — the compact catalogue used for AI prompts (~100 services) can also power this UI.

---

## Documentation Deliverables

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project overview, architecture, key patterns for Claude Code |
| `docs/ADDING_TEMPLATES.md` | Step-by-step guide for adding a new template from an existing Excel file |
| `docs/plans/2026-02-23-ai-chat-excel-design.md` | This document |

---

## Out of Scope (v1)

- Multi-turn conversation / follow-up messages (chat history)
- AI support for non-Azure templates
- Streaming AI responses
- Saving/loading chat sessions
- Price data refresh automation
