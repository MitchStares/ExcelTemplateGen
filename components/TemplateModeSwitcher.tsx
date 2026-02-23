"use client";

import { useState } from "react";

interface Props {
  manualContent: React.ReactNode;
  /** When omitted, the AI tab is not shown and manualContent renders directly. */
  chatContent?: React.ReactNode;
}

/**
 * Generic tab wrapper for the template configurator left sidebar.
 * Renders [Manual Config | AI Chat] tabs when chatContent is provided.
 * Falls back to rendering manualContent directly when chatContent is absent,
 * so this can be safely added to any template.
 */
export function TemplateModeSwitcher({ manualContent, chatContent }: Props) {
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  if (!chatContent) return <>{manualContent}</>;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "manual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Manual Config
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "ai"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ✨ AI Chat
        </button>
      </div>

      {mode === "manual" ? manualContent : chatContent}
    </div>
  );
}
