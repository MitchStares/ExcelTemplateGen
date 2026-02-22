import { budgetTemplate, generateBudgetWorkbook } from "./budget";
import { invoiceTemplate, generateInvoiceWorkbook } from "./invoice";
import { ganttTemplate, generateGanttWorkbook } from "./gantt";
import { rbacTemplate, generateRbacWorkbook } from "./rbac";
import { azureCalculatorTemplate, generateAzureCalculatorWorkbook } from "./azure-calculator";
import { userStoriesTemplate, generateUserStoriesWorkbook } from "./user-stories";
import type { TemplateDefinition, TemplateConfig } from "@/types/templates";
import ExcelJS from "exceljs";

export const templates: TemplateDefinition[] = [
  budgetTemplate,
  invoiceTemplate,
  ganttTemplate,
  rbacTemplate,
  azureCalculatorTemplate,
  userStoriesTemplate,
];

export const templateMap: Record<string, TemplateDefinition> = Object.fromEntries(
  templates.map((t) => [t.id, t])
);

export async function generateWorkbook(templateId: string, config: TemplateConfig): Promise<ExcelJS.Workbook> {
  switch (templateId) {
    case "budget":
      return generateBudgetWorkbook(config);
    case "invoice":
      return generateInvoiceWorkbook(config);
    case "gantt":
      return generateGanttWorkbook(config);
    case "rbac":
      return generateRbacWorkbook(config);
    case "azure-calculator":
      return generateAzureCalculatorWorkbook(config);
    case "user-stories":
      return generateUserStoriesWorkbook(config);
    default:
      throw new Error(`Unknown template: ${templateId}`);
  }
}

export type { TemplateDefinition, TemplateConfig };
