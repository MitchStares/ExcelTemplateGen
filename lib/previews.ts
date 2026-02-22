// Pure preview generators — no ExcelJS dependency, safe for client bundle
import type { TemplateConfig, PreviewRow } from "@/types/templates";

function sym(currency: string) {
  return ({ AUD: "$", USD: "$", GBP: "£", EUR: "€", CAD: "$" } as Record<string, string>)[currency] ?? "$";
}

export const previewGenerators: Record<string, (config: TemplateConfig) => PreviewRow[]> = {
  budget: (config) => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    const cats = config.categories as string[];
    const s = sym(config.currency as string);
    return [
      [{ value: (config.companyName as string) || "Company", colSpan: 4, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [{ value: (config.reportTitle as string) || "Budget Tracker", colSpan: 4, style: { background: acc, color: "#fff", bold: true, align: "center" } }],
      [
        { value: "Category", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "Jan", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Feb", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Total", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
      ],
      ...cats.slice(0, 4).map((cat) => ([
        { value: cat, style: { align: "left" as const } },
        { value: `${s} -`, style: { align: "right" as const } },
        { value: `${s} -`, style: { align: "right" as const } },
        { value: `${s} -`, style: { align: "right" as const } },
      ])),
      [
        { value: "TOTAL", style: { background: acc, color: "#fff", bold: true } },
        { value: `${s} 0`, style: { background: "#e8f4f8", bold: true, align: "right" as const } },
        { value: `${s} 0`, style: { background: "#e8f4f8", bold: true, align: "right" as const } },
        { value: `${s} 0`, style: { background: "#e8f4f8", bold: true, align: "right" as const } },
      ],
    ];
  },

  invoice: (config) => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    const s = sym(config.currency as string);
    return [
      [{ value: config.companyName as string, colSpan: 4, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [{ value: config.documentType as string, colSpan: 4, style: { background: acc, color: "#fff", bold: true, align: "center" } }],
      [
        { value: "Description", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        { value: "Qty", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" } },
        { value: "Rate", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "right" } },
        { value: "Amount", isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "right" } },
      ],
      [{ value: "Consulting Services", style: {} }, { value: "8", style: { align: "center" } }, { value: `${s}150.00`, style: { align: "right" } }, { value: `${s}1,200.00`, style: { align: "right" } }],
      [{ value: "Project Management", style: {} }, { value: "4", style: { align: "center" } }, { value: `${s}200.00`, style: { align: "right" } }, { value: `${s}800.00`, style: { align: "right" } }],
      [{ value: `${config.taxLabel} (${config.taxRate}%)`, style: {} }, { value: "", style: {} }, { value: "", style: {} }, { value: `${s}200.00`, style: { align: "right" } }],
      [{ value: "TOTAL DUE", style: { background: acc, color: "#fff", bold: true } }, { value: "", style: { background: acc } }, { value: "", style: { background: acc } }, { value: `${s}2,200.00`, style: { background: acc, color: "#fff", bold: true, align: "right" } }],
    ];
  },

  gantt: (config) => {
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
      [{ value: "  Project Kickoff", style: {} }, { value: "PM", style: { align: "center" } }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "", style: {} }, { value: "Done", style: { align: "center" } }],
      [{ value: "  Stakeholder Mapping", style: {} }, { value: "PM", style: { align: "center" } }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "In Progress", style: { align: "center" } }],
      [{ value: "▶ Planning", colSpan: 5, style: { background: "#34495E", color: "#fff", bold: true } }],
      [{ value: "  Requirements", style: {} }, { value: "Team", style: { align: "center" } }, { value: "", style: {} }, { value: "█", style: { background: task, color: task, align: "center" } }, { value: "Pending", style: { align: "center" } }],
    ];
  },

  rbac: (config) => {
    const hdr = config.headerColor as string;
    const roles = (config.roles as string[]).slice(0, 4);
    return [
      [{ value: config.projectName as string, colSpan: roles.length + 1, style: { background: hdr, color: "#fff", bold: true, align: "center" } }],
      [
        { value: "Resource / Scope", isHeader: true, style: { background: hdr, color: "#fff", bold: true } },
        ...roles.map((r) => ({ value: r, isHeader: true, style: { background: hdr, color: "#fff", bold: true, align: "center" as const } })),
      ],
      [
        { value: "Production", style: { background: "#F0F7FF", bold: true } },
        { value: "Owner", style: { background: "#FFE9E9", color: "#C0392B", bold: true, align: "center" as const } },
        { value: "Contributor", style: { background: "#E9F7EF", color: "#27AE60", bold: true, align: "center" as const } },
        { value: "Reader", style: { background: "#EBF5FB", align: "center" as const } },
        { value: "None", style: { background: "#F5F5F5", color: "#888", align: "center" as const } },
      ].slice(0, roles.length + 1),
      [
        { value: "Development", style: {} },
        { value: "Owner", style: { background: "#FFE9E9", color: "#C0392B", bold: true, align: "center" as const } },
        { value: "Owner", style: { background: "#FFE9E9", color: "#C0392B", bold: true, align: "center" as const } },
        { value: "Contributor", style: { background: "#E9F7EF", color: "#27AE60", align: "center" as const } },
        { value: "Reader", style: { background: "#EBF5FB", align: "center" as const } },
      ].slice(0, roles.length + 1),
    ];
  },

  "azure-calculator": (config) => {
    const hdr = config.headerColor as string;
    const acc = config.accentColor as string;
    const s = sym(config.currency as string);
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
      [{ value: "App Service Plan", style: {} }, { value: "P2v3", style: { align: "center" } }, { value: "2", style: { align: "center" } }, { value: `${s}580`, style: { align: "right" } }, { value: `${s}6,960`, style: { align: "right" } }],
      [{ value: "▶ Storage", colSpan: 5, style: { background: "#034078", color: "#fff", bold: true } }],
      [{ value: "Storage Account (LRS)", style: {} }, { value: "Standard", style: { align: "center" } }, { value: "1", style: { align: "center" } }, { value: `${s}42`, style: { align: "right" } }, { value: `${s}504`, style: { align: "right" } }],
      [{ value: "TOTAL", colSpan: 4, style: { background: acc, color: "#003087", bold: true } }, { value: `${s}7,464`, style: { background: acc, color: "#003087", bold: true, align: "right" } }],
    ];
  },

  "user-stories": (config) => {
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
