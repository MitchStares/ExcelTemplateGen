import type { TemplateDefinition, TemplateConfig, PreviewRow } from "@/types/templates";
import ExcelJS from "exceljs";

export const ganttTemplate: TemplateDefinition = {
  id: "gantt",
  name: "Project Timeline / Gantt",
  description: "Visual project timeline with phases, tasks, milestones, and a weekly/monthly grid.",
  category: "project",
  icon: "📅",
  tags: ["project", "gantt", "timeline", "planning"],
  fields: [
    { key: "projectName", label: "Project Name", type: "text", defaultValue: "Azure Migration Project", group: "Project" },
    { key: "companyName", label: "Company / Client", type: "text", defaultValue: "Acme Corp", group: "Project" },
    { key: "projectManager", label: "Project Manager", type: "text", defaultValue: "Jane Smith", group: "Project" },
    { key: "headerColor", label: "Header Colour", type: "color", defaultValue: "#1E3A5F", group: "Branding" },
    { key: "accentColor", label: "Milestone Colour", type: "color", defaultValue: "#E74C3C", group: "Branding" },
    { key: "taskColor", label: "Task Bar Colour", type: "color", defaultValue: "#2E86AB", group: "Branding" },
    { key: "completedColor", label: "Completed Bar Colour", type: "color", defaultValue: "#27AE60", group: "Branding" },
    { key: "weeks", label: "Project Duration (weeks)", type: "number", defaultValue: 12, min: 4, max: 52, group: "Settings" },
    { key: "taskRows", label: "Number of Task Rows", type: "number", defaultValue: 15, min: 5, max: 50, group: "Settings" },
    { key: "phases", label: "Project Phases", type: "tags", defaultValue: ["Initiation", "Planning", "Execution", "Monitoring", "Closure"], group: "Settings" },
    { key: "showRaci", label: "Include RACI Column", type: "toggle", defaultValue: true, group: "Settings" },
    { key: "showStatus", label: "Include Status Column", type: "toggle", defaultValue: true, group: "Settings" },
  ],
  generatePreview: (config: TemplateConfig): PreviewRow[] => {
    const hdr = config.headerColor as string;
    const task = config.taskColor as string;
    return [
      [{ value: config.projectName as string, colSpan: 5, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [
        { value: "Task / Milestone", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "Owner", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Wk 1", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Wk 2", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Status", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
      ],
      [{ value: "▶ Initiation", colSpan: 5, style: { background: "#34495E", color: "#fff", bold: true } }],
      [{ value: "  Project Kickoff", style: {} }, { value: "Jane S.", style: { align: "center" } }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "", style: {} }, { value: "Done", style: { align: "center" } }],
      [{ value: "  Stakeholder Mapping", style: {} }, { value: "Jane S.", style: { align: "center" } }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "In Progress", style: { align: "center" } }],
      [{ value: "▶ Planning", colSpan: 5, style: { background: "#34495E", color: "#fff", bold: true } }],
      [{ value: "  Requirements Gathering", style: {} }, { value: "Team", style: { align: "center" } }, { value: "", style: {} }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "Pending", style: { align: "center" } }],
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
}

function applyDataStyle(cell: ExcelJS.Cell, bgHex?: string) {
  if (bgHex) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgHex.replace("#", "") } };
  cell.font = { name: "Calibri", size: 9 };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE8E8E8" } },
    bottom: { style: "thin", color: { argb: "FFE8E8E8" } },
    left: { style: "thin", color: { argb: "FFE8E8E8" } },
    right: { style: "thin", color: { argb: "FFE8E8E8" } },
  };
}

