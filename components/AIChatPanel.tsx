"use client";

import { useState } from "react";
import type { AzureResource, TemplateConfig } from "@/types/templates";

interface ResolvedResult {
  resources: AzureResource[];
  summary: string;
  totalMonthly: number;
}

interface Props {
  templateId: string;
  config: TemplateConfig;
  onGenerate: (resources: AzureResource[]) => Promise<void>;
  isGenerating: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = { AUD: "$", USD: "$", GBP: "£" };
const CURRENCY_LOCALES: Record<string, string> = { AUD: "en-AU", USD: "en-US", GBP: "en-GB" };

export function AIChatPanel({ templateId, config, onGenerate, isGenerating }: Props) {
  const [message, setMessage] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolvedResult | null>(null);

  const currency = config.currency as string;
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  const locale = CURRENCY_LOCALES[currency] ?? "en-AU";

  const handleAnalyse = async () => {
    if (!message.trim()) return;
    setIsAnalysing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/chat/${templateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, config }),
      });

      const data = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        throw new Error((data.error as string) ?? `Server error: ${response.status}`);
      }
      setResult(data as unknown as ResolvedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse resources");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      void handleAnalyse();
    }
  };

  return (
    <div className="space-y-4">
      {/* Instruction banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Describe your Azure resources in plain English.{" "}
        <em className="not-italic opacity-75">
          e.g. &quot;1 Fabric F64 in prod, 2 Key Vaults, 3 storage accounts LRS in dev&quot;
        </em>
      </div>

      {/* Textarea + analyse button */}
      <div className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (result) setResult(null);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 1 Fabric capacity in prod, 1 Key Vault in prod, 3 storage accounts..."
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
        />
        <p className="text-xs text-gray-400 text-right">Ctrl+Enter to analyse</p>
        <button
          type="button"
          onClick={() => void handleAnalyse()}
          disabled={isAnalysing || !message.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalysing ? (
            <>
              <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analysing...
            </>
          ) : (
            "Analyse Resources"
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* AI summary */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {result.summary}
          </div>

          {/* Resource list */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Matched Resources
              </span>
            </div>
            <ul className="divide-y divide-gray-100">
              {result.resources.map((resource, i) => (
                <li key={i} className="flex items-start justify-between px-4 py-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-emerald-500">✓</span>
                    <div className="min-w-0">
                      <span className="font-medium text-gray-800">{resource.name}</span>
                      <span className="ml-1.5 text-gray-400">×{resource.quantity}</span>
                      <span className="ml-1.5 hidden text-xs text-gray-400 sm:inline">
                        {resource.skuName} · {resource.environment}
                      </span>
                      {resource.notes && (
                        <div className="mt-0.5 text-xs text-amber-600">{resource.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 text-right font-mono text-sm text-gray-700">
                    {sym}
                    {(resource.unitMonthlyCost * resource.quantity).toLocaleString(locale, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                    /mo
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-600">Est. monthly total</span>
              <span className="font-mono text-base font-bold text-gray-900">
                {sym}
                {result.totalMonthly.toLocaleString(locale, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                /mo
              </span>
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={() => void onGenerate(result.resources)}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <svg aria-hidden="true" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
        </div>
      )}
    </div>
  );
}
