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
