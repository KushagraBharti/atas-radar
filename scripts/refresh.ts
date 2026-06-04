import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { diligenceFor, makeSignal, normalizeName, scoreCompany } from "../src/lib/scoring";
import type { AtasPillar, RadarDataset, RejectedCandidate, Signal, SourceHealth } from "../src/lib/types";

const root = process.cwd();
const generatedAt = new Date().toISOString();
const runId = generatedAt.replace(/[:.]/g, "-");
const rawRoot = path.join(root, "data", "raw", runId);
const normalizedRoot = path.join(root, "data", "normalized");

type SeedCompany = {
  name: string;
  website: string;
  description: string;
  atas_pillar: AtasPillar;
  sector: string;
  buyer_hypothesis: string;
  why_now: string;
  source_links: string[];
  source: string;
  source_type: "primary" | "enrichment" | "market context" | "manual review";
  hype_flags: string[];
};

const seedCompanies: SeedCompany[] = [
  {
    name: "Machina Labs",
    website: "https://machinalabs.ai/",
    description: "Robotic manufacturing cells for sheet-metal and composite parts.",
    atas_pillar: "Future of Manufacturing",
    sector: "Robotic manufacturing",
    buyer_hypothesis: "aerospace, defense, automotive, and industrial manufacturers with low-volume high-complexity parts",
    why_now: "reshoring, defense-industrial capacity pressure, and flexible robotic production make tool-less manufacturing more valuable",
    source_links: ["https://machinalabs.ai/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["capex-heavy deployment", "cycle-time proof needed"],
  },
  {
    name: "Atomic Industries",
    website: "https://www.atomic.industries/",
    description: "AI-native manufacturing for molds, tooling, and industrial production workflows.",
    atas_pillar: "Future of Manufacturing",
    sector: "AI manufacturing tooling",
    buyer_hypothesis: "manufacturers blocked by slow tooling, quoting, and production iteration",
    why_now: "manufacturing labor shortages and AI-native CAD/CAM workflows are compressing tooling cycles",
    source_links: ["https://www.atomic.industries/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["workflow depth must beat services-heavy tooling"],
  },
  {
    name: "First Resonance",
    website: "https://www.firstresonance.io/",
    description: "Manufacturing operating system for complex hardware production.",
    atas_pillar: "Future of Manufacturing",
    sector: "Factory operating system",
    buyer_hypothesis: "hardware manufacturers that need traceability, process control, and fast production iteration",
    why_now: "new aerospace, energy, and defense manufacturers need factory software built for modern hardware velocity",
    source_links: ["https://www.firstresonance.io/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["software visibility must translate into production control"],
  },
  {
    name: "Instrumental",
    website: "https://instrumental.com/",
    description: "AI inspection and manufacturing data platform for electronics and complex assembly.",
    atas_pillar: "Future of Manufacturing",
    sector: "Manufacturing inspection",
    buyer_hypothesis: "manufacturers with yield loss, line escapes, and slow root-cause loops",
    why_now: "computer vision and factory data make quality control more automated and less labor-intensive",
    source_links: ["https://instrumental.com/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["needs proof it changes yield, not only dashboards"],
  },
  {
    name: "Aigen",
    website: "https://aigen.io/",
    description: "Autonomous solar-powered field robotics for agriculture.",
    atas_pillar: "Agricultural Infrastructure",
    sector: "Agricultural robotics",
    buyer_hypothesis: "row-crop and specialty-crop growers facing labor, herbicide, and field-ops constraints",
    why_now: "farm labor shortages, herbicide resistance, and robotics costs make autonomous field work more viable",
    source_links: ["https://aigen.io/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["field reliability and service network are the hard part"],
  },
  {
    name: "farm-ng",
    website: "https://farm-ng.com/",
    description: "Modular farm robotics platform for small and specialty-crop growers.",
    atas_pillar: "Agricultural Infrastructure",
    sector: "Farm robotics platform",
    buyer_hypothesis: "specialty-crop operators who need affordable field automation rather than full-size OEM machinery",
    why_now: "smaller farms need labor leverage and modular automation that fits existing operations",
    source_links: ["https://farm-ng.com/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["distribution and field support determine adoption"],
  },
  {
    name: "Agtonomy",
    website: "https://www.agtonomy.com/",
    description: "Autonomous and tele-assisted farm equipment platform.",
    atas_pillar: "Agricultural Infrastructure",
    sector: "Farm equipment autonomy",
    buyer_hypothesis: "growers and equipment fleets that need labor leverage without replacing every machine",
    why_now: "farm labor scarcity and fleet autonomy are converging with better perception and remote operations",
    source_links: ["https://www.agtonomy.com/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["must prove payback across seasons and crops"],
  },
  {
    name: "Monarch Tractor",
    website: "https://www.monarchtractor.com/",
    description: "Electric autonomous tractor platform for farming operations.",
    atas_pillar: "Agricultural Infrastructure",
    sector: "Autonomous electric tractors",
    buyer_hypothesis: "farms and vineyards seeking labor savings, lower fuel costs, and autonomous equipment capability",
    why_now: "electrification, autonomy, and farm labor pressure create a new equipment replacement window",
    source_links: ["https://www.monarchtractor.com/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["obvious consensus name", "hardware gross margin and service complexity"],
  },
  {
    name: "Gridware",
    website: "https://www.gridware.io/",
    description: "Grid monitoring hardware and analytics for utility distribution infrastructure.",
    atas_pillar: "Evolution of Energy",
    sector: "Grid infrastructure monitoring",
    buyer_hypothesis: "utilities trying to detect faults, wildfire risk, and distribution-grid failures faster",
    why_now: "aging grid infrastructure, wildfire risk, and electrification demand more real-time grid visibility",
    source_links: ["https://www.gridware.io/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["utility sales cycles can be slow"],
  },
  {
    name: "Irrigreen",
    website: "https://irrigreen.com/",
    description: "Digitally controlled irrigation hardware that reduces water waste.",
    atas_pillar: "American Necessities",
    sector: "Water infrastructure",
    buyer_hypothesis: "property owners, landscapers, municipalities, and developers trying to reduce irrigation water use",
    why_now: "water scarcity and connected hardware make irrigation efficiency a real infrastructure problem",
    source_links: ["https://irrigreen.com/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["consumer/installer channel may dilute venture-scale industrial wedge"],
  },
  {
    name: "Trellis Climate",
    website: "https://www.trellisclimate.com/",
    description: "Permitting and interconnection workflow software for energy infrastructure.",
    atas_pillar: "Evolution of Energy",
    sector: "Energy infrastructure workflow",
    buyer_hypothesis: "developers and utilities slowed by permitting, interconnection, and project development bottlenecks",
    why_now: "data-center load, grid congestion, and generation queues make infrastructure coordination a bottleneck",
    source_links: ["https://www.trellisclimate.com/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["must own workflow, not just summarize documents"],
  },
  {
    name: "Bedrock Robotics",
    website: "https://www.bedrockrobotics.com/",
    description: "Autonomy stack for heavy construction and earthmoving equipment.",
    atas_pillar: "American Necessities",
    sector: "Construction equipment autonomy",
    buyer_hypothesis: "contractors and infrastructure operators facing operator shortages and productivity constraints",
    why_now: "infrastructure backlog and labor shortages make off-road autonomy increasingly valuable",
    source_links: ["https://www.bedrockrobotics.com/"],
    source: "Company web enrichment",
    source_type: "primary",
    hype_flags: ["site variability and safety case are hard"],
  },
];

function tagsFrom(text: string) {
  const tags = [
    "grid",
    "battery",
    "energy",
    "manufacturing",
    "robotics",
    "agriculture",
    "water",
    "spectrum",
    "mining",
    "industrial",
    "autonomy",
    "materials",
    "federal",
    "utility",
  ];
  const lower = text.toLowerCase();
  return tags.filter((tag) => lower.includes(tag));
}

async function ensureDirs() {
  await mkdir(rawRoot, { recursive: true });
  await mkdir(normalizedRoot, { recursive: true });
}

async function writeRaw(source: string, payload: unknown) {
  const filePath = path.join(rawRoot, `${normalizeName(source)}.json`);
  await writeFile(filePath, JSON.stringify(payload, null, 2));
  return path.relative(root, filePath).replaceAll("\\", "/");
}

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "user-agent": "ATAS-Radar/0.1",
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "ATAS-Radar/0.1" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function runUSAspending() {
  const source = "USAspending";
  const url = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
  try {
    const payload = {
      filters: {
        time_period: [{ start_date: "2025-01-01", end_date: "2026-06-04" }],
        award_type_codes: ["02", "03", "04", "05"],
        award_amounts: [{ lower_bound: 50_000, upper_bound: 5_000_000 }],
        agencies: [
          { type: "awarding", tier: "toptier", name: "Department of Energy" },
        ],
      },
      fields: ["Award ID", "Recipient Name", "Award Amount", "Description", "Start Date", "Awarding Agency"],
      page: 1,
      limit: 25,
      sort: "Start Date",
      order: "desc",
    };
    const data = await fetchJson(url, { method: "POST", body: JSON.stringify(payload) });
    const rawPath = await writeRaw(source, data);
    const results = Array.isArray(data.results) ? data.results : [];
    const signals = results.map((award: Record<string, string | number>, index: number) =>
      makeSignal({
        index,
        source,
        source_url: "https://www.usaspending.gov/",
        source_type: "market context",
        confidence: 0.58,
        company_name_raw: String(award["Recipient Name"] ?? "Unknown recipient"),
        date: String(award["Start Date"] ?? generatedAt),
        amount: typeof award["Award Amount"] === "number" ? award["Award Amount"] : undefined,
        agency_or_platform: String(award["Awarding Agency"] ?? "Federal award"),
        text: String(award.Description ?? ""),
        tags: tagsFrom(`${award["Recipient Name"] ?? ""} ${award.Description ?? ""}`),
        raw_snapshot_path: rawPath,
      }),
    );
    return {
      signals,
      health: {
        source,
        status: "ok",
        records: results.length,
        last_refresh: generatedAt,
        note: "Recent DOE assistance-award search succeeded; awards are treated as market context until recipient type is reviewed.",
        url: "https://api.usaspending.gov/docs/endpoints/",
      } satisfies SourceHealth,
    };
  } catch (error) {
    await writeRaw(source, { error: String(error) });
    return {
      signals: [] as Signal[],
      health: {
        source,
        status: "error",
        records: 0,
        last_refresh: generatedAt,
        note: `USAspending adapter failed gracefully: ${String(error)}`,
        url: "https://api.usaspending.gov/docs/endpoints/",
      } satisfies SourceHealth,
    };
  }
}

async function runFccEcfs() {
  const source = "FCC ECFS";
  const apiKey = process.env.API_DATA_GOV_KEY || "DEMO_KEY";
  const url = `https://publicapi.fcc.gov/ecfs/filings?api_key=${apiKey}&limit=25`;
  try {
    const data = await fetchJson(url, { headers: { "content-type": "application/json" } });
    const rawPath = await writeRaw(source, data);
    const filings = Array.isArray(data.filing) ? data.filing : [];
    const signals = filings
      .map((filing: Record<string, unknown>, index: number) => {
        const filer = Array.isArray(filing.filers)
          ? ((filing.filers[0] as Record<string, string> | undefined)?.name ?? "Unknown filer")
          : "Unknown filer";
        const proceedings = Array.isArray(filing.proceedings) ? filing.proceedings : [];
        const proceedingText = proceedings
          .map((proceeding) => (proceeding as Record<string, string>).description ?? "")
          .join(" ");
        return makeSignal({
          index,
          source,
          source_url: "https://www.fcc.gov/ecfs/",
          source_type: "market context",
          confidence: 0.45,
          company_name_raw: filer,
          date: String(filing.date_submission ?? filing.date_received ?? generatedAt),
          agency_or_platform: "FCC",
          text: `${proceedingText} ${String(filing.text_data ?? "")}`.trim(),
          tags: tagsFrom(`${filer} ${proceedingText} ${String(filing.text_data ?? "")}`),
          raw_snapshot_path: rawPath,
        });
      })
      .filter((signal: Signal) => signal.tags.some((tag) => ["spectrum", "wireless", "telecom", "energy"].includes(tag)));

    return {
      signals,
      health: {
        source,
        status: "ok",
        records: filings.length,
        last_refresh: generatedAt,
        note: apiKey === "DEMO_KEY" ? "Using DEMO_KEY; provide API_DATA_GOV_KEY for higher FCC rate limits." : "Using API_DATA_GOV_KEY.",
        url: "https://publicapi.fcc.gov/ecfs/filings",
      } satisfies SourceHealth,
    };
  } catch (error) {
    await writeRaw(source, { error: String(error) });
    return {
      signals: [] as Signal[],
      health: {
        source,
        status: "error",
        records: 0,
        last_refresh: generatedAt,
        note: `FCC adapter failed gracefully: ${String(error)}`,
        url: "https://publicapi.fcc.gov/ecfs/filings",
      } satisfies SourceHealth,
    };
  }
}

async function runSimpleTextSource(source: string, url: string, sourceType: "market context" | "manual review") {
  try {
    const text = await fetchText(url);
    const rawPath = await writeRaw(source, { url, length: text.length, excerpt: text.slice(0, 4000) });
    return {
      signals: [
        makeSignal({
          index: 0,
          source,
          source_url: url,
          source_type: sourceType,
          confidence: 0.35,
          company_name_raw: source,
          date: generatedAt,
          agency_or_platform: source,
          text: text.slice(0, 1000),
          tags: tagsFrom(text),
          raw_snapshot_path: rawPath,
        }),
      ],
      health: {
        source,
        status: "ok",
        records: 1,
        last_refresh: generatedAt,
        note: "Fetched public page for market context / candidate review.",
        url,
      } satisfies SourceHealth,
    };
  } catch (error) {
    await writeRaw(source, { url, error: String(error) });
    return {
      signals: [] as Signal[],
      health: {
        source,
        status: "error",
        records: 0,
        last_refresh: generatedAt,
        note: `${source} fetch failed gracefully: ${String(error)}`,
        url,
      } satisfies SourceHealth,
    };
  }
}

async function runSbir() {
  const source = "SBIR/STTR";
  const url = "https://api.www.sbir.gov/public/api/awards?agency=DOE&year=2024";
  try {
    const data = await fetchJson(url);
    const rawPath = await writeRaw(source, data);
    const awards = Array.isArray(data) ? data.slice(0, 25) : [];
    const signals = awards.map((award: Record<string, string | number>, index: number) =>
      makeSignal({
        index,
        source,
        source_url: "https://www.sbir.gov/data-resources",
        source_type: "primary",
        confidence: 0.7,
        company_name_raw: String(award.firm ?? award.company_name ?? "Unknown SBIR firm"),
        date: String(award.award_year ?? generatedAt),
        amount: typeof award.award_amount === "number" ? award.award_amount : undefined,
        agency_or_platform: String(award.agency ?? "SBIR"),
        text: String(award.abstract ?? award.award_title ?? ""),
        tags: tagsFrom(`${award.award_title ?? ""} ${award.abstract ?? ""}`),
        raw_snapshot_path: rawPath,
      }),
    );
    return {
      signals,
      health: {
        source,
        status: "ok",
        records: awards.length,
        last_refresh: generatedAt,
        note: "Official SBIR API responded.",
        url: "https://www.sbir.gov/api",
      } satisfies SourceHealth,
    };
  } catch (error) {
    await writeRaw(source, { error: String(error) });
    return {
      signals: [] as Signal[],
      health: {
        source,
        status: "partial",
        records: 0,
        last_refresh: generatedAt,
        note: `Official SBIR API unavailable; use bulk/download fallback later. Error: ${String(error)}`,
        url: "https://www.sbir.gov/data-resources",
      } satisfies SourceHealth,
    };
  }
}

async function runWebEnrichment() {
  const signals: Signal[] = [];
  const health: SourceHealth[] = [];

  for (const company of seedCompanies) {
    try {
      const text = await fetchText(company.website);
      const rawPath = await writeRaw(`web-${company.name}`, {
        url: company.website,
        length: text.length,
        excerpt: text.replace(/\s+/g, " ").slice(0, 2000),
      });
      signals.push(
        makeSignal({
          index: signals.length,
          source: company.source,
          source_url: company.website,
          source_type: company.source_type,
          confidence: 0.82,
          company_name_raw: company.name,
          date: generatedAt,
          agency_or_platform: "Company website",
          text: `${company.description} ${company.why_now}`,
          tags: tagsFrom(`${company.description} ${company.why_now} ${text.slice(0, 1500)}`),
          raw_snapshot_path: rawPath,
        }),
      );
      health.push({
        source: `Web enrichment: ${company.name}`,
        status: "ok",
        records: 1,
        last_refresh: generatedAt,
        note: "Company homepage fetched and cached.",
        url: company.website,
      });
    } catch (error) {
      health.push({
        source: `Web enrichment: ${company.name}`,
        status: "partial",
        records: 0,
        last_refresh: generatedAt,
        note: `Homepage fetch failed; retaining manually linked public source. ${String(error)}`,
        url: company.website,
      });
      signals.push(
        makeSignal({
          index: signals.length,
          source: company.source,
          source_url: company.website,
          source_type: company.source_type,
          confidence: 0.62,
          company_name_raw: company.name,
          date: generatedAt,
          agency_or_platform: "Company website",
          text: `${company.description} ${company.why_now}`,
          tags: tagsFrom(`${company.description} ${company.why_now}`),
        }),
      );
    }
  }

  return { signals, health };
}

function buildCompanies(signals: Signal[]) {
  return seedCompanies
    .map((seed) => {
      const companySignals = signals.filter((signal) => signal.company_name_normalized === normalizeName(seed.name));
      const sourceSignals = companySignals.length
        ? companySignals
        : [
            makeSignal({
              index: 0,
              source: seed.source,
              source_url: seed.website,
              source_type: seed.source_type,
              confidence: 0.55,
              company_name_raw: seed.name,
              date: generatedAt,
              agency_or_platform: "Manual public source fallback",
              text: `${seed.description} ${seed.why_now}`,
              tags: tagsFrom(`${seed.description} ${seed.why_now}`),
            }),
          ];

      return scoreCompany({
        company_id: normalizeName(seed.name),
        name: seed.name,
        website: seed.website,
        description: seed.description,
        atas_pillar: seed.atas_pillar,
        sector: seed.sector,
        buyer_hypothesis: seed.buyer_hypothesis,
        why_now: seed.why_now,
        signals: sourceSignals,
        hype_flags: seed.hype_flags,
        diligence_questions: diligenceFor(seed),
        source_links: Array.from(new Set([...seed.source_links, ...sourceSignals.map((signal) => signal.source_url)])),
        last_seen_at: generatedAt,
      });
    })
    .sort((a, b) => b.fit_score - a.fit_score);
}

function buildRejected(signals: Signal[]) {
  const rejected: RejectedCandidate[] = [];
  const incumbentPatterns = ["UNIVERSITY", "NATIONAL", "LOCKHEED", "BATTELLE", "LABORATORY", "LLC"];

  for (const signal of signals) {
    const raw = signal.company_name_raw.toUpperCase();
    if (incumbentPatterns.some((pattern) => raw.includes(pattern)) && rejected.length < 10) {
      rejected.push({
        name: signal.company_name_raw,
        source: signal.source,
        source_url: signal.source_url,
        reason: raw.includes("UNIVERSITY") || raw.includes("LABORATORY")
          ? "Useful market context, but likely university/lab rather than venture-backed startup."
          : "Useful market signal, but likely incumbent/OEM until startup evidence appears.",
        what_would_change: "Promote only if a startup spinout, commercial product, or venture-scale operating company is identified.",
        last_seen_at: generatedAt,
      });
    }
  }

  rejected.push(
    {
      name: "Generic AI factory dashboard",
      source: "Radar judgment rule",
      source_url: "https://atas.vc/",
      reason: "Thin dashboards without workflow control are not enough for the ATAS manufacturing thesis.",
      what_would_change: "Show control of production throughput, yield, downtime, or procurement decisions.",
      last_seen_at: generatedAt,
    },
    {
      name: "Carbon-credit-only ag finance",
      source: "Radar judgment rule",
      source_url: "https://atas.vc/",
      reason: "Weak operational wedge for agricultural infrastructure; too narrative-heavy without field control.",
      what_would_change: "Tie directly to farm operations, water, labor automation, or connected infrastructure ROI.",
      last_seen_at: generatedAt,
    },
  );

  return rejected;
}

async function main() {
  await ensureDirs();
  const web = await runWebEnrichment();
  const sourceResults = await Promise.all([
    runUSAspending(),
    runFccEcfs(),
    runSbir(),
    runSimpleTextSource("ARPA-E projects", "https://arpa-e.energy.gov/technologies/projects", "market context"),
    runSimpleTextSource("MSHA MDRS", "https://catalog.data.gov/dataset/msha-mine-data-retrieval-system-mdrs", "market context"),
    runSimpleTextSource("Black Flag 100", "https://www.blackflag.vc/100-2", "manual review"),
    runSimpleTextSource("YC Hard Tech", "https://www.ycombinator.com/companies/industry/hard-tech", "manual review"),
    runSimpleTextSource("Greenhouse Job Board API docs", "https://developers.greenhouse.io/job-board.html", "market context"),
    runSimpleTextSource("Lever Postings API docs", "https://github.com/lever/postings-api", "market context"),
    runSimpleTextSource("GitHub REST API docs", "https://docs.github.com/en/rest", "market context"),
  ]);

  const signals = [...web.signals, ...sourceResults.flatMap((result) => result.signals)];
  const source_health = [...web.health, ...sourceResults.map((result) => result.health)];
  const companies = buildCompanies(signals);
  const rejected = buildRejected(signals);

  const dataset: RadarDataset = {
    generated_at: generatedAt,
    companies,
    signals,
    rejected,
    source_health,
  };

  await writeFile(path.join(normalizedRoot, "radar.json"), JSON.stringify(dataset, null, 2));
  await writeFile(path.join(normalizedRoot, "companies.json"), JSON.stringify(companies, null, 2));
  await writeFile(path.join(normalizedRoot, "signals.json"), JSON.stringify(signals, null, 2));
  await writeFile(path.join(normalizedRoot, "rejected.json"), JSON.stringify(rejected, null, 2));
  await writeFile(path.join(normalizedRoot, "source-health.json"), JSON.stringify(source_health, null, 2));

  console.log(`ATAS Radar refresh complete: ${companies.length} companies, ${signals.length} signals, ${source_health.length} sources.`);
  console.log(`Data written to ${path.relative(root, normalizedRoot)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
