# AI Chat Interface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an AI-powered chat tab to the Azure Calculator template that converts natural language resource descriptions into a fully pre-filled Excel workbook with real SKU prices.

**Architecture:** Provider-agnostic AI abstraction (`lib/ai/`) resolves resources from natural language via a `/api/chat/[templateId]` route; prices are always resolved server-side from the 1,971-SKU pricing lookup; a `TemplateModeSwitcher` tab component wraps any template's configurator form.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, ExcelJS, Tailwind v4, `@anthropic-ai/sdk`, `openai` (covers OpenAI + Azure OpenAI)

> **Note — No test framework:** This project has no Jest/Vitest setup. TDD steps use TypeScript compilation (`npx tsc --noEmit`) as a first-pass check, and `curl` / browser for runtime verification. Each task includes exact verification commands.

---

## Task 1: Install Dependencies + Environment Setup

**Files:**
- Create: `ExcelTemplateGen/.env.local.example`
- Modify: `ExcelTemplateGen/package.json` (via npm install)

**Step 1: Install AI SDK packages**

```bash
cd ExcelTemplateGen
npm install @anthropic-ai/sdk openai
```

Expected output: `added N packages` with no errors.

**Step 2: Create `.env.local.example`**

Create `ExcelTemplateGen/.env.local.example`:

```bash
# AI Provider Selection
# Options: anthropic | openai | azure
# Default: anthropic
AI_PROVIDER=anthropic

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-key-here
# Optional: override model (default: claude-sonnet-4-6)
# ANTHROPIC_MODEL=claude-sonnet-4-6

# OpenAI
OPENAI_API_KEY=sk-your-key-here
# Optional: override model (default: gpt-4o)
# OPENAI_MODEL=gpt-4o

# Azure OpenAI
# AZURE_OPENAI_API_KEY=your-key-here
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

**Step 3: Create your own `.env.local`**

```bash
cp ExcelTemplateGen/.env.local.example ExcelTemplateGen/.env.local
# Then edit .env.local and fill in your real key
```

**Step 4: Verify `.env.local` is gitignored**

```bash
cat ExcelTemplateGen/.gitignore | grep env
```

Expected: `.env.local` or `*.local` appears. If not, add `.env.local` to `.gitignore`.

**Step 5: Commit**

```bash
cd ExcelTemplateGen
git add .env.local.example .gitignore package.json package-lock.json
git commit -m "feat: install AI SDK dependencies and add env template"
```

---

## Task 2: AI Provider Abstraction

**Files:**
- Create: `ExcelTemplateGen/lib/ai/types.ts`
- Create: `ExcelTemplateGen/lib/ai/anthropic.ts`
- Create: `ExcelTemplateGen/lib/ai/openai.ts`
- Create: `ExcelTemplateGen/lib/ai/index.ts`

**Step 1: Create `lib/ai/types.ts`**

```typescript
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  complete(messages: AIMessage[], systemPrompt: string): Promise<string>;
}
```

**Step 2: Create `lib/ai/anthropic.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMessage } from './types';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  }

  async complete(messages: AIMessage[], systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
    return block.text;
  }
}
```

**Step 3: Create `lib/ai/openai.ts`**

```typescript
import OpenAI from 'openai';
import type { AIProvider, AIMessage } from './types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const isAzure = process.env.AI_PROVIDER === 'azure';

    if (isAzure) {
      if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_DEPLOYMENT) {
        throw new Error('Azure OpenAI requires AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT.');
      }
      this.client = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
        defaultQuery: { 'api-version': '2024-02-01' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
      });
      this.model = process.env.AZURE_OPENAI_DEPLOYMENT;
    } else {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set.');
      }
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.model = process.env.OPENAI_MODEL ?? 'gpt-4o';
    }
  }

  async complete(messages: AIMessage[], systemPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });
    return response.choices[0]?.message?.content ?? '';
  }
}
```

**Step 4: Create `lib/ai/index.ts`**

```typescript
import type { AIProvider, AIMessage } from './types';

export type { AIProvider, AIMessage };

