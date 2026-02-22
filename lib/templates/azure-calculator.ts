import type { TemplateDefinition, TemplateConfig, PreviewRow } from "@/types/templates";
import ExcelJS from "exceljs";

export const azureCalculatorTemplate: TemplateDefinition = {
  id: "azure-calculator",
  name: "Azure Platform Calculator",
  description: "Azure resource cost estimation template with resource types, SKUs, regions, and monthly/annual cost projections. Stub — populate with your pricing data.",
  category: "azure",
  icon: "☁️",
  tags: ["azure", "cloud", "cost", "calculator", "infrastructure"],
  fields: [
    { key: "projectName", label: "Project / Initiative Name", type: "text", defaultValue: "Azure Platform Modernisation", group: "Project" },
    { key: "companyName", label: "Organisation", type: "text", defaultValue: "Acme Corp", group: "Project" },
    { key: "currency", label: "Currency", type: "select", defaultValue: "AUD", options: [
      { label: "AUD ($)", value: "AUD" },
      { label: "USD ($)", value: "USD" },
      { label: "GBP (£)", value: "GBP" },
    ], group: "Project" },
    { key: "headerColor", label: "Header Colour", type: "color", defaultValue: "#0078D4", group: "Branding" },
    { key: "accentColor", label: "Accent Colour", type: "color", defaultValue: "#50E6FF", group: "Branding" },
    { key: "region", label: "Primary Azure Region", type: "select", defaultValue: "australiaeast", options: [
      { label: "Australia East", value: "australiaeast" },
      { label: "Australia Southeast", value: "australiasoutheast" },
      { label: "East US", value: "eastus" },
      { label: "West Europe", value: "westeurope" },
      { label: "UK South", value: "uksouth" },
      { label: "Southeast Asia", value: "southeastasia" },
    ], group: "Settings" },
    { key: "environments", label: "Environments", type: "tags", defaultValue: ["Production", "Development", "UAT"], group: "Settings" },
    { key: "resourceCategories", label: "Resource Categories", type: "tags", defaultValue: ["Compute", "Storage", "Networking", "Databases", "AI & ML", "Security", "Monitoring"], group: "Settings" },
    { key: "contingencyPct", label: "Contingency (%)", type: "number", defaultValue: 15, min: 0, max: 50, group: "Settings" },
    { key: "includeReserved", label: "Include Reserved Instance Savings", type: "toggle", defaultValue: true, group: "Settings" },
  ],
  generatePreview: (config: TemplateConfig): PreviewRow[] => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    const sym = { AUD: "$", USD: "$", GBP: "£" }[config.currency as string] || "$";
    return [
      [{ value: config.projectName as string, colSpan: 5, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [{ value: "Azure Cost Estimate", colSpan: 5, style: { background: acc, color: "#003087", bold: true, align: "center" } }],
      [
        { value: "Resource", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "SKU", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Qty", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Monthly", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "right" } },
        { value: "Annual", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "right" } },
      ],
      [{ value: "▶ Compute", colSpan: 5, style: { background: "#034078", color: "#fff", bold: true } }],
      [{ value: "App Service Plan", style: {} }, { value: "P2v3", style: { align: "center" } }, { value: "2", style: { align: "center" } }, { value: `${sym}580`, style: { align: "right" } }, { value: `${sym}6,960`, style: { align: "right" } }],
      [{ value: "▶ Storage", colSpan: 5, style: { background: "#034078", color: "#fff", bold: true } }],
      [{ value: "Storage Account (LRS)", style: {} }, { value: "Standard", style: { align: "center" } }, { value: "1", style: { align: "center" } }, { value: `${sym}42`, style: { align: "right" } }, { value: `${sym}504`, style: { align: "right" } }],
      [{ value: "TOTAL (excl. contingency)", colSpan: 4, style: { background: acc, color: "#003087", bold: true } }, { value: `${sym}7,464`, style: { background: acc, color: "#003087", bold: true, align: "right" } }],
    ];
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = { AUD: "$", USD: "$", GBP: "£" };

function applyHeaderStyle(cell: ExcelJS.Cell, bgHex: string, fontHex = "#FFFFFF") {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgHex.replace("#", "") } };
  cell.font = { bold: true, color: { argb: "FF" + fontHex.replace("#", "") }, name: "Calibri", size: 10 };
  cell.border = {
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

function applyDataStyle(cell: ExcelJS.Cell, bgHex?: string) {
  if (bgHex) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgHex.replace("#", "") } };
  cell.font = { name: "Calibri", size: 10 };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE8E8E8" } },
    bottom: { style: "thin", color: { argb: "FFE8E8E8" } },
    left: { style: "thin", color: { argb: "FFE8E8E8" } },
    right: { style: "thin", color: { argb: "FFE8E8E8" } },
  };
}

