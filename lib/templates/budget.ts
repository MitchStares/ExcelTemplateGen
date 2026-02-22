import type { TemplateDefinition, TemplateConfig, PreviewRow } from "@/types/templates";
import ExcelJS from "exceljs";

export const budgetTemplate: TemplateDefinition = {
  id: "budget",
  name: "Budget & Expense Tracker",
  description: "Monthly expense tracker with category breakdowns, totals, and a summary dashboard tab.",
  category: "finance",
  icon: "💰",
  tags: ["finance", "budget", "expenses", "monthly"],
  fields: [
    { key: "companyName", label: "Company / Name", type: "text", defaultValue: "Acme Corp", placeholder: "Your company or name", group: "Branding" },
    { key: "reportTitle", label: "Report Title", type: "text", defaultValue: "Annual Budget Tracker", placeholder: "e.g. FY2025 Budget", group: "Branding" },
    { key: "headerColor", label: "Header Colour", type: "color", defaultValue: "#1E3A5F", group: "Branding" },
    { key: "accentColor", label: "Accent Colour", type: "color", defaultValue: "#2E86AB", group: "Branding" },
    { key: "currency", label: "Currency", type: "select", defaultValue: "AUD", options: [
      { label: "AUD ($)", value: "AUD" },
      { label: "USD ($)", value: "USD" },
      { label: "GBP (£)", value: "GBP" },
      { label: "EUR (€)", value: "EUR" },
      { label: "CAD ($)", value: "CAD" },
    ], group: "Settings" },
    { key: "months", label: "Number of Months", type: "number", defaultValue: 12, min: 1, max: 12, group: "Settings" },
    { key: "categories", label: "Expense Categories", type: "tags", defaultValue: ["Salaries", "Software & Licences", "Travel", "Marketing", "Infrastructure", "Miscellaneous"], group: "Settings" },
    { key: "incomeCategories", label: "Income Categories", type: "tags", defaultValue: ["Consulting Revenue", "Support Contracts", "Other Income"], group: "Settings" },
  ],
  generatePreview: (config: TemplateConfig): PreviewRow[] => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    const cats = config.categories as string[];
    const currency = config.currency as string;
    const sym = { AUD: "$", USD: "$", GBP: "£", EUR: "€", CAD: "$" }[currency] || "$";
    return [
      [
        { value: (config.companyName as string) || "Company", colSpan: 4, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
      ],
      [
        { value: (config.reportTitle as string) || "Budget Tracker", colSpan: 4, style: { background: acc, color: "#fff", bold: true, align: "center" } },
      ],
      [
        { value: "Category", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "Jan", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Feb", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Total", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
      ],
      ...cats.slice(0, 4).map((cat) => ([
        { value: cat, style: { align: "left" as const } },
        { value: `${sym} -`, style: { align: "right" as const } },
        { value: `${sym} -`, style: { align: "right" as const } },
        { value: `${sym} -`, style: { align: "right" as const } },
      ])),
      [
        { value: "TOTAL", style: { background: acc, color: "#fff", bold: true } },
        { value: `${sym} 0`, style: { background: "#e8f4f8", bold: true, align: "right" as const } },
        { value: `${sym} 0`, style: { background: "#e8f4f8", bold: true, align: "right" as const } },
        { value: `${sym} 0`, style: { background: "#e8f4f8", bold: true, align: "right" as const } },
      ],
    ];
  },
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENCY_SYMBOLS: Record<string, string> = { AUD: "$", USD: "$", GBP: "£", EUR: "€", CAD: "$" };

function applyHeaderStyle(cell: ExcelJS.Cell, bgColor: string, fontColor = "FFFFFFFF") {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor.replace("#", "FF") } };
  cell.font = { bold: true, color: { argb: fontColor.replace("#", "FF") }, name: "Calibri", size: 11 };
  cell.border = {
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
  };
}

function applyDataStyle(cell: ExcelJS.Cell, bgColor?: string) {
  if (bgColor) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor.replace("#", "FF") } };
  }
  cell.font = { name: "Calibri", size: 10 };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE0E0E0" } },
    bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
    left: { style: "thin", color: { argb: "FFE0E0E0" } },
    right: { style: "thin", color: { argb: "FFE0E0E0" } },
  };
}

