import type { TemplateDefinition, TemplateConfig, PreviewRow } from "@/types/templates";
import ExcelJS from "exceljs";

export const rbacTemplate: TemplateDefinition = {
  id: "rbac",
  name: "RBAC Matrix",
  description: "Role-Based Access Control matrix mapping roles to resources/permissions. Great for Azure IAM and application security design.",
  category: "consulting",
  icon: "🔐",
  tags: ["rbac", "security", "azure", "iam", "permissions", "consulting"],
  fields: [
    { key: "projectName", label: "Project / System Name", type: "text", defaultValue: "Azure Platform RBAC", group: "Project" },
    { key: "companyName", label: "Organisation", type: "text", defaultValue: "Acme Corp", group: "Project" },
    { key: "headerColor", label: "Header Colour", type: "color", defaultValue: "#0078D4", group: "Branding" },
    { key: "accentColor", label: "Accent Colour", type: "color", defaultValue: "#50E6FF", group: "Branding" },
    { key: "roles", label: "Roles", type: "tags", defaultValue: ["Owner", "Contributor", "Reader", "Security Admin", "Network Contributor", "Billing Reader", "DevOps Engineer", "Helpdesk"], group: "RBAC" },
    { key: "resourceGroups", label: "Resource Groups / Scopes", type: "tags", defaultValue: ["Production", "Development", "Staging", "Shared Services", "Network Hub", "Security"], group: "RBAC" },
    { key: "permissionValues", label: "Permission Key", type: "select", defaultValue: "CRUD", options: [
      { label: "CRUD (C/R/U/D)", value: "CRUD" },
      { label: "Allow/Deny (✓/✗)", value: "AllowDeny" },
      { label: "Access Levels (Full/Read/None)", value: "Levels" },
      { label: "Azure Built-in Roles (Owner/Contributor/Reader)", value: "Azure" },
    ], group: "Settings" },
    { key: "includeDescription", label: "Include Role Descriptions", type: "toggle", defaultValue: true, group: "Settings" },
    { key: "includeJustification", label: "Include Justification Column", type: "toggle", defaultValue: true, group: "Settings" },
    { key: "azureEnvironment", label: "Azure Environment", type: "select", defaultValue: "All", options: [
      { label: "All Environments", value: "All" },
      { label: "Production Only", value: "Production" },
      { label: "Non-Production", value: "NonProd" },
    ], group: "Settings" },
  ],
  generatePreview: (config: TemplateConfig): PreviewRow[] => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    const roles = (config.roles as string[]).slice(0, 4);
    return [
      [{ value: config.projectName as string, colSpan: roles.length + 1, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [
        { value: "Resource / Scope", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        ...roles.map(r => ({ value: r, isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" as const } })),
      ],
      [
        { value: "Production", style: { background: "#F0F7FF", bold: true } },
        { value: "Owner", style: { background: "#FFE9E9", color: "#C0392B", bold: true, align: "center" as const } },
        { value: "Contributor", style: { background: "#E9F7EF", color: "#27AE60", bold: true, align: "center" as const } },
        { value: "Reader", style: { background: "#EBF5FB", align: "center" as const } },
        { value: "None", style: { background: "#F5F5F5", color: "#888", align: "center" as const } },
      ],
      [
        { value: "Development", style: {} },
        { value: "Owner", style: { background: "#FFE9E9", color: "#C0392B", bold: true, align: "center" as const } },
        { value: "Owner", style: { background: "#FFE9E9", color: "#C0392B", bold: true, align: "center" as const } },
        { value: "Contributor", style: { background: "#E9F7EF", color: "#27AE60", align: "center" as const } },
        { value: "Reader", style: { background: "#EBF5FB", align: "center" as const } },
      ],
      [
        { value: "Legend:", style: { bold: true } },
        { value: "Owner = Full", style: { background: "#FFE9E9", color: "#C0392B", align: "center" as const } },
        { value: "Contrib.", style: { background: "#E9F7EF", color: "#27AE60", align: "center" as const } },
        { value: "Reader", style: { background: "#EBF5FB", align: "center" as const } },
        { value: acc, style: { background: acc, align: "center" as const } },
      ],
    ];
  },
};

function applyHeaderStyle(cell: ExcelJS.Cell, bgHex: string, fontHex = "#FFFFFF") {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgHex.replace("#", "") } };
  cell.font = { bold: true, color: { argb: "FF" + fontHex.replace("#", "") }, name: "Calibri", size: 10 };
  cell.border = {
    top: { style: "medium", color: { argb: "FFD0D0D0" } },
    bottom: { style: "medium", color: { argb: "FFD0D0D0" } },
    left: { style: "medium", color: { argb: "FFD0D0D0" } },
    right: { style: "medium", color: { argb: "FFD0D0D0" } },
  };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
}

function applyDataStyle(cell: ExcelJS.Cell, bgHex?: string) {
  if (bgHex) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgHex.replace("#", "") } };
  cell.font = { name: "Calibri", size: 10 };
  cell.border = {
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
  };
}

export async function generateRbacWorkbook(config: TemplateConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.companyName as string;
  workbook.created = new Date();

  const roles = config.roles as string[];
  const resources = config.resourceGroups as string[];
  const includeDesc = config.includeDescription as boolean;
  const includeJust = config.includeJustification as boolean;
  const permMode = config.permissionValues as string;

  const totalCols = (includeDesc ? 1 : 0) + roles.length + (includeJust ? 1 : 0);

  // ── RBAC Matrix Sheet ───────────────────────────────────────────────────────
  const sheet = workbook.addWorksheet("RBAC Matrix", { views: [{ state: "frozen", xSplit: 1, ySplit: 4 }] });

  // Column widths
  sheet.getColumn(1).width = 24;  // Resource / Scope
  let colIdx = 2;
  if (includeDesc) { sheet.getColumn(colIdx).width = 30; colIdx++; }
  roles.forEach(() => { sheet.getColumn(colIdx).width = 16; colIdx++; });
  if (includeJust) { sheet.getColumn(colIdx).width = 36; }

  let r = 1;

  // Title
  sheet.mergeCells(r, 1, r, 1 + totalCols);
  const titleCell = sheet.getCell(r, 1);
  titleCell.value = `${config.projectName as string}  —  RBAC Matrix`;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 30;
  applyHeaderStyle(titleCell, config.headerColor as string);
  titleCell.font = { ...titleCell.font, size: 15 };
  r++;

  // Metadata
  sheet.mergeCells(r, 1, r, 1 + totalCols);
  sheet.getCell(r, 1).value = `Organisation: ${config.companyName as string}   |   Environment: ${config.azureEnvironment as string}   |   Generated: ${new Date().toLocaleDateString("en-AU")}`;
  sheet.getCell(r, 1).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF555555" } };
  sheet.getCell(r, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
  sheet.getCell(r, 1).alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 16;
  r++;

  // Column headers
  sheet.getRow(r).height = 40;
  const headerRow = sheet.getRow(r);
  headerRow.getCell(1).value = "Resource Group / Scope";
  applyHeaderStyle(headerRow.getCell(1), config.headerColor as string);

  let hColIdx = 2;
  if (includeDesc) {
    headerRow.getCell(hColIdx).value = "Role Description";
    applyHeaderStyle(headerRow.getCell(hColIdx), config.headerColor as string);
    hColIdx++;
  }

  roles.forEach((role) => {
    headerRow.getCell(hColIdx).value = role;
    applyHeaderStyle(headerRow.getCell(hColIdx), config.headerColor as string);
    headerRow.getCell(hColIdx).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    hColIdx++;
  });

  if (includeJust) {
    headerRow.getCell(hColIdx).value = "Justification / Notes";
    applyHeaderStyle(headerRow.getCell(hColIdx), config.headerColor as string);
  }
  r++;

  // Permission value options
  const permOptions: Record<string, string[]> = {
    CRUD: ["Full", "C/R/U/D", "R Only", "None"],
    AllowDeny: ["✓", "✗"],
    Levels: ["Full Access", "Read Only", "No Access"],
    Azure: ["Owner", "Contributor", "Reader", "None"],
  };
  const validPerms = permOptions[permMode] || ["Full", "Read", "None"];

  // Colour coding for permission values
  const permColours: Record<string, string> = {
    Full: "FFE74C3C", "C/R/U/D": "FFE67E22", "R Only": "FF27AE60",
    None: "FFD5D5D5", "✓": "FF27AE60", "✗": "FFE74C3C",
    "Full Access": "FFE74C3C", "Read Only": "FF27AE60", "No Access": "FFD5D5D5",
    Owner: "FFE74C3C", Contributor: "FFF39C12", Reader: "FF27AE60",
  };

  // Data rows
  resources.forEach((resource, ri) => {
    const row = sheet.getRow(r);
    row.height = 20;

    row.getCell(1).value = resource;
    row.getCell(1).font = { bold: true, name: "Calibri", size: 10 };
    applyDataStyle(row.getCell(1), ri % 2 === 0 ? "#F0F7FF" : "#FFFFFF");

    let dColIdx = 2;
    if (includeDesc) {
      row.getCell(dColIdx).value = "";
      applyDataStyle(row.getCell(dColIdx), ri % 2 === 0 ? "#F9FAFB" : undefined);
      dColIdx++;
    }

    roles.forEach(() => {
      const cell = row.getCell(dColIdx);
      const defaultPerm = validPerms[Math.floor(Math.random() * validPerms.length)];
      cell.value = "";  // Leave blank for user to fill
      cell.alignment = { horizontal: "center", vertical: "middle" };
      applyDataStyle(cell, ri % 2 === 0 ? "#F9FAFB" : undefined);
      // Add data validation dropdown
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${validPerms.join(",")}"`],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: `Please select from: ${validPerms.join(", ")}`,
      };
      void defaultPerm;
      dColIdx++;
    });

    if (includeJust) {
      row.getCell(dColIdx).value = "";
      applyDataStyle(row.getCell(dColIdx), ri % 2 === 0 ? "#F9FAFB" : undefined);
    }

    r++;
  });

  // ── Legend Sheet ────────────────────────────────────────────────────────────
  const legendSheet = workbook.addWorksheet("Legend & Key");
  legendSheet.getColumn(1).width = 24;
  legendSheet.getColumn(2).width = 40;

  legendSheet.mergeCells("A1:B1");
  applyHeaderStyle(legendSheet.getCell("A1"), config.headerColor as string);
  legendSheet.getCell("A1").value = "RBAC Permission Key";
  legendSheet.getRow(1).height = 24;

  legendSheet.mergeCells("A2:B2");
  applyHeaderStyle(legendSheet.getCell("A2"), config.accentColor as string);
  legendSheet.getCell("A2").value = `Permission Mode: ${permMode}`;
  legendSheet.getRow(2).height = 18;

  validPerms.forEach((perm, i) => {
    const lRow = legendSheet.getRow(i + 3);
    lRow.height = 18;
    lRow.getCell(1).value = perm;
    lRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    lRow.getCell(1).font = { bold: true, name: "Calibri", size: 10, color: { argb: "FFFFFFFF" } };
    const argb = permColours[perm] || "FFAAAAAA";
    lRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    lRow.getCell(2).value = `Level: ${perm}`;
    lRow.getCell(2).font = { name: "Calibri", size: 10 };
    applyDataStyle(lRow.getCell(2));
  });

  // ── Roles Register Sheet ───────────────────────────────────────────────────
  const rolesSheet = workbook.addWorksheet("Roles Register");
  rolesSheet.getColumn(1).width = 24;
  rolesSheet.getColumn(2).width = 40;
  rolesSheet.getColumn(3).width = 20;
  rolesSheet.getColumn(4).width = 20;

  const rrHeaders = ["Role Name", "Description", "Azure Built-in Role", "Custom Role?"];
  const rrHeaderRow = rolesSheet.getRow(1);
  rrHeaderRow.height = 20;
  rrHeaders.forEach((h, i) => {
    rrHeaderRow.getCell(i + 1).value = h;
    applyHeaderStyle(rrHeaderRow.getCell(i + 1), config.headerColor as string);
    rrHeaderRow.getCell(i + 1).alignment = { horizontal: "center", vertical: "middle" };
  });

  roles.forEach((role, i) => {
    const rRow = rolesSheet.getRow(i + 2);
    rRow.height = 18;
    rRow.getCell(1).value = role;
    rRow.getCell(1).font = { bold: true, name: "Calibri", size: 10 };
    applyDataStyle(rRow.getCell(1), i % 2 === 0 ? "#F9FAFB" : undefined);
    rRow.getCell(2).value = "";
    applyDataStyle(rRow.getCell(2), i % 2 === 0 ? "#F9FAFB" : undefined);
    rRow.getCell(3).value = "";
    rRow.getCell(3).alignment = { horizontal: "center" };
    applyDataStyle(rRow.getCell(3), i % 2 === 0 ? "#F9FAFB" : undefined);
    rRow.getCell(4).value = "No";
    rRow.getCell(4).alignment = { horizontal: "center" };
    rRow.getCell(4).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Yes,No"'],
    };
    applyDataStyle(rRow.getCell(4), i % 2 === 0 ? "#F9FAFB" : undefined);
  });

  return workbook;
}