let _provider: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  const providerName = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase();

  switch (providerName) {
    case 'anthropic': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AnthropicProvider } = require('./anthropic') as typeof import('./anthropic');
      _provider = new AnthropicProvider();
      break;
    }
    case 'openai':
    case 'azure': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { OpenAIProvider } = require('./openai') as typeof import('./openai');
      _provider = new OpenAIProvider();
      break;
    }
    default:
      throw new Error(
        `Unknown AI_PROVIDER "${providerName}". Valid values: anthropic, openai, azure.`
      );
  }

  return _provider!;
}
```

**Step 5: Verify TypeScript compiles**

```bash
cd ExcelTemplateGen
npx tsc --noEmit
```

Expected: no errors.

**Step 6: Commit**

```bash
git add lib/ai/
git commit -m "feat: add provider-agnostic AI abstraction (Anthropic + OpenAI)"
```

---

## Task 3: AzureResource Type + Compact Service Catalogue

**Files:**
- Modify: `ExcelTemplateGen/types/templates.ts`
- Create: `ExcelTemplateGen/lib/data/azure-service-catalogue.ts`

**Step 1: Add `AzureResource` to `types/templates.ts`**

Open `types/templates.ts` and add after the existing exports at the bottom:

```typescript
/** A single resolved Azure resource row for AI-generated workbooks */
export interface AzureResource {
  name: string;           // Friendly display name, e.g. "Key Vault"
  serviceName: string;    // Exact key in pricing lookup, e.g. "Key Vault"
  skuName: string;        // Exact SKU key, e.g. "Standard"
  environment: string;    // e.g. "Production"
  quantity: number;
  unitMonthlyCost: number; // Resolved server-side — never from AI
  category: string;       // e.g. "Security" — used for Excel row grouping
  notes?: string;         // Populated when SKU lookup fails
}
```

**Step 2: Create `lib/data/azure-service-catalogue.ts`**

This builds a compact text representation of the service catalogue for use in AI system prompts. It is intentionally small — the full `azure-pricing-lookup.json` must never be sent to the AI directly (341KB).

```typescript
import { getAzurePricingLookup } from './azure-pricing';

// Max SKUs to list per service in the AI prompt (keeps prompt manageable)
const MAX_SKUS_PER_SERVICE = 8;

let _catalogueText: string | undefined;

/**
 * Returns a compact plain-text service catalogue for use in AI system prompts.
 * Format: "ServiceName (Family): sku1, sku2, sku3..."
 * Cached after first call.
 */
export function getServiceCatalogueText(): string {
  if (_catalogueText) return _catalogueText;

  const lookup = getAzurePricingLookup();
  const lines: string[] = [];

  for (const [serviceName, info] of Object.entries(lookup.services)) {
    const skus = info.skus.slice(0, MAX_SKUS_PER_SERVICE);
    const skuList = skus.join(', ');
    const overflow = info.skus.length > MAX_SKUS_PER_SERVICE
      ? ` (+${info.skus.length - MAX_SKUS_PER_SERVICE} more)`
      : '';
    lines.push(`${serviceName} (${info.family}): ${skuList}${overflow}`);
  }

  _catalogueText = lines.join('\n');
  return _catalogueText;
}
```

**Step 3: Verify TypeScript compiles**

```bash
cd ExcelTemplateGen
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add types/templates.ts lib/data/azure-service-catalogue.ts
git commit -m "feat: add AzureResource type and compact service catalogue builder"
```

---

## Task 4: Chat API Route

**Files:**
- Create: `ExcelTemplateGen/app/api/chat/[templateId]/route.ts`

**Step 1: Create the route file**

Create `app/api/chat/[templateId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getServiceCatalogueText } from '@/lib/data/azure-service-catalogue';
import { findPricing, getMonthlyFromHourly } from '@/lib/data/azure-pricing';
import type { AzureResource } from '@/types/templates';

interface ChatRequest {
  message: string;
  config?: Record<string, unknown>;
}

interface AIResourceItem {
  name: string;
  serviceName: string;
  skuName: string;
  environment: string;
  quantity: number;
  category: string;
  notes?: string;
}

interface AIResponse {
  resources: AIResourceItem[];
  summary: string;
}