export async function generateBudgetWorkbook(config: TemplateConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.companyName as string;
  workbook.created = new Date();

  const hdrArgb = (config.headerColor as string).replace("#", "FF");
  const accArgb = (config.accentColor as string).replace("#", "FF");
  const months = Math.min(Number(config.months) || 12, 12);
  const currency = config.currency as string;
  const sym = CURRENCY_SYMBOLS[currency] || "$";
  const cats = config.categories as string[];
  const incCats = config.incomeCategories as string[];
  const monthCols = MONTH_NAMES.slice(0, months);

  // ── Expenses Sheet ─────────────────────────────────────────────────────────
  const expSheet = workbook.addWorksheet("Expenses", { views: [{ state: "frozen", xSplit: 1, ySplit: 4 }] });
  expSheet.properties.defaultColWidth = 14;
  expSheet.getColumn(1).width = 28;

  // Title row
  expSheet.mergeCells(1, 1, 1, months + 3);
  const titleCell = expSheet.getCell(1, 1);
  titleCell.value = `${config.companyName} — ${config.reportTitle}`;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  expSheet.getRow(1).height = 30;
  applyHeaderStyle(titleCell, config.headerColor as string);
  titleCell.font = { ...titleCell.font, size: 14 };

  // Subtitle
  expSheet.mergeCells(2, 1, 2, months + 3);
  const subCell = expSheet.getCell(2, 1);
  subCell.value = "EXPENSE TRACKER";
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  applyHeaderStyle(subCell, config.accentColor as string);
  expSheet.getRow(2).height = 20;

  // Blank separator
  expSheet.getRow(3).height = 6;

  // Column headers
  const headerRow = expSheet.getRow(4);
  headerRow.height = 20;
  headerRow.getCell(1).value = "Category";
  headerRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  applyHeaderStyle(headerRow.getCell(1), config.headerColor as string);

  monthCols.forEach((m, i) => {
    const cell = headerRow.getCell(i + 2);
    cell.value = m;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    applyHeaderStyle(cell, config.headerColor as string);
  });
  headerRow.getCell(months + 2).value = "Total";
  headerRow.getCell(months + 2).alignment = { horizontal: "center", vertical: "middle" };
  applyHeaderStyle(headerRow.getCell(months + 2), config.headerColor as string);
  headerRow.getCell(months + 3).value = "Budget";
  headerRow.getCell(months + 3).alignment = { horizontal: "center", vertical: "middle" };
  applyHeaderStyle(headerRow.getCell(months + 3), config.headerColor as string);

  // Data rows
  const dataStartRow = 5;
  cats.forEach((cat, ri) => {
    const row = expSheet.getRow(dataStartRow + ri);
    row.height = 18;
    row.getCell(1).value = cat;
    applyDataStyle(row.getCell(1));

    monthCols.forEach((_, ci) => {
      const cell = row.getCell(ci + 2);
      cell.value = 0;
      cell.numFmt = `"${sym}"#,##0.00`;
      applyDataStyle(cell, ri % 2 === 0 ? "#F9FAFB" : undefined);
      cell.alignment = { horizontal: "right" };
    });

    // Total formula
    const totalCell = row.getCell(months + 2);
    const startLetter = String.fromCharCode(64 + 2);
    const endLetter = String.fromCharCode(64 + months + 1);
    totalCell.value = { formula: `SUM(${startLetter}${dataStartRow + ri}:${endLetter}${dataStartRow + ri})` };
    totalCell.numFmt = `"${sym}"#,##0.00`;
    applyDataStyle(totalCell, "#EBF5FB");
    totalCell.font = { bold: true, name: "Calibri", size: 10 };
    totalCell.alignment = { horizontal: "right" };

    // Budget input
    const budgetCell = row.getCell(months + 3);
    budgetCell.value = 0;
    budgetCell.numFmt = `"${sym}"#,##0.00`;
    applyDataStyle(budgetCell, "#FFF9E6");
    budgetCell.alignment = { horizontal: "right" };
  });

  // Totals row
  const totalsRowNum = dataStartRow + cats.length;
  const totalsRow = expSheet.getRow(totalsRowNum);
  totalsRow.height = 22;
  totalsRow.getCell(1).value = "TOTAL";
  applyHeaderStyle(totalsRow.getCell(1), config.accentColor as string);
  totalsRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

  monthCols.forEach((_, ci) => {
    const colLetter = String.fromCharCode(64 + ci + 2);
    const cell = totalsRow.getCell(ci + 2);
    cell.value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${totalsRowNum - 1})` };
    cell.numFmt = `"${sym}"#,##0.00`;
    applyHeaderStyle(cell, config.accentColor as string);
    cell.alignment = { horizontal: "right", vertical: "middle" };
  });

  const totalTotalLetter = String.fromCharCode(64 + months + 2);
  totalsRow.getCell(months + 2).value = { formula: `SUM(${totalTotalLetter}${dataStartRow}:${totalTotalLetter}${totalsRowNum - 1})` };
  totalsRow.getCell(months + 2).numFmt = `"${sym}"#,##0.00`;
  applyHeaderStyle(totalsRow.getCell(months + 2), config.accentColor as string);
  totalsRow.getCell(months + 2).font = { bold: true, name: "Calibri", size: 11, color: { argb: "FFFFFFFF" } };

  const budgetTotalLetter = String.fromCharCode(64 + months + 3);
  totalsRow.getCell(months + 3).value = { formula: `SUM(${budgetTotalLetter}${dataStartRow}:${budgetTotalLetter}${totalsRowNum - 1})` };
  totalsRow.getCell(months + 3).numFmt = `"${sym}"#,##0.00`;
  applyHeaderStyle(totalsRow.getCell(months + 3), config.accentColor as string);

  // ── Income Sheet ───────────────────────────────────────────────────────────
  const incSheet = workbook.addWorksheet("Income", { views: [{ state: "frozen", xSplit: 1, ySplit: 4 }] });
  incSheet.properties.defaultColWidth = 14;
  incSheet.getColumn(1).width = 28;

  incSheet.mergeCells(1, 1, 1, months + 3);
  const incTitle = incSheet.getCell(1, 1);
  incTitle.value = `${config.companyName} — ${config.reportTitle}`;
  incTitle.alignment = { horizontal: "center", vertical: "middle" };
  incSheet.getRow(1).height = 30;
  applyHeaderStyle(incTitle, config.headerColor as string);
  incTitle.font = { ...incTitle.font, size: 14 };

  incSheet.mergeCells(2, 1, 2, months + 3);
  const incSub = incSheet.getCell(2, 1);
  incSub.value = "INCOME TRACKER";
  incSub.alignment = { horizontal: "center", vertical: "middle" };
  applyHeaderStyle(incSub, config.accentColor as string);
  incSheet.getRow(2).height = 20;
  incSheet.getRow(3).height = 6;

  const incHeader = incSheet.getRow(4);
  incHeader.height = 20;
  incHeader.getCell(1).value = "Category";
  incHeader.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  applyHeaderStyle(incHeader.getCell(1), config.headerColor as string);
  monthCols.forEach((m, i) => {
    const cell = incHeader.getCell(i + 2);
    cell.value = m;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    applyHeaderStyle(cell, config.headerColor as string);
  });
  incHeader.getCell(months + 2).value = "Total";
  incHeader.getCell(months + 2).alignment = { horizontal: "center", vertical: "middle" };
  applyHeaderStyle(incHeader.getCell(months + 2), config.headerColor as string);

  incCats.forEach((cat, ri) => {
    const row = incSheet.getRow(5 + ri);
    row.height = 18;
    row.getCell(1).value = cat;
    applyDataStyle(row.getCell(1));
    monthCols.forEach((_, ci) => {
      const cell = row.getCell(ci + 2);
      cell.value = 0;
      cell.numFmt = `"${sym}"#,##0.00`;
      applyDataStyle(cell, ri % 2 === 0 ? "#F9FAFB" : undefined);
      cell.alignment = { horizontal: "right" };
    });
    const endLetter = String.fromCharCode(64 + months + 1);
    const totalCell = row.getCell(months + 2);
    totalCell.value = { formula: `SUM(B${5 + ri}:${endLetter}${5 + ri})` };
    totalCell.numFmt = `"${sym}"#,##0.00`;
    applyDataStyle(totalCell, "#EBF5FB");
    totalCell.font = { bold: true, name: "Calibri", size: 10 };
    totalCell.alignment = { horizontal: "right" };
  });

  // ── Summary Sheet ──────────────────────────────────────────────────────────
  const sumSheet = workbook.addWorksheet("Summary");
  sumSheet.getColumn(1).width = 30;
  sumSheet.getColumn(2).width = 18;
  sumSheet.getColumn(3).width = 18;
  sumSheet.getColumn(4).width = 18;

  sumSheet.mergeCells("A1:D1");
  const sumTitle = sumSheet.getCell("A1");
  sumTitle.value = `${config.companyName} — Financial Summary`;
  sumTitle.alignment = { horizontal: "center", vertical: "middle" };
  sumSheet.getRow(1).height = 30;
  applyHeaderStyle(sumTitle, config.headerColor as string);
  sumTitle.font = { ...sumTitle.font, size: 14 };

  const summaryData = [
    ["", "Budget", "Actual", "Variance"],
    ["Total Income", `='Income'!${String.fromCharCode(64 + months + 2)}${5 + incCats.length}`, "—", "—"],
    ["Total Expenses", `='Expenses'!${String.fromCharCode(64 + months + 2)}${totalsRowNum}`, "—", "—"],
    ["Net Position", "=B3-B4", "—", "—"],
  ];

  summaryData.forEach((rowData, ri) => {
    const row = sumSheet.getRow(ri + 3);
    row.height = 20;
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      if (ri === 0) {
        cell.value = val;
        applyHeaderStyle(cell, config.accentColor as string);
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        if (typeof val === "string" && val.startsWith("=")) {
          cell.value = { formula: val.slice(1) };
          cell.numFmt = `"${sym}"#,##0.00`;
        } else {
          cell.value = val;
        }
        applyDataStyle(cell, ri % 2 === 0 ? "#F9FAFB" : undefined);
        cell.alignment = { horizontal: ci > 0 ? "right" : "left", vertical: "middle" };
      }
    });
  });

  return workbook;
}
