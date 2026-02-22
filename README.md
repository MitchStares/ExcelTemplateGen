# ExcelGen — Excel Template Generator

A web-based Excel template generator inspired by [PaperMe](https://paperme.pixzens.com/), focused on professional Excel files for consulting, finance, and project management.

## What it does

Pick a template, customise colours, branding, structure, and settings, then download a fully formatted `.xlsx` file ready to use in Microsoft Excel — complete with formulas, multiple sheets, data validation dropdowns, and print-ready layouts.

## Templates (v0.1 POC)

| Category | Template | Sheets |
|---|---|---|
| Finance | Budget & Expense Tracker | Expenses, Income, Summary |
| Finance | Invoice / Quote | Invoice (print-ready) |
| Project | Project Timeline / Gantt | Gantt Chart, Task Register |
| Consulting | RBAC Matrix | RBAC Matrix, Roles Register, Legend |
| Azure | Azure Platform Calculator | Cost Estimate, By Environment |
| Consulting | User Stories & Personas | Story Backlog, Epics, Persona Profiles |

## Customisation options

- **Colour themes** — header and accent colours applied throughout
- **Branding** — company name, contact details, ABN/reg, payment info
- **Sheet structure** — number of rows, months, tasks, phases, categories etc.
- **Data settings** — currency, tax rates, date formats, story point scales
- **Toggles** — optional columns (RACI, MoSCoW, Status, Persona profiles, etc.)

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **ExcelJS** — server-side Excel generation (API routes)
- **Tailwind CSS** — UI styling
- API route: `POST /api/generate` — accepts `{ templateId, config }`, returns `.xlsx` binary

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding templates

1. Create `lib/templates/your-template.ts` — export a `TemplateDefinition` and a `generateXxxWorkbook` function
2. Add a preview generator to `lib/previews.ts`
3. Register in `lib/templates/index.ts`

## Roadmap / future

- Upload your own logo (embedded in the Excel file)
- More Azure-specific templates (cost breakdown by landing zone, etc.)
- Saved configurations (local storage or auth)
- Custom template upload / import from consulting library