const AZURE_SYSTEM_PROMPT = `You are an Azure cost estimation assistant. Users describe their Azure infrastructure in plain English. You map their requirements to real Azure services and SKUs from the catalogue provided.

RULES:
1. Return ONLY a valid JSON object — no markdown, no explanation, just the JSON.
2. The JSON must match this exact schema:
{
  "resources": [
    {
      "name": "string (friendly display name for the Excel row)",
      "serviceName": "string (MUST exactly match a service name from the catalogue below)",
      "skuName": "string (MUST exactly match one of that service's SKUs from the catalogue)",
      "environment": "string (e.g. Production, Development, UAT — infer from context, default Production)",
      "quantity": number,
      "category": "string (one of: Compute, Storage, Networking, Databases, AI & ML, Security, Monitoring, Other)"
    }
  ],
  "summary": "string (1-2 sentences explaining what you matched and any assumptions)"
}
3. serviceName and skuName MUST be exact character-for-character matches from the catalogue.
4. If you cannot confidently match a resource, use your best guess and add a "notes" field: "May need manual review — SKU estimated".
5. If the user specifies an environment (prod, dev, uat, staging), map it to the full word (Production, Development, UAT, Staging).
6. If quantity is not specified, default to 1.
7. Do not add resources the user did not mention.

AZURE SERVICE CATALOGUE (ServiceName: sku1, sku2, ...):
`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  // Only azure-calculator has AI support in v1. Future templates add their own handler.
  if (templateId !== 'azure-calculator') {
    return NextResponse.json(
      { error: `AI chat is not yet supported for template: ${templateId}` },
      { status: 400 }
    );
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    const catalogueText = getServiceCatalogueText();
    const systemPrompt = AZURE_SYSTEM_PROMPT + catalogueText;

    const provider = getAIProvider();
    const rawResponse = await provider.complete(
      [{ role: 'user', content: body.message }],
      systemPrompt
    );

    // Strip markdown code fences if the AI wraps its JSON
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim();

    let aiResult: AIResponse;
    try {
      aiResult = JSON.parse(cleaned) as AIResponse;
    } catch {
      console.error('[chat/azure] AI returned non-JSON:', rawResponse);
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try rephrasing your request.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(aiResult.resources)) {
      return NextResponse.json(
        { error: 'AI response missing resources array.' },
        { status: 500 }
      );
    }

    // Resolve real prices server-side — the AI never provides costs
    const resources: AzureResource[] = aiResult.resources.map((r) => {
      const pricing = findPricing(r.serviceName, r.skuName);
      let unitMonthlyCost = 0;
      let notes = r.notes;

      if (pricing) {
        unitMonthlyCost = pricing.unit.includes('Hour')
          ? getMonthlyFromHourly(pricing.price)
          : pricing.price;
      } else {
        const fallback = 'SKU not found in pricing data — enter cost manually';
        notes = notes ? `${notes}; ${fallback}` : fallback;
      }

      return {
        name: r.name,
        serviceName: r.serviceName,
        skuName: r.skuName,
        environment: r.environment,
        quantity: Math.max(1, Math.round(r.quantity)),
        unitMonthlyCost,
        category: r.category,
        ...(notes ? { notes } : {}),
      };
    });

    const totalMonthly = resources.reduce(
      (sum, r) => sum + r.unitMonthlyCost * r.quantity,
      0
    );

    return NextResponse.json({ resources, summary: aiResult.summary, totalMonthly });
  } catch (err) {
    console.error('[chat/azure] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to process request: ${message}` }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd ExcelTemplateGen
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Start dev server and test the route with curl**

```bash
npm run dev
```

In a separate terminal (with `ANTHROPIC_API_KEY` set in `.env.local`):

```bash
curl -s -X POST http://localhost:3000/api/chat/azure-calculator \
  -H "Content-Type: application/json" \
  -d '{"message":"1 Key Vault in prod and 3 storage accounts in dev"}' \
  | jq .
```

Expected: JSON with `resources` array, `summary` string, `totalMonthly` number. Each resource has `unitMonthlyCost > 0` if the SKU was found.

**Step 4: Test error path**

```bash
curl -s -X POST http://localhost:3000/api/chat/azure-calculator \
  -H "Content-Type: application/json" \
  -d '{"message":""}' \
  | jq .
```

Expected: `{ "error": "message is required" }` with status 400.

**Step 5: Commit**

```bash
git add app/api/chat/
git commit -m "feat: add /api/chat/[templateId] route for AI resource resolution"
```

---

## Task 5: Modify Azure Calculator Workbook Generator

The current generator always creates 4 generic placeholder rows per category. This task adds a second code path: when `config.resources` contains an `AzureResource[]`, use real rows grouped by category instead.

**Files:**
- Modify: `ExcelTemplateGen/lib/templates/azure-calculator.ts`

**Step 1: Add the import for `AzureResource`**

At the top of `lib/templates/azure-calculator.ts`, add to the existing import:

```typescript
import type { TemplateDefinition, TemplateConfig, PreviewRow, AzureResource } from "@/types/templates";
```

**Step 2: Add `addRealResourceBlock` function**

Add this function directly after the existing `addCategoryBlock` function (around line 195):

```typescript
function addRealResourceBlock(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  category: string,
  resources: AzureResource[],
  totalCols: number,
  headerColor: string,
  sym: string,
): number {
  let r = startRow;

  // Category header
  sheet.mergeCells(r, 1, r, totalCols);
  const catCell = sheet.getCell(r, 1);
  catCell.value = `▶  ${category.toUpperCase()}`;
  catCell.alignment = { horizontal: "left", vertical: "middle" };
  catCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF034078" } };
  catCell.font = { bold: true, name: "Calibri", size: 10, color: { argb: "FFFFFFFF" } };
  sheet.getRow(r).height = 18;
  r++;

  resources.forEach((resource, i) => {
    const row = sheet.getRow(r);
    row.height = 18;

    row.getCell(1).value = resource.name;
    applyDataStyle(row.getCell(1), i % 2 === 0 ? "#F0F7FF" : undefined);

    row.getCell(2).value = resource.skuName;
    row.getCell(2).alignment = { horizontal: "center" };
    applyDataStyle(row.getCell(2), i % 2 === 0 ? "#F9FAFB" : undefined);

    row.getCell(3).value = resource.serviceName;
    applyDataStyle(row.getCell(3), i % 2 === 0 ? "#F9FAFB" : undefined);

    row.getCell(4).value = resource.environment;
    row.getCell(4).alignment = { horizontal: "center" };
    applyDataStyle(row.getCell(4), i % 2 === 0 ? "#F9FAFB" : undefined);

    row.getCell(5).value = resource.quantity;
    row.getCell(5).numFmt = "0";
    row.getCell(5).alignment = { horizontal: "center" };
    applyDataStyle(row.getCell(5), i % 2 === 0 ? "#F9FAFB" : undefined);

    row.getCell(6).value = resource.unitMonthlyCost;
    row.getCell(6).numFmt = `"${sym}"#,##0.00`;
    row.getCell(6).alignment = { horizontal: "right" };
    applyDataStyle(row.getCell(6), i % 2 === 0 ? "#FFF9E6" : "#FEFDF5");

    row.getCell(7).value = { formula: `E${r}*F${r}` };
    row.getCell(7).numFmt = `"${sym}"#,##0.00`;
    row.getCell(7).alignment = { horizontal: "right" };
    applyDataStyle(row.getCell(7), i % 2 === 0 ? "#EBF5FB" : "#F5FBFF");

    row.getCell(8).value = { formula: `G${r}*12` };
    row.getCell(8).numFmt = `"${sym}"#,##0.00`;
    row.getCell(8).alignment = { horizontal: "right" };
    applyDataStyle(row.getCell(8), i % 2 === 0 ? "#EBF5FB" : "#F5FBFF");

    if (totalCols >= 9) {
      row.getCell(9).value = resource.notes ?? "";
      applyDataStyle(row.getCell(9), i % 2 === 0 ? "#F9FAFB" : undefined);
    }

    r++;
  });

  // Subtotal row
  const stRow = sheet.getRow(r);
  stRow.height = 18;
  sheet.mergeCells(r, 1, r, 4);
  stRow.getCell(1).value = `${category} Subtotal`;
  stRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(stRow.getCell(1), headerColor);
  stRow.getCell(1).font = { bold: true, name: "Calibri", size: 10, color: { argb: "FFFFFFFF" } };

  stRow.getCell(5).value = { formula: `SUM(E${startRow + 1}:E${r - 1})` };
  stRow.getCell(5).numFmt = "0";
  stRow.getCell(5).alignment = { horizontal: "center" };
  applyHeaderStyle(stRow.getCell(5), headerColor);

  stRow.getCell(6).value = "";
  applyHeaderStyle(stRow.getCell(6), headerColor);

  stRow.getCell(7).value = { formula: `SUM(G${startRow + 1}:G${r - 1})` };
  stRow.getCell(7).numFmt = `"${sym}"#,##0.00`;
  stRow.getCell(7).alignment = { horizontal: "right" };
  applyHeaderStyle(stRow.getCell(7), headerColor);

  stRow.getCell(8).value = { formula: `SUM(H${startRow + 1}:H${r - 1})` };
  stRow.getCell(8).numFmt = `"${sym}"#,##0.00`;
  stRow.getCell(8).alignment = { horizontal: "right" };
  applyHeaderStyle(stRow.getCell(8), headerColor);

  if (totalCols >= 9) {
    stRow.getCell(9).value = "";
    applyHeaderStyle(stRow.getCell(9), headerColor);
  }

  r++;
  r++; // blank gap

  return r;
}
```

**Step 3: Replace the category-block generation section in `generateAzureCalculatorWorkbook`**

Find this block in `generateAzureCalculatorWorkbook` (around line 266–274):

```typescript
  // Category blocks
  const categoryStartRows: number[] = [];
  const categoryEndRows: number[] = [];

  categories.forEach((cat) => {
    categoryStartRows.push(r);
    r = addCategoryBlock(sheet, r, cat, resourcesPerCategory, TOTAL_COLS, config.headerColor as string, sym);
    categoryEndRows.push(r - 2); // -2 for blank gap and subtotal
  });