export async function generateGanttWorkbook(config: TemplateConfig): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.companyName as string;
  workbook.created = new Date();

  const weeks = Math.min(Number(config.weeks) || 12, 52);
  const taskRows = Number(config.taskRows) || 15;
  const phases = config.phases as string[];
  const showRaci = config.showRaci as boolean;
  const showStatus = config.showStatus as boolean;
  const taskArgb = "FF" + (config.taskColor as string).replace("#", "");
  const completeArgb = "FF" + (config.completedColor as string).replace("#", "");
  const milestoneArgb = "FF" + (config.accentColor as string).replace("#", "");

  // ── Gantt Sheet ─────────────────────────────────────────────────────────────
  const sheet = workbook.addWorksheet("Gantt Chart", { views: [{ state: "frozen", xSplit: 4, ySplit: 5 }] });

  // Fixed columns: A=ID, B=Task, C=Owner, D=Phase — then week columns
  const fixedCols = showRaci && showStatus ? 6 : showRaci || showStatus ? 5 : 4;

  sheet.getColumn(1).width = 6;   // ID
  sheet.getColumn(2).width = 32;  // Task
  sheet.getColumn(3).width = 14;  // Owner
  sheet.getColumn(4).width = 16;  // Phase
  if (showStatus) sheet.getColumn(5).width = 14;  // Status
  if (showRaci) sheet.getColumn(showStatus ? 6 : 5).width = 12; // RACI

  for (let w = 1; w <= weeks; w++) {
    sheet.getColumn(fixedCols + w).width = 5;
  }

  let r = 1;

  // Title
  sheet.mergeCells(r, 1, r, fixedCols + weeks);
  const titleCell = sheet.getCell(r, 1);
  titleCell.value = `${config.projectName as string}  —  Project Timeline`;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(r).height = 32;
  applyHeaderStyle(titleCell, config.headerColor as string);
  titleCell.font = { ...titleCell.font, size: 16 };
  r++;

  // Metadata row
  sheet.mergeCells(r, 1, r, Math.floor(fixedCols / 2));
  sheet.getCell(r, 1).value = `Client: ${config.companyName as string}`;
  sheet.getCell(r, 1).font = { name: "Calibri", size: 9, color: { argb: "FF444444" } };
  sheet.getCell(r, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };

  sheet.mergeCells(r, Math.floor(fixedCols / 2) + 1, r, fixedCols);
  sheet.getCell(r, Math.floor(fixedCols / 2) + 1).value = `PM: ${config.projectManager as string}  |  Generated: ${new Date().toLocaleDateString("en-AU")}`;
  sheet.getCell(r, Math.floor(fixedCols / 2) + 1).font = { name: "Calibri", size: 9, color: { argb: "FF444444" } };
  sheet.getCell(r, Math.floor(fixedCols / 2) + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
  sheet.getRow(r).height = 16;
  r++;

  // Week number header row (W1, W2, ...)
  sheet.getRow(r).height = 16;
  ["#", "Task / Milestone", "Owner", "Phase", ...(showStatus ? ["Status"] : []), ...(showRaci ? ["RACI"] : [])].forEach((h, i) => {
    const cell = sheet.getCell(r, i + 1);
    cell.value = h;
    applyHeaderStyle(cell, config.headerColor as string);
    cell.alignment = { horizontal: i > 0 ? "center" : "center", vertical: "middle" };
  });

  for (let w = 1; w <= weeks; w++) {
    const cell = sheet.getCell(r, fixedCols + w);
    cell.value = `W${w}`;
    applyHeaderStyle(cell, config.headerColor as string);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { ...cell.font, size: 8 };
  }
  r++;

  // Month grouping row (approximate)
  sheet.getRow(r).height = 14;
  let colCursor = fixedCols + 1;
  const weeksPerMonth = 4;
  let monthIdx = 0;
  const monthNames = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"];
  while (colCursor <= fixedCols + weeks) {
    const span = Math.min(weeksPerMonth, fixedCols + weeks - colCursor + 1);
    if (span > 1) sheet.mergeCells(r, colCursor, r, colCursor + span - 1);
    const cell = sheet.getCell(r, colCursor);
    cell.value = monthNames[monthIdx] || "";
    applyHeaderStyle(cell, config.accentColor as string);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { ...cell.font, size: 8 };
    colCursor += span;
    monthIdx++;
  }
  r++;

  // ── Task rows ───────────────────────────────────────────────────────────────
  let taskNum = 1;
  let phaseIdx = 0;

  // Distribute tasks across phases
  const tasksPerPhase = Math.ceil(taskRows / phases.length);

  phases.forEach((phase) => {
    // Phase header
    const phaseRow = sheet.getRow(r);
    phaseRow.height = 18;
    sheet.mergeCells(r, 1, r, fixedCols + weeks);
    const phaseCell = phaseRow.getCell(1);
    phaseCell.value = `▶  ${phase.toUpperCase()}`;
    phaseCell.alignment = { horizontal: "left", vertical: "middle" };
    phaseCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF34495E" } };
    phaseCell.font = { bold: true, name: "Calibri", size: 10, color: { argb: "FFFFFFFF" } };
    r++;

    // Task rows for this phase
    const count = phaseIdx === phases.length - 1 ? taskRows - tasksPerPhase * phaseIdx : tasksPerPhase;
    for (let t = 0; t < count; t++) {
      const row = sheet.getRow(r);
      row.height = 16;

      // ID
      row.getCell(1).value = taskNum;
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      applyDataStyle(row.getCell(1), taskNum % 2 === 0 ? "#F9FAFB" : undefined);
      row.getCell(1).font = { name: "Calibri", size: 9, color: { argb: "FF888888" } };

      // Task name
      row.getCell(2).value = `Task ${taskNum}`;
      applyDataStyle(row.getCell(2), taskNum % 2 === 0 ? "#F9FAFB" : undefined);

      // Owner
      row.getCell(3).value = "";
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      applyDataStyle(row.getCell(3), taskNum % 2 === 0 ? "#F9FAFB" : undefined);

      // Phase
      row.getCell(4).value = phase;
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).font = { name: "Calibri", size: 8, italic: true };
      applyDataStyle(row.getCell(4), taskNum % 2 === 0 ? "#F9FAFB" : undefined);

      let colOffset = 5;
      if (showStatus) {
        const statusCell = row.getCell(colOffset);
        statusCell.value = "Not Started";
        statusCell.alignment = { horizontal: "center", vertical: "middle" };
        applyDataStyle(statusCell, taskNum % 2 === 0 ? "#F9FAFB" : undefined);
        statusCell.font = { name: "Calibri", size: 8 };
        colOffset++;
      }
      if (showRaci) {
        const raciCell = row.getCell(colOffset);
        raciCell.value = "";
        raciCell.alignment = { horizontal: "center", vertical: "middle" };
        applyDataStyle(raciCell, taskNum % 2 === 0 ? "#F9FAFB" : undefined);
      }

      // Week cells - just empty bars
      for (let w = 1; w <= weeks; w++) {
        const cell = row.getCell(fixedCols + w);
        cell.value = "";
        applyDataStyle(cell, taskNum % 2 === 0 ? "#FAFAFA" : "#FFFFFF");
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      taskNum++;
      r++;
    }
    phaseIdx++;
  });

  // ── Legend ──────────────────────────────────────────────────────────────────
  r++;
  sheet.mergeCells(r, 1, r, 3);
  sheet.getCell(r, 1).value = "LEGEND";
  applyHeaderStyle(sheet.getCell(r, 1), config.headerColor as string);
  sheet.getRow(r).height = 16;
  r++;

  const legendItems = [
    { label: "Task In Progress", argb: taskArgb },
    { label: "Task Completed", argb: completeArgb },
    { label: "Milestone", argb: milestoneArgb },
  ];

  legendItems.forEach(({ label, argb }) => {
    const row = sheet.getRow(r);
    row.height = 14;
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    row.getCell(1).value = " ";
    row.getCell(2).value = label;
    row.getCell(2).font = { name: "Calibri", size: 9 };
    r++;
  });

  // ── Tasks List Sheet ───────────────────────────────────────────────────────
  const taskSheet = workbook.addWorksheet("Task Register");
  taskSheet.getColumn(1).width = 6;
  taskSheet.getColumn(2).width = 32;
  taskSheet.getColumn(3).width = 18;
  taskSheet.getColumn(4).width = 16;
  taskSheet.getColumn(5).width = 14;
  taskSheet.getColumn(6).width = 14;
  taskSheet.getColumn(7).width = 14;
  taskSheet.getColumn(8).width = 12;
  taskSheet.getColumn(9).width = 40;

  const trHeaders = ["#", "Task / Milestone", "Phase", "Owner", "Start Date", "End Date", "Duration (d)", "Status", "Notes"];
  const trHeaderRow = taskSheet.getRow(1);
  trHeaderRow.height = 20;
  trHeaders.forEach((h, i) => {
    trHeaderRow.getCell(i + 1).value = h;
    applyHeaderStyle(trHeaderRow.getCell(i + 1), config.headerColor as string);
    trHeaderRow.getCell(i + 1).alignment = { horizontal: "center", vertical: "middle" };
  });

  for (let t = 0; t < taskRows; t++) {
    const row = taskSheet.getRow(t + 2);
    row.height = 16;
    row.getCell(1).value = t + 1;
    row.getCell(1).alignment = { horizontal: "center" };
    applyDataStyle(row.getCell(1), t % 2 === 0 ? "#F9FAFB" : undefined);

    ["", "", "", "", "", "", "", ""].forEach((v, i) => {
      row.getCell(i + 2).value = v;
      applyDataStyle(row.getCell(i + 2), t % 2 === 0 ? "#F9FAFB" : undefined);
    });

    // Date columns
    row.getCell(5).numFmt = "DD/MM/YYYY";
    row.getCell(6).numFmt = "DD/MM/YYYY";
    row.getCell(7).numFmt = "0";
    row.getCell(7).value = { formula: `IF(AND(E${t + 2}<>"",F${t + 2}<>""),F${t + 2}-E${t + 2},"")` };
  }

  void taskArgb;
  void completeArgb;
  void milestoneArgb;
  return workbook;
}
