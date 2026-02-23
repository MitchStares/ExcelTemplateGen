export type FieldType =
  | "text"
  | "textarea"
  | "color"
  | "number"
  | "select"
  | "toggle"
  | "tags";

export interface SelectOption {
  label: string;
  value: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: FieldType;
  defaultValue: string | number | boolean | string[];
  placeholder?: string;
  options?: SelectOption[];
  min?: number;
  max?: number;
  group?: string;
}

export interface TemplateConfig {
  [key: string]: string | number | boolean | string[];
}

export interface PreviewCell {
  value: string;
  isHeader?: boolean;
  colSpan?: number;
  style?: {
    background?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    align?: "left" | "center" | "right";
  };
}

export type PreviewRow = PreviewCell[];

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: "finance" | "project" | "consulting" | "azure";
  icon: string;
  tags: string[];
  fields: ConfigField[];
  generatePreview: (config: TemplateConfig) => PreviewRow[];
}

/** Serializable subset of TemplateDefinition — safe to pass from Server to Client Components */
export type SerializableTemplate = Omit<TemplateDefinition, "generatePreview">;

export interface GenerateRequest {
  templateId: string;
  config: TemplateConfig;
}

/** A single resolved Azure resource row for AI-generated workbooks */
export interface AzureResource {
  name: string;           // Friendly display name, e.g. "Key Vault"
  serviceName: string;    // Exact key in pricing lookup, e.g. "Key Vault"
  skuName: string;        // Exact SKU key, e.g. "Standard"
  environment: string;    // e.g. "Production"
  quantity: number;
  unitMonthlyCost: number; // Resolved server-side — never from AI
  category: string;       // e.g. "Security" — used for Excel row grouping
  notes?: string;         // Populated when SKU lookup fails
}