```

Replace it with:

```typescript
  // Category blocks — use AI-resolved resources if present, otherwise generic placeholders
  const categoryStartRows: number[] = [];
  const categoryEndRows: number[] = [];
  const aiResources = config.resources as AzureResource[] | undefined;

  if (aiResources && aiResources.length > 0) {
    // Group resources by category, preserving insertion order
    const byCategory = new Map<string, AzureResource[]>();
    for (const resource of aiResources) {
      const cat = resource.category || "Other";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(resource);
    }

    byCategory.forEach((resources, category) => {
      categoryStartRows.push(r);
      r = addRealResourceBlock(sheet, r, category, resources, TOTAL_COLS, config.headerColor as string, sym);
      categoryEndRows.push(r - 2);
    });
  } else {
    // Original placeholder path
    categories.forEach((cat) => {
      categoryStartRows.push(r);
      r = addCategoryBlock(sheet, r, cat, resourcesPerCategory, TOTAL_COLS, config.headerColor as string, sym);
      categoryEndRows.push(r - 2);
    });
  }
```

**Step 4: Verify TypeScript compiles**

```bash
cd ExcelTemplateGen
npx tsc --noEmit
```

Expected: no errors.

**Step 5: Manual test — verify existing behaviour unchanged**

With the dev server running, go to `http://localhost:3000/template/azure-calculator`, leave Manual Config tab active, click Generate. The downloaded Excel should look exactly as before (placeholder rows).

**Step 6: Commit**

```bash
git add lib/templates/azure-calculator.ts
git commit -m "feat: azure-calculator workbook supports AI-populated resource rows"
```

---

## Task 6: TemplateModeSwitcher Component

