import { templates } from "@/lib/templates";
import { TemplateCard } from "@/components/TemplateCard";

const categoryOrder = ["finance", "project", "consulting", "azure"] as const;
const categoryLabels: Record<string, string> = {
  finance: "Finance",
  project: "Project Management",
  consulting: "Consulting",
  azure: "Azure & Cloud",
};

export default function HomePage() {
  const grouped = categoryOrder.map((cat) => ({
    cat,
    templates: templates.filter((t) => t.category === cat),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow">
              XG
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 leading-none">ExcelGen</p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Excel Template Generator</p>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
            <a href="#templates" className="hover:text-indigo-600 transition-colors">Templates</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
          </span>
          Proof of Concept · 6 Templates Available
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Generate Excel Templates
          <br />
          <span className="text-indigo-600">built for your work</span>
        </h1>
        <p className="mx-auto max-w-xl text-base text-gray-500 leading-relaxed">
          Pick a template, customise colours, structure, and settings — then download a fully formatted{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-700">.xlsx</code> file
          ready to use in Microsoft Excel.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-gray-500">
          {["Formulas included", "Multiple sheets", "Colour themes", "Data validation dropdowns", "Print-ready"].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Template Gallery */}
      <main id="templates" className="mx-auto max-w-6xl px-6 pb-20">
        {grouped.map(({ cat, templates: catTemplates }) => {
          if (catTemplates.length === 0) return null;
          return (
            <section key={cat} className="mb-12">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">{categoryLabels[cat]}</h2>
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs text-gray-400">{catTemplates.length} template{catTemplates.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {catTemplates.map((t) => (
                  <TemplateCard key={t.id} template={t} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
        <p>ExcelGen POC · Built with Next.js, TypeScript &amp; ExcelJS</p>
      </footer>
    </div>
  );
}