function addCategoryBlock(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  category: string,
  resourceCount: number,
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

  for (let i = 0; i < resourceCount; i++) {
    const row = sheet.getRow(r);
    row.height = 18;

    // Resource name
    row.getCell(1).value = `${category} Resource ${i + 1}`;
    applyDataStyle(row.getCell(1), i % 2 === 0 ? "#F0F7FF" : undefined);

    // SKU / Tier
    row.getCell(2).value = "";
    row.getCell(2).alignment = { horizontal: "center" };
    applyDataStyle(row.getCell(2), i % 2 === 0 ? "#F9FAFB" : undefined);

    // Description
    row.getCell(3).value = "";
    applyDataStyle(row.getCell(3), i % 2 === 0 ? "#F9FAFB" : undefined);

    // Environment
    row.getCell(4).value = "";
    row.getCell(4).alignment = { horizontal: "center" };
    applyDataStyle(row.getCell(4), i % 2 === 0 ? "#F9FAFB" : undefined);

    // Quantity
    row.getCell(5).value = 1;
    row.getCell(5).numFmt = "0";
    row.getCell(5).alignment = { horizontal: "center" };
    applyDataStyle(row.getCell(5), i % 2 === 0 ? "#F9FAFB" : undefined);

    // Unit Monthly Cost
    row.getCell(6).value = 0;
    row.getCell(6).numFmt = `"${sym}"#,##0.00`;
    row.getCell(6).alignment = { horizontal: "right" };
    applyDataStyle(row.getCell(6), i % 2 === 0 ? "#FFF9E6" : "#FEFDF5");

    // Total Monthly Cost (formula: qty * unit)
    row.getCell(7).value = { formula: `E${r}*F${r}` };
    row.getCell(7).numFmt = `"${sym}"#,##0.00`;
    row.getCell(7).alignment = { horizontal: "right" };
    applyDataStyle(row.getCell(7), i % 2 === 0 ? "#EBF5FB" : "#F5FBFF");

    // Annual Cost (formula: monthly * 12)
    row.getCell(8).value = { formula: `G${r}*12` };
    row.getCell(8).numFmt = `"${sym}"#,##0.00`;
    row.getCell(8).alignment = { horizontal: "right" };
    applyDataStyle(row.getCell(8), i % 2 === 0 ? "#EBF5FB" : "#F5FBFF");

    // Notes
    if (totalCols >= 9) {
      row.getCell(9).value = "";
      applyDataStyle(row.getCell(9), i % 2 === 0 ? "#F9FAFB" : undefined);
    }

    r++;
  }

  // Category subtotal
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

export async function generateAzureCalculatorWorkbook(config: TemplateConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.companyName as string;
  workbook.created = new Date();

  const sym = CURRENCY_SYMBOLS[config.currency as string] || "$";
  const categories = config.resourceCategories as string[];
  const environments = config.environments as string[];
  const contingencyPct = Number(config.contingencyPct) / 100;
  const includeReserved = config.includeReserved as boolean;
  const resourcesPerCategory = 4;
  const TOTAL_COLS = 9;

  // ── Cost Sheet ──────────────────────────────────────────────────────────────
  const sheet = workbook.addWorksheet("Cost Estimate", { views: [{ state: "frozen", xSplit: 0, ySplit: 5 }] });

  sheet.getColumn(1).width = 30;  // Resource
  sheet.getColumn(2).width = 18;  // SKU / Tier
  sheet.getColumn(3).width = 28;  // Description
  sheet.getColumn(4).width = 16;  // Environment
  sheet.getColumn(5).width = 8;   // Qty
  sheet.getColumn(6).width = 16;  // Unit Monthly Cost
  sheet.getColumn(7).width = 16;  // Total Monthly
  sheet.getColumn(8).width = 16;  // Annual Cost
  sheet.getColumn(9).width = 30;  // Notes

  let r = 1;

  // Title
  sheet.mergeCells(r, 1, r, TOTAL_COLS);
  const titleCell = sheet.getCell(r, 1);
  titleCell.value = `${config.projectName as string}  —  Azure Cost Estimate`;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 32;
  applyHeaderStyle(titleCell, config.headerColor as string);
  titleCell.font = { ...titleCell.font, size: 16 };
  r++;

  // Subtitle
  sheet.mergeCells(r, 1, r, TOTAL_COLS);
  const subCell = sheet.getCell(r, 1);
  subCell.value = `Organisation: ${config.companyName as string}   |   Region: ${config.region as string}   |   Currency: ${config.currency as string}   |   Generated: ${new Date().toLocaleDateString("en-AU")}`;
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 16;
  applyHeaderStyle(subCell, config.accentColor as string);
  subCell.font = { ...subCell.font, size: 9, color: { argb: "FF003087" } };
  r++;

  // NOTE row
  sheet.mergeCells(r, 1, r, TOTAL_COLS);
  sheet.getCell(r, 1).value = "⚠️  STUB TEMPLATE — Replace unit costs with actual Azure pricing from https://azure.microsoft.com/en-au/pricing/calculator/";
  sheet.getCell(r, 1).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF8B4513" } };
  sheet.getCell(r, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
  sheet.getCell(r, 1).alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 14;
  r++;
  r++; // blank

  // Column headers
  const colHeaders = ["Resource / Service", "SKU / Tier", "Description", "Environment", "Qty", `Unit Cost (${sym}/mo)`, `Monthly Total (${sym})`, `Annual Total (${sym})`, "Notes"];
  const headerRow = sheet.getRow(r);
  headerRow.height = 32;
  colHeaders.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h;
    applyHeaderStyle(headerRow.getCell(i + 1), config.headerColor as string);
    headerRow.getCell(i + 1).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  r++;

  // Category blocks
  const categoryStartRows: number[] = [];
  const categoryEndRows: number[] = [];

  categories.forEach((cat) => {
    categoryStartRows.push(r);
    r = addCategoryBlock(sheet, r, cat, resourcesPerCategory, TOTAL_COLS, config.headerColor as string, sym);
    categoryEndRows.push(r - 2); // -2 for blank gap and subtotal
  });

  // Grand totals
  r++;
  const grandTotalRow = sheet.getRow(r);
  grandTotalRow.height = 24;
  sheet.mergeCells(r, 1, r, 6);
  grandTotalRow.getCell(1).value = "GRAND TOTAL (before contingency)";
  grandTotalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(grandTotalRow.getCell(1), config.accentColor as string);
  grandTotalRow.getCell(1).font = { bold: true, name: "Calibri", size: 11, color: { argb: "FF003087" } };

  // Sum all G column subtotals
  const subtotalRows = categoryStartRows.map((s, i) => {
    const catEnd = s + resourcesPerCategory; // subtotal row
    return `G${catEnd + 1}`;
  });
  const monthlyFormula = subtotalRows.join("+");

  grandTotalRow.getCell(7).value = { formula: monthlyFormula };
  grandTotalRow.getCell(7).numFmt = `"${sym}"#,##0.00`;
  grandTotalRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(grandTotalRow.getCell(7), config.accentColor as string);
  grandTotalRow.getCell(7).font = { bold: true, name: "Calibri", size: 11, color: { argb: "FF003087" } };
  grandTotalRow.getCell(8).value = { formula: `G${r}*12` };
  grandTotalRow.getCell(8).numFmt = `"${sym}"#,##0.00`;
  grandTotalRow.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(grandTotalRow.getCell(8), config.accentColor as string);
  grandTotalRow.getCell(8).font = { bold: true, name: "Calibri", size: 11, color: { argb: "FF003087" } };
  applyHeaderStyle(grandTotalRow.getCell(9), config.accentColor as string);
  r++;

  // Contingency row
  const contRow = sheet.getRow(r);
  contRow.height = 20;
  sheet.mergeCells(r, 1, r, 6);
  contRow.getCell(1).value = `Contingency (${config.contingencyPct}%)`;
  contRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  contRow.getCell(1).font = { name: "Calibri", size: 10 };
  applyDataStyle(contRow.getCell(1), "#FFF9E6");
  contRow.getCell(7).value = { formula: `G${r - 1}*${contingencyPct}` };
  contRow.getCell(7).numFmt = `"${sym}"#,##0.00`;
  contRow.getCell(7).alignment = { horizontal: "right" };
  applyDataStyle(contRow.getCell(7), "#FFF9E6");
  contRow.getCell(8).value = { formula: `H${r - 1}*${contingencyPct}` };
  contRow.getCell(8).numFmt = `"${sym}"#,##0.00`;
  contRow.getCell(8).alignment = { horizontal: "right" };
  applyDataStyle(contRow.getCell(8), "#FFF9E6");
  applyDataStyle(contRow.getCell(9), "#FFF9E6");
  r++;

  if (includeReserved) {
    const riRow = sheet.getRow(r);
    riRow.height = 20;
    sheet.mergeCells(r, 1, r, 6);
    riRow.getCell(1).value = "Reserved Instance Savings (est. -30%)";
    riRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
    riRow.getCell(1).font = { name: "Calibri", size: 10, color: { argb: "FF27AE60" } };
    applyDataStyle(riRow.getCell(1), "#E9F7EF");
    riRow.getCell(7).value = { formula: `G${r - 2}*-0.3` };
    riRow.getCell(7).numFmt = `"${sym}"#,##0.00`;
    riRow.getCell(7).alignment = { horizontal: "right" };
    riRow.getCell(7).font = { name: "Calibri", size: 10, color: { argb: "FF27AE60" } };
    applyDataStyle(riRow.getCell(7), "#E9F7EF");
    riRow.getCell(8).value = { formula: `H${r - 2}*-0.3` };
    riRow.getCell(8).numFmt = `"${sym}"#,##0.00`;
    riRow.getCell(8).alignment = { horizontal: "right" };
    riRow.getCell(8).font = { name: "Calibri", size: 10, color: { argb: "FF27AE60" } };
    applyDataStyle(riRow.getCell(8), "#E9F7EF");
    applyDataStyle(riRow.getCell(9), "#E9F7EF");
    r++;
  }

  // Total including contingency
  const finalRow = sheet.getRow(r);
  finalRow.height = 28;
  sheet.mergeCells(r, 1, r, 6);
  finalRow.getCell(1).value = "TOTAL ESTIMATE (incl. contingency)";
  finalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(finalRow.getCell(1), config.headerColor as string);
  finalRow.getCell(1).font = { bold: true, name: "Calibri", size: 12, color: { argb: "FFFFFFFF" } };

  const totalMonthly = includeReserved ? `G${r - 3}+G${r - 2}+G${r - 1}` : `G${r - 2}+G${r - 1}`;
  finalRow.getCell(7).value = { formula: totalMonthly };
  finalRow.getCell(7).numFmt = `"${sym}"#,##0.00`;
  finalRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(finalRow.getCell(7), config.headerColor as string);
  finalRow.getCell(7).font = { bold: true, name: "Calibri", size: 12, color: { argb: "FFFFFFFF" } };
  finalRow.getCell(8).value = { formula: `G${r}*12` };
  finalRow.getCell(8).numFmt = `"${sym}"#,##0.00`;
  finalRow.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(finalRow.getCell(8), config.headerColor as string);
  finalRow.getCell(8).font = { bold: true, name: "Calibri", size: 12, color: { argb: "FFFFFFFF" } };
  applyHeaderStyle(finalRow.getCell(9), config.headerColor as string);

  // ── Environments Summary ──────────────────────────────────────────────────
  const envSheet = workbook.addWorksheet("By Environment");
  envSheet.getColumn(1).width = 26;
  environments.forEach((_, i) => { envSheet.getColumn(i + 2).width = 18; });

  envSheet.mergeCells(1, 1, 1, environments.length + 1);
  applyHeaderStyle(envSheet.getCell("A1"), config.headerColor as string);
  envSheet.getCell("A1").value = "Cost Breakdown by Environment";
  envSheet.getRow(1).height = 24;

  const envHeaderRow = envSheet.getRow(2);
  envHeaderRow.height = 20;
  envHeaderRow.getCell(1).value = "Resource Category";
  applyHeaderStyle(envHeaderRow.getCell(1), config.accentColor as string);
  envHeaderRow.getCell(1).font = { ...envHeaderRow.getCell(1).font, color: { argb: "FF003087" } };
  environments.forEach((env, i) => {
    envHeaderRow.getCell(i + 2).value = env;
    applyHeaderStyle(envHeaderRow.getCell(i + 2), config.accentColor as string);
    envHeaderRow.getCell(i + 2).font = { ...envHeaderRow.getCell(i + 2).font, color: { argb: "FF003087" } };
  });

  categories.forEach((cat, ri) => {
    const eRow = envSheet.getRow(ri + 3);
    eRow.height = 18;
    eRow.getCell(1).value = cat;
    eRow.getCell(1).font = { bold: true, name: "Calibri", size: 10 };
    applyDataStyle(eRow.getCell(1), ri % 2 === 0 ? "#F0F7FF" : undefined);
    environments.forEach((_, ei) => {
      eRow.getCell(ei + 2).value = 0;
      eRow.getCell(ei + 2).numFmt = `"${sym}"#,##0.00`;
      eRow.getCell(ei + 2).alignment = { horizontal: "right" };
      applyDataStyle(eRow.getCell(ei + 2), ri % 2 === 0 ? "#F9FAFB" : undefined);
    });
  });

  void categoryEndRows;
  return workbook;
}