**Files:**
- Create: `ExcelTemplateGen/components/TemplateModeSwitcher.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";

interface Props {
  manualContent: React.ReactNode;
  /** When omitted, the AI tab is not shown and manualContent renders directly. */
  chatContent?: React.ReactNode;
}

/**
 * Generic tab wrapper for the template configurator left sidebar.
 * Renders [Manual Config | AI Chat] tabs when chatContent is provided.
 * Falls back to rendering manualContent directly when chatContent is absent,
 * so this can be safely added to any template.
 */
export function TemplateModeSwitcher({ manualContent, chatContent }: Props) {
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  if (!chatContent) return <>{manualContent}</>;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "manual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Manual Config
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "ai"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ✨ AI Chat
        </button>
      </div>

      {mode === "manual" ? manualContent : chatContent}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/TemplateModeSwitcher.tsx
git commit -m "feat: add generic TemplateModeSwitcher tab component"
```

---

## Task 7: AIChatPanel Component

**Files:**
- Create: `ExcelTemplateGen/components/AIChatPanel.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import type { AzureResource, TemplateConfig } from "@/types/templates";

interface ResolvedResult {
  resources: AzureResource[];
  summary: string;
  totalMonthly: number;
}

interface Props {
  templateId: string;
  config: TemplateConfig;
  onGenerate: (resources: AzureResource[]) => Promise<void>;
  isGenerating: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = { AUD: "$", USD: "$", GBP: "£" };

export function AIChatPanel({ templateId, config, onGenerate, isGenerating }: Props) {
  const [message, setMessage] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolvedResult | null>(null);

  const sym = CURRENCY_SYMBOLS[config.currency as string] ?? "$";

  const handleAnalyse = async () => {
    if (!message.trim()) return;
    setIsAnalysing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/chat/${templateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, config }),
      });

      const data = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        throw new Error((data.error as string) ?? `Server error: ${response.status}`);
      }
      setResult(data as ResolvedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse resources");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      void handleAnalyse();
    }
  };

  return (
    <div className="space-y-4">
      {/* Instruction banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Describe your Azure resources in plain English.{" "}
        <em className="not-italic opacity-75">
          e.g. "1 Fabric F64 in prod, 2 Key Vaults, 3 storage accounts LRS in dev"
        </em>
      </div>

      {/* Textarea + analyse button */}
      <div className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (result) setResult(null);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 1 Fabric capacity in prod, 1 Key Vault in prod, 3 storage accounts..."
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
        />
        <p className="text-xs text-gray-400 text-right">Ctrl+Enter to analyse</p>
        <button
          type="button"
          onClick={() => void handleAnalyse()}
          disabled={isAnalysing || !message.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalysing ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analysing...
            </>
          ) : (
            "Analyse Resources"
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* AI summary */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {result.summary}
          </div>

          {/* Resource list */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Matched Resources
              </span>
            </div>
            <ul className="divide-y divide-gray-100">
              {result.resources.map((resource, i) => (
                <li key={i} className="flex items-start justify-between px-4 py-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-emerald-500">✓</span>
                    <div className="min-w-0">
                      <span className="font-medium text-gray-800">{resource.name}</span>
                      <span className="ml-1.5 text-gray-400">×{resource.quantity}</span>
                      <span className="ml-1.5 hidden text-xs text-gray-400 sm:inline">
                        {resource.skuName} · {resource.environment}
                      </span>
                      {resource.notes && (
                        <div className="mt-0.5 text-xs text-amber-600">{resource.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 text-right font-mono text-sm text-gray-700">
                    {sym}
                    {(resource.unitMonthlyCost * resource.quantity).toLocaleString("en-AU", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                    /mo
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-600">Est. monthly total</span>
              <span className="font-mono text-base font-bold text-gray-900">
                {sym}
                {result.totalMonthly.toLocaleString("en-AU", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                /mo
              </span>
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={() => void onGenerate(result.resources)}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Generate &amp; Download Excel
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/AIChatPanel.tsx
git commit -m "feat: add AIChatPanel component for azure-calculator AI chat"
```

---

## Task 8: Wire Up TemplateConfigurator

This task integrates the tab switcher and AI panel into the existing configurator. The key change is: for `azure-calculator`, wrap the manual config in `TemplateModeSwitcher` with an `AIChatPanel` as the `chatContent`. For all other templates, the switcher renders as passthrough.

**Files:**
- Modify: `ExcelTemplateGen/app/template/[id]/TemplateConfigurator.tsx`

**Step 1: Add imports at the top of TemplateConfigurator.tsx**

After the existing imports, add:

```typescript
import { TemplateModeSwitcher } from "@/components/TemplateModeSwitcher";
import { AIChatPanel } from "@/components/AIChatPanel";
import type { AzureResource } from "@/types/templates";
```

**Step 2: Add `handleAIGenerate` callback**

Add this function inside the `TemplateConfigurator` component, after the existing `handleGenerate` function:

