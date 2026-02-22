import Link from "next/link";
import type { SerializableTemplate } from "@/types/templates";

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  finance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  project: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  consulting: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  azure: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
};

const categoryLabels: Record<string, string> = {
  finance: "Finance",
  project: "Project Mgmt",
  consulting: "Consulting",
  azure: "Azure",
};

interface Props {
  template: SerializableTemplate;
}

export function TemplateCard({ template }: Props) {
  const colors = categoryColors[template.category] || categoryColors.finance;

  return (
    <Link
      href={`/template/${template.id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Icon + category */}
      <div className="mb-4 flex items-start justify-between">
        <span className="text-4xl" role="img" aria-label={template.name}>
          {template.icon}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
        >
          {categoryLabels[template.category]}
        </span>
      </div>

      {/* Name + description */}
      <h2 className="mb-2 text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
        {template.name}
      </h2>
      <p className="mb-4 flex-1 text-sm text-gray-500 leading-relaxed">
        {template.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {template.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 transition-all">
        Customise & Generate
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
