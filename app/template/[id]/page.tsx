import { templateMap } from "@/lib/templates";
import { TemplateConfigurator } from "./TemplateConfigurator";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const { templates } = await import("@/lib/templates");
  return templates.map((t) => ({ id: t.id }));
}

export default async function TemplatePage({ params }: Props) {
  const { id } = await params;
  const template = templateMap[id];

  if (!template) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Templates
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-xl">{template.icon}</span>
            <span className="text-sm font-semibold text-gray-800">{template.name}</span>
          </div>
        </div>
      </header>

      {/* Configurator — pass only serializable data (no functions) */}
      <TemplateConfigurator template={{ id: template.id, name: template.name, description: template.description, category: template.category, icon: template.icon, tags: template.tags, fields: template.fields }} />
    </div>
  );
}