```typescript
  const handleAIGenerate = async (resources: AzureResource[]) => {
    setIsGenerating(true);
    setError(null);

    const configWithResources = { ...config, resources };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, config: configWithResources }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `${(config.projectName as string || template.name).replace(/[^a-z0-9]/gi, "_")}_${template.id}_ai.xlsx`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastDownloaded(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate template");
    } finally {
      setIsGenerating(false);
    }
  };
```

**Step 3: Build the manual config JSX into a variable**

In the return statement, find the `<aside className="space-y-4">` block. Extract its contents (everything inside `<aside>`) into a variable before the return, then reference it. Replace the `<aside>` contents with a `TemplateModeSwitcher`:

Find the `<aside className="space-y-4">` section (lines ~99–159) and replace the entire `<aside>` element with:

```tsx
        {/* ── Left panel: Configuration ──────────────────────────────────────── */}
        <aside className="space-y-4">
          <TemplateModeSwitcher
            manualContent={
              <>
                {/* Template info */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div>
                      <h1 className="text-base font-bold text-gray-900">{template.name}</h1>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Field groups */}
                {Object.entries(fieldGroups.groups).map(([groupName, fields]) => (
                  <div key={groupName} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{groupName}</h3>
                    <div className="space-y-4">
                      {fields.map((field) => (
                        <ConfigField
                          key={field.key}
                          field={field}
                          value={config[field.key]}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Ungrouped fields */}
                {fieldGroups.ungrouped.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="space-y-4">
                      {fieldGroups.ungrouped.map((field) => (
                        <ConfigField
                          key={field.key}
                          field={field}
                          value={config[field.key]}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                >
                  Reset to defaults
                </button>
              </>
            }
            chatContent={
              template.id === "azure-calculator" ? (
                <AIChatPanel
                  templateId={template.id}
                  config={config}
                  onGenerate={handleAIGenerate}
                  isGenerating={isGenerating}
                />
              ) : undefined
            }
          />
        </aside>
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 5: Manual end-to-end test**

1. Start dev server: `npm run dev`
2. Open `http://localhost:3000/template/azure-calculator`
3. Verify [Manual Config] and [✨ AI Chat] tabs appear in the left sidebar
4. Click Manual Config tab — form fields visible, Generate button works as before
5. Click AI Chat tab — textarea + "Analyse Resources" button visible
6. Type: `1 Key Vault in production and 2 storage accounts in development`
7. Click "Analyse Resources" — spinner appears, then resource list with costs appears
8. Click "Generate & Download Excel" — file downloads
9. Open the Excel — rows should be pre-filled with "Key Vault", "Storage Account" (or closest match), with real prices in the cost columns

**Step 6: Test with another template (e.g. budget)**

Open `http://localhost:3000/template/budget` — no tabs should appear, form renders as before.

**Step 7: Commit**

```bash
git add app/template/
git commit -m "feat: wire up AI chat tab in TemplateConfigurator for azure-calculator"
```

---

## Task 9: CLAUDE.md

**Files:**
- Create: `ExcelTemplateGen/CLAUDE.md`

**Step 1: Create the file**

```markdown
# ExcelGen — Claude Code Context

## What This Project Is
A Next.js 16 web app that generates formatted Excel workbooks (.xlsx) from configurable templates. Users fill in a form, see a live preview, and download the Excel. Nothing is stored server-side.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4
- **Excel:** ExcelJS 4
- **AI:** Provider-agnostic abstraction (`lib/ai/`) — Anthropic default, OpenAI and Azure OpenAI supported

## Key Patterns

### Adding a Template
See `docs/ADDING_TEMPLATES.md`. Short version:
1. Create `lib/templates/<name>.ts` — export a `TemplateDefinition` and a `generate<Name>Workbook` function
2. Register in `lib/templates/index.ts`
3. Add preview generator to `lib/previews.ts`
4. Add features list entry in `TemplateConfigurator.tsx` (`getTemplateFeatures`)

### Config System
`TemplateConfig` is a flat `Record<string, string | number | boolean | string[]>`. Template fields are declared in the `fields` array of `TemplateDefinition`. The Azure Calculator also supports `config.resources: AzureResource[]` for AI-populated rows.

### AI Chat
- Only `azure-calculator` has AI chat in v1
- Route: `POST /api/chat/[templateId]` — message → AI → real price lookup → `AzureResource[]`
- Provider selected by `AI_PROVIDER` env var (`anthropic` | `openai` | `azure`)
- The AI **never** provides prices — prices are always resolved server-side from `azure-pricing-lookup.json`

### Important: Pricing Data
`lib/data/azure-pricing-lookup.json` is 341KB. **Server-side only.** Never import in client components or you will break the build. See `lib/data/README.md`.

## File Map
```
app/
  api/generate/route.ts            POST → Excel binary download
  api/chat/[templateId]/route.ts   POST → AI resource resolution
  template/[id]/
    page.tsx                        Server component (loads template)
    TemplateConfigurator.tsx        Client: config form + tabs + preview
components/
  AIChatPanel.tsx                   AI chat UI (azure-calculator)
  ConfigField.tsx                   Form field renderer
  PreviewPane.tsx                   Live preview table
  TemplateCard.tsx                  Template listing card
  TemplateModeSwitcher.tsx          Generic [Manual | AI Chat] tab wrapper
