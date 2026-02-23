"use client";

import { useState, useCallback, useMemo } from "react";
import type { SerializableTemplate, TemplateConfig, PreviewRow } from "@/types/templates";
import { previewGenerators } from "@/lib/previews";
import { ConfigField } from "@/components/ConfigField";
import { PreviewPane } from "@/components/PreviewPane";
import { TemplateModeSwitcher } from "@/components/TemplateModeSwitcher";
import { AIChatPanel } from "@/components/AIChatPanel";
import type { AzureResource } from "@/types/templates";

interface Props {
  template: SerializableTemplate;
}

export function TemplateConfigurator({ template }: Props) {
  // Initialise config from field defaults
  const initialConfig = useMemo<TemplateConfig>(() => {
    return Object.fromEntries(template.fields.map((f) => [f.key, f.defaultValue]));
  }, [template]);

  const [config, setConfig] = useState<TemplateConfig>(initialConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  const handleChange = useCallback((key: string, value: string | number | boolean | string[]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setConfig(initialConfig);
    setError(null);
  }, [initialConfig]);

  // Live preview rows (uses client-side preview generators, not ExcelJS)
  const previewRows = useMemo<PreviewRow[]>(() => {
    try {
      const gen = previewGenerators[template.id];
      return gen ? gen(config) : [];
    } catch {
      return [];
    }
  }, [template.id, config]);

  // Group fields by their group property
  const fieldGroups = useMemo(() => {
    const groups: Record<string, typeof template.fields> = {};
    const ungrouped: typeof template.fields = [];

    template.fields.forEach((f) => {
      if (f.group) {
        if (!groups[f.group]) groups[f.group] = [];
        groups[f.group].push(f);
      } else {
        ungrouped.push(f);
      }
    });

    return { groups, ungrouped };
  }, [template.fields]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, config }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `${(config.projectName as string || config.companyName as string || template.name).replace(/[^a-z0-9]/gi, "_")}_${template.id}.xlsx`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastDownloaded(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate template");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIGenerate = async (resources: AzureResource[]) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, config: { ...config, resources } }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `${(config.projectName as string || template.name).replace(/[^a-z0-9]/gi, "_")}_${template.id}_ai.xlsx`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastDownloaded(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate template");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
        {/* ── Left panel: Configuration ──────────────────────────────────────── */}
        <aside className="space-y-4">
          <TemplateModeSwitcher
            manualContent={
              <>
                {/* Template info */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div>
                      <h1 className="text-base font-bold text-gray-900">{template.name}</h1>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Field groups */}
                {Object.entries(fieldGroups.groups).map(([groupName, fields]) => (
                  <div key={groupName} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{groupName}</h3>
                    <div className="space-y-4">
                      {fields.map((field) => (
                        <ConfigField
                          key={field.key}
                          field={field}
                          value={config[field.key]}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Ungrouped fields */}
                {fieldGroups.ungrouped.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="space-y-4">
                      {fieldGroups.ungrouped.map((field) => (
                        <ConfigField
                          key={field.key}
                          field={field}
                          value={config[field.key]}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                >
                  Reset to defaults
                </button>
              </>
            }
            chatContent={
              template.id === "azure-calculator" ? (
                <AIChatPanel
                  templateId={template.id}
                  config={config}
                  onGenerate={handleAIGenerate}
                  isGenerating={isGenerating}
                />
              ) : undefined
            }
          />
        </aside>

        {/* ── Right panel: Preview + Generate ───────────────────────────────── */}
        <div className="space-y-6">
          {/* Preview header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Live Preview</h2>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-700 font-medium">
              Simplified — full Excel output may differ
            </span>
          </div>

          {/* Preview table */}
          <PreviewPane rows={previewRows} />

          {/* What's included */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-indigo-800">What&apos;s included in the download</h3>
            <ul className="space-y-1.5 text-sm text-indigo-700">
              {getTemplateFeatures(template.id).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Success */}
          {lastDownloaded && !error && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Downloaded: <code className="font-mono">{lastDownloaded}</code>
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Generate &amp; Download Excel
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Files are generated server-side and downloaded directly. Nothing is stored.
          </p>
        </div>
      </div>
    </div>
  );
}

function getTemplateFeatures(id: string): string[] {
  const features: Record<string, string[]> = {
    budget: [
      "Expenses sheet with category rows and monthly columns",
      "Income tracking sheet",
      "Summary dashboard with cross-sheet formulas",
      "Auto-totalling SUM formulas",
      "Budget vs actual columns",
    ],
    invoice: [
      "Professional invoice/quote layout",
      "Auto-calculated line item totals (Qty × Rate)",
      "Subtotal, tax, and grand total formulas",
      "Payment details and notes sections",
      "Print-ready layout (A4 portrait)",
    ],
    gantt: [
      "Visual Gantt chart with weekly grid",
      "Phase grouping rows",
      "Task register sheet with date calculations",
      "Status and RACI columns",
      "Legend sheet",
    ],
    rbac: [
      "RBAC matrix with dropdown permission values",
      "Data validation for all permission cells",
      "Roles register sheet",
      "Permission key / legend sheet",
      "Azure IAM-friendly terminology",
    ],
    "azure-calculator": [
      "Resource cost estimate by category",
      "Monthly and annual cost columns with formulas",
      "Contingency and reserved instance rows",
      "Environment breakdown sheet",
      "Stub note with Azure pricing calculator link",
    ],
    "user-stories": [
      "Full story backlog with dropdown validations",
      "Epic, persona, MoSCoW, status dropdowns",
      "Epic register sheet",
      "Persona profile cards sheet",
      "Fibonacci / T-shirt / linear point scales",
    ],
  };
  return features[id] || ["Formatted Excel template", "Multiple sheets", "Formula-driven"];
}
