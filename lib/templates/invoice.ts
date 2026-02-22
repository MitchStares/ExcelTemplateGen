import type { TemplateDefinition, TemplateConfig, PreviewRow } from "@/types/templates";
import ExcelJS from "exceljs";

export const invoiceTemplate: TemplateDefinition = {
  id: "invoice",
  name: "Invoice / Quote",
  description: "Professional invoice or quote template with line items, tax, and payment details.",
  category: "finance",
  icon: "🧾",
  tags: ["invoice", "quote", "billing", "finance"],
  fields: [
    { key: "companyName", label: "Your Company Name", type: "text", defaultValue: "Acme Consulting Pty Ltd", group: "Your Details" },
    { key: "companyAbn", label: "ABN / Company Reg.", type: "text", defaultValue: "ABN 12 345 678 901", group: "Your Details" },
    { key: "companyAddress", label: "Address", type: "textarea", defaultValue: "123 Collins St, Melbourne VIC 3000", group: "Your Details" },
    { key: "companyEmail", label: "Email", type: "text", defaultValue: "billing@acme.com.au", group: "Your Details" },
    { key: "companyPhone", label: "Phone", type: "text", defaultValue: "+61 3 9000 0000", group: "Your Details" },
    { key: "headerColor", label: "Header Colour", type: "color", defaultValue: "#1E3A5F", group: "Branding" },
    { key: "accentColor", label: "Accent Colour", type: "color", defaultValue: "#2E86AB", group: "Branding" },
    { key: "documentType", label: "Document Type", type: "select", defaultValue: "Invoice", options: [
      { label: "Invoice", value: "Invoice" },
      { label: "Quote", value: "Quote" },
      { label: "Tax Invoice", value: "Tax Invoice" },
      { label: "Proforma Invoice", value: "Proforma Invoice" },
    ], group: "Settings" },
    { key: "currency", label: "Currency", type: "select", defaultValue: "AUD", options: [
      { label: "AUD ($)", value: "AUD" },
      { label: "USD ($)", value: "USD" },
      { label: "GBP (£)", value: "GBP" },
      { label: "EUR (€)", value: "EUR" },
      { label: "CAD ($)", value: "CAD" },
    ], group: "Settings" },
    { key: "taxRate", label: "Tax Rate (%)", type: "number", defaultValue: 10, min: 0, max: 100, group: "Settings" },
    { key: "taxLabel", label: "Tax Label", type: "text", defaultValue: "GST", placeholder: "GST / VAT / Tax", group: "Settings" },
    { key: "lineItems", label: "Number of Line Item Rows", type: "number", defaultValue: 10, min: 3, max: 30, group: "Settings" },
    { key: "paymentTerms", label: "Payment Terms", type: "text", defaultValue: "Net 30 days", group: "Settings" },
    { key: "bankDetails", label: "Bank / Payment Details", type: "textarea", defaultValue: "BSB: 123-456  Account: 123456789\nBank: Commonwealth Bank of Australia", group: "Settings" },
    { key: "notes", label: "Notes / Terms", type: "textarea", defaultValue: "Thank you for your business. Please reference the invoice number when making payment.", group: "Settings" },
  ],
  generatePreview: (config: TemplateConfig): PreviewRow[] => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    const sym = { AUD: "$", USD: "$", GBP: "£", EUR: "€", CAD: "$" }[config.currency as string] || "$";
    return [
      [{ value: config.companyName as string, colSpan: 4, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [{ value: config.documentType as string, colSpan: 4, style: { background: acc, color: "#fff", bold: true, align: "center" } }],
      [
        { value: "Description", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "Qty", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Rate", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "right" } },
        { value: "Amount", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "right" } },
      ],
      [{ value: "Consulting Services", style: {} }, { value: "8", style: { align: "center" } }, { value: `${sym}150.00`, style: { align: "right" } }, { value: `${sym}1,200.00`, style: { align: "right" } }],
      [{ value: "Project Management", style: {} }, { value: "4", style: { align: "center" } }, { value: `${sym}200.00`, style: { align: "right" } }, { value: `${sym}800.00`, style: { align: "right" } }],
      [{ value: `Subtotal`, style: {} }, { value: "", style: {} }, { value: "", style: {} }, { value: `${sym}2,000.00`, style: { bold: true, align: "right" } }],
      [{ value: `${config.taxLabel} (${config.taxRate}%)`, style: {} }, { value: "", style: {} }, { value: "", style: {} }, { value: `${sym}200.00`, style: { align: "right" } }],
      [{ value: "TOTAL DUE", style: { background: acc, color: "#fff", bold: true } }, { value: "", style: { background: acc } }, { value: "", style: { background: acc } }, { value: `${sym}2,200.00`, style: { background: acc, color: "#fff", bold: true, align: "right" } }],
    ];
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = { AUD: "$", USD: "$", GBP: "£", EUR: "€", CAD: "$" };

function applyHeaderStyle(cell: ExcelJS.Cell, bgHex: string, fontColor = "#FFFFFF") {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgHex.replace("#", "") } };
  cell.font = { bold: true, color: { argb: "FF" + fontColor.replace("#", "") }, name: "Calibri", size: 11 };
  cell.border = {
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
  };
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

export async function generateInvoiceWorkbook(config: TemplateConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.companyName as string;
  workbook.created = new Date();

  const sym = CURRENCY_SYMBOLS[config.currency as string] || "$";
  const taxRate = Number(config.taxRate) / 100;
  const lineCount = Number(config.lineItems) || 10;
  const sheet = workbook.addWorksheet(config.documentType as string, { pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true } });

  // Column widths
  sheet.getColumn(1).width = 10;  // Col A: labels / item #
  sheet.getColumn(2).width = 40;  // Col B: description
  sheet.getColumn(3).width = 12;  // Col C: qty
  sheet.getColumn(4).width = 16;  // Col D: rate
  sheet.getColumn(5).width = 16;  // Col E: amount
  sheet.getColumn(6).width = 28;  // Col F: right side (client details, etc.)

  let r = 1;

  // ── Header banner ──────────────────────────────────────────────────────────
  sheet.mergeCells(r, 1, r, 6);
  const bannerCell = sheet.getCell(r, 1);
  bannerCell.value = config.companyName as string;
  bannerCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 36;
  applyHeaderStyle(bannerCell, config.headerColor as string);
  bannerCell.font = { ...bannerCell.font, size: 18 };
  r++;

  // ── ABN / contact row ──────────────────────────────────────────────────────
  sheet.mergeCells(r, 1, r, 3);
  sheet.getCell(r, 1).value = config.companyAbn as string;
  sheet.getCell(r, 1).font = { name: "Calibri", size: 9, color: { argb: "FF666666" } };
  sheet.getCell(r, 1).alignment = { horizontal: "left", vertical: "middle" };
  sheet.mergeCells(r, 4, r, 6);
  sheet.getCell(r, 4).value = `${config.companyEmail}  |  ${config.companyPhone}`;
  sheet.getCell(r, 4).font = { name: "Calibri", size: 9, color: { argb: "FF666666" } };
  sheet.getCell(r, 4).alignment = { horizontal: "right", vertical: "middle" };
  sheet.getRow(r).height = 16;
  r++;

  // ── Document type title ────────────────────────────────────────────────────
  sheet.mergeCells(r, 1, r, 6);
  const docTitle = sheet.getCell(r, 1);
  docTitle.value = (config.documentType as string).toUpperCase();
  docTitle.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 24;
  applyHeaderStyle(docTitle, config.accentColor as string);
  docTitle.font = { ...docTitle.font, size: 13 };
  r++;
  r++; // blank

  // ── Invoice metadata ───────────────────────────────────────────────────────
  const metaRow = r;
  // Left: Bill To
  sheet.mergeCells(r, 1, r, 1);
  sheet.getCell(r, 1).value = "BILL TO";
  applyHeaderStyle(sheet.getCell(r, 1), config.accentColor as string);
  sheet.getCell(r, 1).alignment = { horizontal: "center" };

  sheet.mergeCells(r, 2, r, 3);
  sheet.getCell(r, 2).value = "Client Company Name";
  sheet.getCell(r, 2).font = { bold: true, name: "Calibri", size: 11 };
  applyDataStyle(sheet.getCell(r, 2));

  // Right: Invoice #, Date, Due Date
  sheet.getCell(r, 4).value = "Invoice #";
  sheet.getCell(r, 4).font = { bold: true, name: "Calibri", size: 10 };
  sheet.getCell(r, 5).value = "INV-0001";
  sheet.mergeCells(r, 5, r, 6);
  applyDataStyle(sheet.getCell(r, 5));
  r++;

  sheet.mergeCells(r, 1, r, 1);
  sheet.getCell(r, 1).value = "";
  applyDataStyle(sheet.getCell(r, 1));
  sheet.mergeCells(r, 2, r, 3);
  sheet.getCell(r, 2).value = "Client Address Line 1";
  applyDataStyle(sheet.getCell(r, 2));
  sheet.getCell(r, 4).value = "Date";
  sheet.getCell(r, 4).font = { bold: true, name: "Calibri", size: 10 };
  sheet.mergeCells(r, 5, r, 6);
  sheet.getCell(r, 5).value = new Date();
  sheet.getCell(r, 5).numFmt = "DD/MM/YYYY";
  applyDataStyle(sheet.getCell(r, 5));
  r++;

  sheet.mergeCells(r, 2, r, 3);
  sheet.getCell(r, 2).value = "Client Address Line 2";
  applyDataStyle(sheet.getCell(r, 2));
  sheet.getCell(r, 4).value = "Due Date";
  sheet.getCell(r, 4).font = { bold: true, name: "Calibri", size: 10 };
  sheet.mergeCells(r, 5, r, 6);
  sheet.getCell(r, 5).value = "";
  applyDataStyle(sheet.getCell(r, 5));
  r++;

  sheet.mergeCells(r, 2, r, 3);
  sheet.getCell(r, 2).value = "";
  applyDataStyle(sheet.getCell(r, 2));
  sheet.getCell(r, 4).value = "Payment Terms";
  sheet.getCell(r, 4).font = { bold: true, name: "Calibri", size: 10 };
  sheet.mergeCells(r, 5, r, 6);
  sheet.getCell(r, 5).value = config.paymentTerms as string;
  applyDataStyle(sheet.getCell(r, 5));
  r++;
  r++; // blank

  // ── Line items header ──────────────────────────────────────────────────────
  const colHeaders = ["#", "Description", "Qty", "Unit Rate", "Amount", "Notes"];
  const lineHeaderRow = sheet.getRow(r);
  lineHeaderRow.height = 20;
  colHeaders.forEach((h, i) => {
    lineHeaderRow.getCell(i + 1).value = h;
    applyHeaderStyle(lineHeaderRow.getCell(i + 1), config.headerColor as string);
    lineHeaderRow.getCell(i + 1).alignment = { horizontal: i > 1 ? "center" : "left", vertical: "middle" };
  });
  r++;

  // ── Line item rows ─────────────────────────────────────────────────────────
  const lineStart = r;
  for (let i = 0; i < lineCount; i++) {
    const row = sheet.getRow(r + i);
    row.height = 18;
    row.getCell(1).value = i + 1;
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    applyDataStyle(row.getCell(1), i % 2 === 0 ? "#F9FAFB" : undefined);

    row.getCell(2).value = "";
    applyDataStyle(row.getCell(2), i % 2 === 0 ? "#F9FAFB" : undefined);

    row.getCell(3).value = 0;
    row.getCell(3).numFmt = "0.00";
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    applyDataStyle(row.getCell(3), i % 2 === 0 ? "#F9FAFB" : undefined);

    row.getCell(4).value = 0;
    row.getCell(4).numFmt = `"${sym}"#,##0.00`;
    row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
    applyDataStyle(row.getCell(4), i % 2 === 0 ? "#F9FAFB" : undefined);

    const rNum = r + i;
    row.getCell(5).value = { formula: `C${rNum}*D${rNum}` };
    row.getCell(5).numFmt = `"${sym}"#,##0.00`;
    row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    applyDataStyle(row.getCell(5), i % 2 === 0 ? "#EBF5FB" : "#F0F8FF");

    row.getCell(6).value = "";
    applyDataStyle(row.getCell(6), i % 2 === 0 ? "#F9FAFB" : undefined);
  }
  r += lineCount;
  r++; // blank

  // ── Totals ─────────────────────────────────────────────────────────────────
  const subtotalRow = sheet.getRow(r);
  subtotalRow.height = 18;
  sheet.mergeCells(r, 1, r, 4);
  subtotalRow.getCell(1).value = "SUBTOTAL";
  subtotalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  subtotalRow.getCell(1).font = { bold: true, name: "Calibri", size: 10 };
  applyDataStyle(subtotalRow.getCell(1));
  subtotalRow.getCell(5).value = { formula: `SUM(E${lineStart}:E${lineStart + lineCount - 1})` };
  subtotalRow.getCell(5).numFmt = `"${sym}"#,##0.00`;
  subtotalRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
  subtotalRow.getCell(5).font = { bold: true, name: "Calibri", size: 10 };
  applyDataStyle(subtotalRow.getCell(5), "#EBF5FB");
  applyDataStyle(subtotalRow.getCell(6));
  r++;

  const taxRow = sheet.getRow(r);
  taxRow.height = 18;
  sheet.mergeCells(r, 1, r, 4);
  taxRow.getCell(1).value = `${config.taxLabel} (${config.taxRate}%)`;
  taxRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  taxRow.getCell(1).font = { name: "Calibri", size: 10 };
  applyDataStyle(taxRow.getCell(1));
  taxRow.getCell(5).value = { formula: `E${r - 1}*${taxRate}` };
  taxRow.getCell(5).numFmt = `"${sym}"#,##0.00`;
  taxRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
  applyDataStyle(taxRow.getCell(5), "#EBF5FB");
  applyDataStyle(taxRow.getCell(6));
  r++;

  const totalRow = sheet.getRow(r);
  totalRow.height = 24;
  sheet.mergeCells(r, 1, r, 4);
  totalRow.getCell(1).value = "TOTAL DUE";
  totalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(totalRow.getCell(1), config.accentColor as string);
  totalRow.getCell(1).font = { bold: true, name: "Calibri", size: 12, color: { argb: "FFFFFFFF" } };
  totalRow.getCell(5).value = { formula: `E${r - 2}+E${r - 1}` };
  totalRow.getCell(5).numFmt = `"${sym}"#,##0.00`;
  totalRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
  applyHeaderStyle(totalRow.getCell(5), config.accentColor as string);
  totalRow.getCell(5).font = { bold: true, name: "Calibri", size: 12, color: { argb: "FFFFFFFF" } };
  applyHeaderStyle(totalRow.getCell(6), config.accentColor as string);
  r++;
  r++;

  // ── Payment & notes ────────────────────────────────────────────────────────
  sheet.mergeCells(r, 1, r, 6);
  applyHeaderStyle(sheet.getCell(r, 1), config.headerColor as string);
  sheet.getCell(r, 1).value = "PAYMENT DETAILS";
  sheet.getCell(r, 1).alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(r).height = 18;
  r++;

  (config.bankDetails as string).split("\n").forEach((line) => {
    sheet.mergeCells(r, 1, r, 6);
    sheet.getCell(r, 1).value = line;
    sheet.getCell(r, 1).font = { name: "Calibri", size: 10 };
    applyDataStyle(sheet.getCell(r, 1));
    sheet.getRow(r).height = 16;
    r++;
  });
  r++;

  sheet.mergeCells(r, 1, r, 6);
  applyHeaderStyle(sheet.getCell(r, 1), config.headerColor as string);
  sheet.getCell(r, 1).value = "NOTES & TERMS";
  sheet.getCell(r, 1).alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(r).height = 18;
  r++;

  sheet.mergeCells(r, 1, r + 2, 6);
  sheet.getCell(r, 1).value = config.notes as string;
  sheet.getCell(r, 1).alignment = { horizontal: "left", vertical: "top", wrapText: true };
  sheet.getCell(r, 1).font = { name: "Calibri", size: 10, italic: true };
  applyDataStyle(sheet.getCell(r, 1));
  r += 3;

  // ── Footer ─────────────────────────────────────────────────────────────────
  sheet.mergeCells(r, 1, r, 6);
  applyHeaderStyle(sheet.getCell(r, 1), config.headerColor as string);
  sheet.getCell(r, 1).value = `${config.companyName}  |  ${config.companyAddress}  |  ${config.companyEmail}`;
  sheet.getCell(r, 1).alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell(r, 1).font = { name: "Calibri", size: 9, color: { argb: "FFCCCCCC" } };
  sheet.getRow(r).height = 16;

  void metaRow;
  return workbook;
}
