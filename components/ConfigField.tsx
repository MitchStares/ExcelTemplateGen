"use client";

import { useState } from "react";
import type { ConfigField as ConfigFieldType } from "@/types/templates";

interface Props {
  field: ConfigFieldType;
  value: string | number | boolean | string[];
  onChange: (key: string, value: string | number | boolean | string[]) => void;
}

export function ConfigField({ field, value, onChange }: Props) {
  const [tagInput, setTagInput] = useState("");

  const baseInput =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition";

  switch (field.type) {
    case "text":
      return (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
          <input
            type="text"
            className={baseInput}
            value={value as string}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
          <textarea
            className={`${baseInput} resize-none`}
            rows={3}
            value={value as string}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );

    case "color":
      return (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
              value={value as string}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
            <input
              type="text"
              className={`${baseInput} flex-1 font-mono uppercase`}
              value={(value as string).toUpperCase()}
              maxLength={7}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(field.key, v);
              }}
            />
          </div>
        </div>
      );

    case "number":
      return (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
          <input
            type="number"
            className={baseInput}
            value={value as number}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
          <select
            className={`${baseInput} cursor-pointer`}
            value={value as string}
            onChange={(e) => onChange(field.key, e.target.value)}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case "toggle":
      return (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600">{field.label}</label>
          <button
            type="button"
            role="switch"
            aria-checked={value as boolean}
            onClick={() => onChange(field.key, !(value as boolean))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              value ? "bg-indigo-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                value ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      );

    case "tags": {
      const tags = value as string[];

      const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
          onChange(field.key, [...tags, trimmed]);
        }
        setTagInput("");
      };

      const removeTag = (tag: string) => {
        onChange(field.key, tags.filter((t) => t !== tag));
      };

      return (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-indigo-400 hover:text-indigo-600 leading-none"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className={`${baseInput} flex-1`}
              value={tagInput}
              placeholder="Add item..."
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addTag(); }
              }}
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition"
            >
              Add
            </button>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