lib/
  ai/                               AI provider abstraction
    types.ts                        AIProvider interface
    anthropic.ts                    Anthropic implementation
    openai.ts                       OpenAI + Azure OpenAI implementation
    index.ts                        Provider resolver
  data/
    azure-pricing.ts                Helper functions + types
    azure-pricing-lookup.json       1,971 SKU price entries (server-only)
    azure-service-catalogue.ts      Compact catalogue for AI prompts
  templates/
    index.ts                        Registry + generateWorkbook dispatcher
    azure-calculator.ts             Azure cost estimation template
    budget.ts / gantt.ts / ...      Other templates
  previews.ts                       Client-side preview generators
types/
  templates.ts                      Shared types (TemplateDefinition, AzureResource, etc.)
docs/
  ADDING_TEMPLATES.md               How to add a new template
  plans/                            Design documents
```

## Running Locally
```bash
cd ExcelTemplateGen
cp .env.local.example .env.local   # fill in your AI provider key
npm install
npm run dev
```

## No Test Framework
TypeScript compilation is the primary static check. Use `npx tsc --noEmit` to verify types. Browser + curl for runtime testing.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project context for Claude Code"
```

---

## Task 10: docs/ADDING_TEMPLATES.md

**Files:**
- Create: `ExcelTemplateGen/docs/ADDING_TEMPLATES.md`

**Step 1: Create the file**

```markdown
# Adding a New Excel Template

This guide walks through adding a new template to ExcelGen. You'll need an existing Excel file you want to replicate, or a clear idea of what the output should look like.

## Overview of What You're Building

Each template consists of four parts:
1. **Template definition** — metadata and form fields (`lib/templates/<name>.ts`)
2. **Workbook generator** — the ExcelJS code that builds the `.xlsx` (`lib/templates/<name>.ts`)
3. **Preview generator** — a lightweight client-side function that renders the preview table (`lib/previews.ts`)
4. **Registration** — wiring the template into the app (`lib/templates/index.ts`, `TemplateConfigurator.tsx`)

---

## Step 1: Study Your Existing Excel File

Open your Excel file and identify:

- **What varies between uses?** These become your config fields (project name, date range, currency, etc.)
- **What is structural / fixed?** This goes in the workbook generator as hardcoded layout.
- **What sheets does it have?** Plan one worksheet per logical section.
- **What formulas does it use?** ExcelJS supports formulas via `{ formula: "=SUM(A1:A10)" }`.

---

## Step 2: Choose a Template ID and Name

Pick a short, URL-safe ID: `my-template`. This becomes:
- The route: `/template/my-template`
- The file: `lib/templates/my-template.ts`
- The key in the template registry

---

## Step 3: Create `lib/templates/my-template.ts`

Copy the structure from a simple existing template. `lib/templates/invoice.ts` is a good starting point for single-sheet templates. `lib/templates/azure-calculator.ts` is good for multi-sheet templates with real data.

**Minimal skeleton:**

```typescript
import type { TemplateDefinition, TemplateConfig, PreviewRow } from "@/types/templates";
import ExcelJS from "exceljs";

export const myTemplate: TemplateDefinition = {
  id: "my-template",
  name: "My Template Name",
  description: "One sentence describing what this generates.",
  category: "finance", // finance | project | consulting | azure
  icon: "📊",
  tags: ["tag1", "tag2"],
  fields: [
    {
      key: "projectName",
      label: "Project Name",
      type: "text",
      defaultValue: "My Project",
      group: "Project",
    },
    // Add more fields here — see FieldType in types/templates.ts
    // Types: text | textarea | color | number | select | toggle | tags
  ],
  generatePreview: (config: TemplateConfig): PreviewRow[] => {
    // Return an array of rows for the live preview table.
    // Each row is an array of PreviewCell objects.
    // This runs client-side — keep it lightweight (no ExcelJS).
    return [
      [{ value: config.projectName as string, colSpan: 3, style: { bold: true } }],
      [{ value: "Column A", isHeader: true }, { value: "Column B", isHeader: true }, { value: "Column C", isHeader: true }],
      [{ value: "Row 1" }, { value: "Data" }, { value: "123" }],
    ];
  },
};

export async function generateMyTemplateWorkbook(config: TemplateConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.projectName as string;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Sheet 1");

  // Set column widths
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 20;

  // Title row
  sheet.mergeCells("A1:C1");
  sheet.getCell("A1").value = config.projectName as string;
  sheet.getCell("A1").font = { bold: true, size: 14 };

  // Add your rows here...

  return workbook;
}
```

**Available field types** (from `types/templates.ts`):

| Type | Renders as | Notes |
|------|-----------|-------|
| `text` | Text input | Simple string |
| `textarea` | Multi-line input | Use for longer text |
| `color` | Color picker | Returns `#RRGGBB` string |
| `number` | Number input | Supports `min`, `max` |
| `select` | Dropdown | Requires `options: [{ label, value }]` |
| `toggle` | On/Off switch | Returns boolean |
| `tags` | Tag pill input | Returns `string[]` |

