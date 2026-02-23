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
