"use client";

import type { PreviewRow } from "@/types/templates";

interface Props {
  rows: PreviewRow[];
}

export function PreviewPane({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
        Preview will appear here
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full border-collapse text-xs">
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => {
                const style: React.CSSProperties = {
                  backgroundColor: cell.style?.background || (cell.isHeader ? "#1E3A5F" : undefined),
                  color: cell.style?.color || (cell.isHeader ? "#ffffff" : "#1a1a1a"),
                  fontWeight: cell.style?.bold || cell.isHeader ? 700 : 400,
                  fontStyle: cell.style?.italic ? "italic" : undefined,
                  textAlign: cell.style?.align || (cell.isHeader ? "left" : "left"),
                };

                return (
                  <td
                    key={ci}
                    colSpan={cell.colSpan}
                    style={style}
                    className="border border-gray-100 px-2.5 py-1.5 whitespace-nowrap"
                  >
                    {cell.value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-400 italic">
        Simplified preview — the generated Excel file will include full formatting, formulas, and multiple sheets.
      </div>
    </div>
  );
}
