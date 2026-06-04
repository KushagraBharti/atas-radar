"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Database,
  Factory,
  Filter,
  Gauge,
  Leaf,
  RadioTower,
  Search,
  ShieldQuestion,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import type { AtasPillar, Company, RadarDataset, SourceHealth } from "@/lib/types";

type View = "top" | "pillar" | "source" | "rejected" | "health";

const pillarIcons: Record<AtasPillar, ComponentType<{ className?: string }>> = {
  "Evolution of Energy": Zap,
  "Future of Manufacturing": Factory,
  "Agricultural Infrastructure": Leaf,
  "American Necessities": RadioTower,
};

const views: Array<{ id: View; label: string }> = [
  { id: "top", label: "Top 10" },
  { id: "pillar", label: "By pillar" },
  { id: "source", label: "By source" },
  { id: "rejected", label: "Rejected" },
  { id: "health", label: "Source health" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function scoreTone(score: number) {
  if (score >= 78) return "text-emerald-200 border-emerald-400/40 bg-emerald-400/10";
  if (score >= 68) return "text-amber-100 border-amber-300/40 bg-amber-300/10";
  return "text-stone-200 border-stone-500/40 bg-stone-500/10";
}

function healthTone(status: SourceHealth["status"]) {
  if (status === "ok") return "text-emerald-200 border-emerald-400/40 bg-emerald-400/10";
  if (status === "partial") return "text-amber-100 border-amber-300/40 bg-amber-300/10";
  return "text-red-100 border-red-400/40 bg-red-400/10";
}

function PillarMark({ pillar }: { pillar: AtasPillar }) {
  const Icon = pillarIcons[pillar];
  return (
    <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone-300">
      <Icon className="size-3.5 text-red-300" />
      {pillar}
    </span>
  );
}

function ScoreRail({ company }: { company: Company }) {
  const components = company.score_components;
  const rows = [
    ["Thesis", components.thesis_fit, 30],
    ["Buyer", components.buyer_pain, 20],
    ["Traction", components.traction_signal, 20],
    ["Timing", components.timing, 15],
    ["Depth", components.technical_depth, 10],
    ["Under-radar", components.under_the_radar, 5],
  ] as const;

  return (
    <div className="space-y-2">
      {rows.map(([label, value, max]) => (
        <div key={label} className="grid grid-cols-[82px_1fr_34px] items-center gap-2 text-xs text-stone-400">
          <span>{label}</span>
          <div className="h-1.5 bg-stone-800">
            <div className="h-full bg-red-300" style={{ width: `${(value / max) * 100}%` }} />
          </div>
          <span className="text-right text-stone-200">{value}</span>
        </div>
      ))}
    </div>
  );
}

function CompanyDetail({ company }: { company: Company }) {
  return (
    <aside className="sticky top-5 h-fit border border-stone-700/70 bg-[#11100e] p-5 shadow-2xl shadow-black/30">
      <div className="flex items-start justify-between gap-5">
        <div>
          <PillarMark pillar={company.atas_pillar} />
          <h2 className="mt-3 text-2xl font-semibold text-stone-50">{company.name}</h2>
          <p className="mt-1 text-sm text-stone-400">{company.sector}</p>
        </div>
        <a
          href={company.website}
          target="_blank"
          rel="noreferrer"
          className="border border-stone-700 p-2 text-stone-300 hover:border-red-300 hover:text-red-200"
          aria-label={`Open ${company.name}`}
        >
          <ArrowUpRight className="size-4" />
        </a>
      </div>

      <div className={`mt-5 inline-flex border px-3 py-1 text-sm ${scoreTone(company.fit_score)}`}>
        ATAS fit {company.fit_score} / 100
      </div>

      <p className="mt-5 text-sm leading-6 text-stone-300">{company.description}</p>

      <div className="mt-5 grid gap-4 text-sm">
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Buyer</h3>
          <p className="mt-2 text-stone-200">{company.buyer_hypothesis}</p>
        </section>
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Why now</h3>
          <p className="mt-2 text-stone-200">{company.why_now}</p>
        </section>
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Score components</h3>
          <div className="mt-3">
            <ScoreRail company={company} />
          </div>
        </section>
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Diligence questions</h3>
          <ul className="mt-2 space-y-2 text-stone-200">
            {company.diligence_questions.map((question) => (
              <li key={question} className="flex gap-2">
                <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-red-300" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-stone-500">Risk / hype flags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {company.hype_flags.map((flag) => (
              <span key={flag} className="border border-stone-700 bg-stone-900 px-2 py-1 text-xs text-stone-300">
                {flag}
              </span>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function CompanyRow({ company, selected, onSelect }: { company: Company; selected: boolean; onSelect: () => void }) {
  const bestSignal = company.signals[0];
  return (
    <button
      onClick={onSelect}
      className={`grid w-full grid-cols-[68px_1.1fr_1fr_1.2fr_120px] gap-4 border-b border-stone-800 px-0 py-4 text-left transition hover:bg-stone-900/70 ${
        selected ? "bg-stone-900/80" : ""
      }`}
    >
      <div>
        <span className={`inline-flex min-w-14 justify-center border px-2 py-1 text-sm ${scoreTone(company.fit_score)}`}>
          {company.fit_score}
        </span>
      </div>
      <div>
        <div className="font-semibold text-stone-50">{company.name}</div>
        <div className="mt-1 text-xs text-stone-500">{company.sector}</div>
      </div>
      <div className="text-sm leading-5 text-stone-300">{company.buyer_hypothesis}</div>
      <div className="text-sm leading-5 text-stone-400">{company.why_now}</div>
      <div className="text-xs text-stone-500">
        <div>{bestSignal?.source ?? "No signal"}</div>
        <div className="mt-1 text-stone-300">{bestSignal?.source_type ?? "missing"}</div>
      </div>
    </button>
  );
}

export default function RadarApp({ dataset }: { dataset: RadarDataset }) {
  const [view, setView] = useState<View>("top");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(dataset.companies[0]?.company_id ?? "");

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dataset.companies;
    return dataset.companies.filter((company) =>
      `${company.name} ${company.sector} ${company.atas_pillar} ${company.description} ${company.buyer_hypothesis}`
        .toLowerCase()
        .includes(q),
    );
  }, [dataset.companies, query]);

  const selectedCompany =
    dataset.companies.find((company) => company.company_id === selectedId) ?? dataset.companies[0];

  const byPillar = useMemo(() => {
    return dataset.companies.reduce<Record<string, Company[]>>((acc, company) => {
      acc[company.atas_pillar] = [...(acc[company.atas_pillar] ?? []), company];
      return acc;
    }, {});
  }, [dataset.companies]);

  const bySource = useMemo(() => {
    return dataset.signals.reduce<Record<string, number>>((acc, signal) => {
      acc[signal.source] = (acc[signal.source] ?? 0) + 1;
      return acc;
    }, {});
  }, [dataset.signals]);

  const topCompanies = filteredCompanies.slice(0, 10);
  const okSources = dataset.source_health.filter((source) => source.status === "ok").length;
  const partialSources = dataset.source_health.filter((source) => source.status === "partial").length;

  return (
    <main className="min-h-screen bg-[#0c0b09] text-stone-100">
      <div className="border-b border-stone-800 bg-[#0f0e0b]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center border border-red-300/50 bg-red-400/10 text-sm font-semibold tracking-[0.22em] text-red-100">
              AT
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">ATAS Radar</h1>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                public-source industrial intelligence
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-xs text-stone-400 md:flex">
            <span>Generated {formatDate(dataset.generated_at)}</span>
            <span>{dataset.companies.length} companies</span>
            <span>{dataset.signals.length} signals</span>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1500px] px-5 py-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border border-stone-800 bg-[#141310] p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-stone-500">
              <Gauge className="size-4 text-red-300" /> Average fit
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {dataset.companies.length
                ? Math.round(dataset.companies.reduce((sum, company) => sum + company.fit_score, 0) / dataset.companies.length)
                : 0}
            </div>
          </div>
          <div className="border border-stone-800 bg-[#141310] p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-stone-500">
              <Database className="size-4 text-red-300" /> Sources ok
            </div>
            <div className="mt-3 text-3xl font-semibold">{okSources}</div>
          </div>
          <div className="border border-stone-800 bg-[#141310] p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-stone-500">
              <AlertTriangle className="size-4 text-amber-200" /> Partial sources
            </div>
            <div className="mt-3 text-3xl font-semibold">{partialSources}</div>
          </div>
          <div className="border border-stone-800 bg-[#141310] p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-stone-500">
              <Activity className="size-4 text-red-300" /> Rejected
            </div>
            <div className="mt-3 text-3xl font-semibold">{dataset.rejected.length}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-5 px-5 pb-8 lg:grid-cols-[1fr_440px]">
        <div className="min-w-0">
          <div className="border border-stone-800 bg-[#11100e]">
            <div className="flex flex-col gap-4 border-b border-stone-800 p-4 xl:flex-row xl:items-center xl:justify-between">
              <nav className="flex flex-wrap gap-2">
                {views.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`border px-3 py-2 text-sm transition ${
                      view === item.id
                        ? "border-red-300 bg-red-400/10 text-red-100"
                        : "border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <label className="flex min-w-72 items-center gap-2 border border-stone-700 bg-[#0c0b09] px-3 py-2 text-sm text-stone-400">
                <Search className="size-4" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter company, sector, pillar..."
                  className="w-full bg-transparent text-stone-100 outline-none placeholder:text-stone-600"
                />
              </label>
            </div>

            {dataset.companies.length === 0 ? (
              <div className="p-10 text-stone-300">
                <h2 className="text-xl font-semibold text-stone-50">No Radar data yet.</h2>
                <p className="mt-3 text-sm">Run <code className="text-red-200">npm run refresh</code> to pull public-source snapshots and generate the dashboard dataset.</p>
              </div>
            ) : null}

            {view === "top" ? (
              <div>
                <div className="grid grid-cols-[68px_1.1fr_1fr_1.2fr_120px] gap-4 border-b border-stone-800 px-0 py-3 text-xs uppercase tracking-[0.14em] text-stone-500">
                  <span className="pl-0">Score</span>
                  <span>Company</span>
                  <span>Buyer</span>
                  <span>Why now</span>
                  <span>Best signal</span>
                </div>
                <div className="px-4">
                  {topCompanies.map((company) => (
                    <CompanyRow
                      key={company.company_id}
                      company={company}
                      selected={selectedCompany?.company_id === company.company_id}
                      onSelect={() => setSelectedId(company.company_id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {view === "pillar" ? (
              <div className="grid gap-0 md:grid-cols-2">
                {Object.entries(byPillar).map(([pillar, companies]) => {
                  const Icon = pillarIcons[pillar as AtasPillar];
                  return (
                    <section key={pillar} className="border-b border-r border-stone-800 p-5">
                      <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-stone-400">
                        <Icon className="size-4 text-red-300" />
                        {pillar}
                      </div>
                      <div className="mt-4 space-y-3">
                        {companies.map((company) => (
                          <button
                            key={company.company_id}
                            onClick={() => setSelectedId(company.company_id)}
                            className="w-full border border-stone-800 bg-[#0c0b09] p-3 text-left hover:border-red-300/50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-stone-100">{company.name}</span>
                              <span className={`border px-2 py-0.5 text-xs ${scoreTone(company.fit_score)}`}>{company.fit_score}</span>
                            </div>
                            <p className="mt-2 text-sm text-stone-400">{company.sector}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : null}

            {view === "source" ? (
              <div className="p-5">
                <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-stone-500">
                  <Filter className="size-4 text-red-300" /> Signal count by source
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(bySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => (
                      <div key={source} className="border border-stone-800 bg-[#0c0b09] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-stone-100">{source}</span>
                          <span className="text-sm text-red-200">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {view === "rejected" ? (
              <div className="divide-y divide-stone-800">
                {dataset.rejected.map((candidate, index) => (
                  <div key={`${candidate.source}-${candidate.name}-${index}`} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-stone-100">{candidate.name}</h3>
                      <a href={candidate.source_url} target="_blank" rel="noreferrer" className="text-xs text-red-200 hover:text-red-100">
                        {candidate.source}
                      </a>
                    </div>
                    <p className="mt-2 text-sm text-stone-400">{candidate.reason}</p>
                    <p className="mt-2 text-sm text-stone-200">{candidate.what_would_change}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {view === "health" ? (
              <div className="divide-y divide-stone-800">
                {dataset.source_health.map((source, index) => (
                  <div key={`${source.source}-${source.url}-${index}`} className="grid gap-4 p-5 md:grid-cols-[180px_100px_1fr_170px]">
                    <div className="font-medium text-stone-100">{source.source}</div>
                    <div>
                      <span className={`border px-2 py-1 text-xs uppercase ${healthTone(source.status)}`}>{source.status}</span>
                    </div>
                    <div className="text-sm leading-5 text-stone-400">{source.note}</div>
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-sm text-red-200 hover:text-red-100">
                      source link
                    </a>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {selectedCompany ? <CompanyDetail company={selectedCompany} /> : null}
      </section>
    </main>
  );
}