---

## Step 4: Register the Template in `lib/templates/index.ts`

Open `lib/templates/index.ts` and add your template in three places:

**1. Import:**
```typescript
import { myTemplate, generateMyTemplateWorkbook } from "./my-template";
```

**2. Add to the `templates` array:**
```typescript
export const templates: TemplateDefinition[] = [
  // ... existing templates ...
  myTemplate,
];
```

**3. Add a case to `generateWorkbook`:**
```typescript
case "my-template":
  return generateMyTemplateWorkbook(config);
```

---

## Step 5: Add a Preview Generator in `lib/previews.ts`

Open `lib/previews.ts`. The `previewGenerators` map keys match template IDs.

Add an entry:
```typescript
"my-template": (config) => myTemplate.generatePreview(config),
```

If `generatePreview` is already defined on your `TemplateDefinition` (which it is if you followed Step 3), this is all you need.

---

## Step 6: Add a Features List in `TemplateConfigurator.tsx`

Open `app/template/[id]/TemplateConfigurator.tsx` and find the `getTemplateFeatures` function at the bottom. Add your template's features:

```typescript
"my-template": [
  "What sheet 1 contains",
  "What formulas it includes",
  "Other notable features",
],
```

---

## Step 7: Test Locally

```bash
npm run dev
```

1. Visit `http://localhost:3000` — your template card should appear
2. Click it — the config form should render with your fields
3. The live preview table should update as you change fields
4. Click "Generate & Download Excel" — the file should download
5. Open the file in Excel and verify it matches your expectations

---

## Step 8: Commit

```bash
git add lib/templates/my-template.ts lib/templates/index.ts lib/previews.ts app/template/
git commit -m "feat: add my-template Excel template"
```

---

## Tips

### Styling cells consistently
Look at the `applyHeaderStyle` and `applyDataStyle` helper functions in `azure-calculator.ts` — copy them into your file for consistent borders, fonts, and fills.

### Formulas
```typescript
cell.value = { formula: `SUM(B2:B${lastRow})` };
cell.numFmt = '"$"#,##0.00';
```

### Merged cells
```typescript
sheet.mergeCells("A1:D1");
// Then style sheet.getCell("A1") — the top-left cell of the merged range
```

### Freezing rows/columns
```typescript
sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }]; // freeze first 3 rows
```

### Data validation (dropdowns in cells)
```typescript
cell.dataValidation = {
  type: "list",
  allowBlank: false,
  formulae: ['"Option A,Option B,Option C"'],
};
```

### Auto-filter
```typescript
sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } };
```

### Adding AI chat support to a new template
1. Create `app/api/chat/[templateId]/route.ts` with a handler that understands your template's config
2. Create a `<YourTemplateChatPanel>` component similar to `AIChatPanel.tsx`
3. In your template's configurator (or in `TemplateConfigurator.tsx`), pass `chatContent={<YourTemplateChatPanel ... />}` to `TemplateModeSwitcher`

The `TemplateModeSwitcher` component handles the tab UI automatically — you only need to provide the chat content.
```

**Step 2: Commit**

```bash
git add docs/ADDING_TEMPLATES.md
git commit -m "docs: add template authoring guide"
```

---

## Task 11: Final Verification

**Step 1: Full TypeScript check**

```bash
cd ExcelTemplateGen
npx tsc --noEmit
```

Expected: zero errors.

**Step 2: Lint check**

```bash
npm run lint
```

Fix any warnings before proceeding.

**Step 3: End-to-end smoke test**

With dev server running (`npm run dev`):

| Test | Expected |
|------|---------|
| `http://localhost:3000` | Template cards visible, azure-calculator shows |
| Manual config → Generate | Placeholder-row Excel downloads |
| AI Chat tab → "1 Key Vault prod, 2 VMs dev" → Analyse | Resource list appears with real prices |
| AI Chat → Generate | Pre-filled Excel downloads with named rows |
| `http://localhost:3000/template/budget` | No AI tab visible, form works as before |
| `curl -X POST /api/chat/budget` | Returns 400 "AI chat not supported" |
| Bad API key in `.env.local` | Chat returns readable error, not a crash |

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: AI chat interface for Azure Calculator — complete implementation"
```

---

## Implementation Notes

### Why `require()` instead of `import` in `lib/ai/index.ts`
Dynamic `require()` defers SDK loading until first use. This avoids Next.js attempting to bundle `@anthropic-ai/sdk` into client components during build — both SDKs must remain server-side only.

### Why the AI never provides prices
The AI's training data has stale, inaccurate, or hallucinated Azure prices. Prices are always resolved from `azure-pricing-lookup.json` after the AI returns service/SKU identifiers. If a SKU is not found, the row gets cost 0 and a note — never a made-up number.

### Extending to other templates
The `/api/chat/[templateId]` route currently rejects all template IDs except `azure-calculator`. To add chat to another template, create a new handler at the same path that interprets that template's config domain. The `getAIProvider()` function and `AIProvider` interface are shared.
```
