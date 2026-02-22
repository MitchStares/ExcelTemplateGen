import type { TemplateDefinition, TemplateConfig, PreviewRow } from "@/types/templates";
import ExcelJS from "exceljs";

export const userStoriesTemplate: TemplateDefinition = {
  id: "user-stories",
  name: "User Stories & Personas",
  description: "Agile user story backlog with persona cards, acceptance criteria, story points, and priority tracking.",
  category: "consulting",
  icon: "👤",
  tags: ["agile", "user stories", "personas", "backlog", "consulting"],
  fields: [
    { key: "projectName", label: "Project Name", type: "text", defaultValue: "Digital Transformation", group: "Project" },
    { key: "companyName", label: "Organisation", type: "text", defaultValue: "Acme Corp", group: "Project" },
    { key: "headerColor", label: "Header Colour", type: "color", defaultValue: "#6C3483", group: "Branding" },
    { key: "accentColor", label: "Accent Colour", type: "color", defaultValue: "#A569BD", group: "Branding" },
    { key: "epicNames", label: "Epics", type: "tags", defaultValue: ["User Management", "Reporting & Analytics", "Notifications", "Integrations", "Administration"], group: "Backlog" },
    { key: "personas", label: "Personas", type: "tags", defaultValue: ["End User", "Administrator", "Manager", "External Partner", "Developer"], group: "Personas" },
    { key: "storyCount", label: "Number of Story Rows", type: "number", defaultValue: 20, min: 5, max: 100, group: "Backlog" },
    { key: "storyPointScale", label: "Story Point Scale", type: "select", defaultValue: "Fibonacci", options: [
      { label: "Fibonacci (1,2,3,5,8,13,21)", value: "Fibonacci" },
      { label: "T-Shirt (XS,S,M,L,XL)", value: "TShirt" },
      { label: "Linear (1-10)", value: "Linear" },
    ], group: "Backlog" },
    { key: "includePersonaSheet", label: "Include Persona Profiles Sheet", type: "toggle", defaultValue: true, group: "Personas" },
    { key: "includeMoSCoW", label: "Include MoSCoW Prioritisation", type: "toggle", defaultValue: true, group: "Backlog" },
  ],
  generatePreview: (config: TemplateConfig): PreviewRow[] => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    return [
      [{ value: config.projectName as string, colSpan: 5, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [{ value: "User Story Backlog", colSpan: 5, style: { background: acc, color: "#fff", bold: true, align: "center" } }],
      [
        { value: "ID", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "As a...", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "I want to...", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "Points", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Priority", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
      ],
      [{ value: "US-001", style: { align: "center" } }, { value: "End User", style: {} }, { value: "log in securely", style: {} }, { value: "3", style: { align: "center" } }, { value: "Must Have", style: { background: "#FFE9E9", color: "#C0392B", align: "center" } }],
      [{ value: "US-002", style: { align: "center" } }, { value: "Administrator", style: {} }, { value: "manage user accounts", style: {} }, { value: "5", style: { align: "center" } }, { value: "Must Have", style: { background: "#FFE9E9", color: "#C0392B", align: "center" } }],
      [{ value: "US-003", style: { align: "center" } }, { value: "Manager", style: {} }, { value: "view dashboard reports", style: {} }, { value: "8", style: { align: "center" } }, { value: "Should Have", style: { background: "#FFF3CD", color: "#856404", align: "center" } }],
    ];
  },
};

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

export async function generateUserStoriesWorkbook(config: TemplateConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.companyName as string;
  workbook.created = new Date();

  const storyCount = Number(config.storyCount) || 20;
  const epics = config.epicNames as string[];
  const personas = config.personas as string[];
  const includeMoSCoW = config.includeMoSCoW as boolean;
  const includePersonaSheet = config.includePersonaSheet as boolean;
  const scale = config.storyPointScale as string;

  const storyPointOptions = scale === "Fibonacci" ? "1,2,3,5,8,13,21" : scale === "TShirt" ? "XS,S,M,L,XL" : "1,2,3,4,5,6,7,8,9,10";
  const moscowOptions = "Must Have,Should Have,Could Have,Won't Have";
  const statusOptions = "Backlog,Refined,Ready,In Progress,In Review,Done";
  const priorityColours: Record<string, string> = {
    "Must Have": "FFE74C3C",
    "Should Have": "FFF39C12",
    "Could Have": "FF27AE60",
    "Won't Have": "FFD5D5D5",
  };

  // ── Backlog Sheet ──────────────────────────────────────────────────────────
  const sheet = workbook.addWorksheet("Story Backlog", { views: [{ state: "frozen", xSplit: 0, ySplit: 5 }] });

  sheet.getColumn(1).width = 10;   // ID
  sheet.getColumn(2).width = 18;   // Epic
  sheet.getColumn(3).width = 18;   // Persona
  sheet.getColumn(4).width = 36;   // As a... I want to...
  sheet.getColumn(5).width = 36;   // So that...
  sheet.getColumn(6).width = 36;   // Acceptance Criteria
  sheet.getColumn(7).width = 10;   // Story Points
  sheet.getColumn(8).width = 14;   // Status
  if (includeMoSCoW) sheet.getColumn(9).width = 14;  // MoSCoW
  sheet.getColumn(includeMoSCoW ? 10 : 9).width = 24; // Notes

  const totalCols = includeMoSCoW ? 10 : 9;

  let r = 1;

  // Title
  sheet.mergeCells(r, 1, r, totalCols);
  const titleCell = sheet.getCell(r, 1);
  titleCell.value = `${config.projectName as string}  —  User Story Backlog`;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 30;
  applyHeaderStyle(titleCell, config.headerColor as string);
  titleCell.font = { ...titleCell.font, size: 15 };
  r++;

  // Subtitle
  sheet.mergeCells(r, 1, r, totalCols);
  const subCell = sheet.getCell(r, 1);
  subCell.value = `Organisation: ${config.companyName as string}   |   Story Points: ${scale}   |   Generated: ${new Date().toLocaleDateString("en-AU")}`;
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 16;
  applyHeaderStyle(subCell, config.accentColor as string);
  subCell.font = { ...subCell.font, size: 9, color: { argb: "FFFFFFFF" } };
  r++;
  r++; // blank

  // Column headers
  const headers = [
    "Story ID", "Epic", "Persona", "User Story (As a [persona], I want to [action])",
    "So That... (Benefit)", "Acceptance Criteria", "Points", "Status",
    ...(includeMoSCoW ? ["MoSCoW"] : []),
    "Notes",
  ];

  const headerRow = sheet.getRow(r);
  headerRow.height = 40;
  headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h;
    applyHeaderStyle(headerRow.getCell(i + 1), config.headerColor as string);
    headerRow.getCell(i + 1).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  r++;

  // Data rows
  for (let i = 0; i < storyCount; i++) {
    const row = sheet.getRow(r + i);
    row.height = 36;
    const bgAlt = i % 2 === 0 ? "#FAF5FF" : undefined;

    // ID
    row.getCell(1).value = `US-${String(i + 1).padStart(3, "0")}`;
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    applyDataStyle(row.getCell(1), bgAlt);
    row.getCell(1).font = { name: "Calibri", size: 9, bold: true, color: { argb: "FF" + config.headerColor.toString().replace("#", "") } };

    // Epic (dropdown)
    row.getCell(2).value = "";
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    applyDataStyle(row.getCell(2), bgAlt);
    row.getCell(2).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${epics.join(",")}"`],
    };

    // Persona (dropdown)
    row.getCell(3).value = "";
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    applyDataStyle(row.getCell(3), bgAlt);
    row.getCell(3).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${personas.join(",")}"`],
    };

    // User story
    row.getCell(4).value = "";
    row.getCell(4).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    applyDataStyle(row.getCell(4), bgAlt);

    // So that
    row.getCell(5).value = "";
    row.getCell(5).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    applyDataStyle(row.getCell(5), bgAlt);

    // Acceptance criteria
    row.getCell(6).value = "";
    row.getCell(6).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    applyDataStyle(row.getCell(6), bgAlt);

    // Story points (dropdown)
    row.getCell(7).value = "";
    row.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
    applyDataStyle(row.getCell(7), bgAlt);
    row.getCell(7).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${storyPointOptions}"`],
    };

    // Status
    row.getCell(8).value = "Backlog";
    row.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
    applyDataStyle(row.getCell(8), bgAlt);
    row.getCell(8).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${statusOptions}"`],
    };

    // MoSCoW
    if (includeMoSCoW) {
      row.getCell(9).value = "";
      row.getCell(9).alignment = { horizontal: "center", vertical: "middle" };
      applyDataStyle(row.getCell(9), bgAlt);
      row.getCell(9).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${moscowOptions}"`],
      };
    }

    // Notes
    const notesCol = includeMoSCoW ? 10 : 9;
    row.getCell(notesCol).value = "";
    row.getCell(notesCol).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    applyDataStyle(row.getCell(notesCol), bgAlt);
  }
  r += storyCount;

  void priorityColours;

  // ── Epic Summary Sheet ─────────────────────────────────────────────────────
  const epicSheet = workbook.addWorksheet("Epics");
  epicSheet.getColumn(1).width = 8;
  epicSheet.getColumn(2).width = 24;
  epicSheet.getColumn(3).width = 40;
  epicSheet.getColumn(4).width = 16;
  epicSheet.getColumn(5).width = 20;
  epicSheet.getColumn(6).width = 16;

  epicSheet.mergeCells("A1:F1");
  applyHeaderStyle(epicSheet.getCell("A1"), config.headerColor as string);
  epicSheet.getCell("A1").value = "Epic Register";
  epicSheet.getRow(1).height = 24;

  const epicHeaders = ["#", "Epic Name", "Description", "Priority", "Owner", "Status"];
  const epicHeaderRow = epicSheet.getRow(2);
  epicHeaderRow.height = 20;
  epicHeaders.forEach((h, i) => {
    epicHeaderRow.getCell(i + 1).value = h;
    applyHeaderStyle(epicHeaderRow.getCell(i + 1), config.accentColor as string);
    epicHeaderRow.getCell(i + 1).font = { ...epicHeaderRow.getCell(i + 1).font, color: { argb: "FFFFFFFF" } };
  });

  epics.forEach((epic, i) => {
    const eRow = epicSheet.getRow(i + 3);
    eRow.height = 20;
    eRow.getCell(1).value = i + 1;
    eRow.getCell(1).alignment = { horizontal: "center" };
    applyDataStyle(eRow.getCell(1), i % 2 === 0 ? "#FAF5FF" : undefined);
    eRow.getCell(2).value = epic;
    eRow.getCell(2).font = { bold: true, name: "Calibri", size: 10 };
    applyDataStyle(eRow.getCell(2), i % 2 === 0 ? "#FAF5FF" : undefined);
    ["", "", "", "Not Started"].forEach((v, ci) => {
      eRow.getCell(ci + 3).value = v;
      applyDataStyle(eRow.getCell(ci + 3), i % 2 === 0 ? "#FAF5FF" : undefined);
    });
  });

  // ── Persona Profiles Sheet ─────────────────────────────────────────────────
  if (includePersonaSheet) {
    const personaSheet = workbook.addWorksheet("Persona Profiles");
    personaSheet.getColumn(1).width = 24;
    personaSheet.getColumn(2).width = 40;
    personaSheet.getColumn(3).width = 40;
    personaSheet.getColumn(4).width = 40;
    personaSheet.getColumn(5).width = 40;

    personaSheet.mergeCells("A1:E1");
    applyHeaderStyle(personaSheet.getCell("A1"), config.headerColor as string);
    personaSheet.getCell("A1").value = "Persona Profiles";
    personaSheet.getRow(1).height = 24;

    const personaHeaders = ["Attribute", ...personas];
    const personaHeaderRow = personaSheet.getRow(2);
    personaHeaderRow.height = 20;
    personaHeaders.forEach((h, i) => {
      personaHeaderRow.getCell(i + 1).value = h;
      applyHeaderStyle(personaHeaderRow.getCell(i + 1), config.accentColor as string);
      personaHeaderRow.getCell(i + 1).font = { ...personaHeaderRow.getCell(i + 1).font, color: { argb: "FFFFFFFF" } };
    });

    const personaAttributes = [
      "Name", "Role / Job Title", "Age Range", "Technical Proficiency",
      "Key Goals", "Pain Points", "Needs from System", "Quote / Insight",
      "Devices Used", "Notes",
    ];

    personaAttributes.forEach((attr, ri) => {
      const pRow = personaSheet.getRow(ri + 3);
      pRow.height = 36;
      pRow.getCell(1).value = attr;
      pRow.getCell(1).font = { bold: true, name: "Calibri", size: 10 };
      applyDataStyle(pRow.getCell(1), "#FAF5FF");

      personas.forEach((_, pi) => {
        pRow.getCell(pi + 2).value = "";
        pRow.getCell(pi + 2).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        applyDataStyle(pRow.getCell(pi + 2), ri % 2 === 0 ? "#FDFBFF" : undefined);
      });
    });
  }

  void r;
  return workbook;
}
