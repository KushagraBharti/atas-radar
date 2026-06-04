import type { AtasPillar, Company, Signal } from "./types";

const pillarKeywords: Record<AtasPillar, string[]> = {
  "Evolution of Energy": [
    "grid",
    "battery",
    "energy",
    "utility",
    "power",
    "microgrid",
    "mining",
    "critical mineral",
    "electrification",
  ],
  "Future of Manufacturing": [
    "manufacturing",
    "factory",
    "robotic",
    "machine",
    "inspection",
    "industrial",
    "supply chain",
    "materials",
  ],
  "Agricultural Infrastructure": [
    "farm",
    "agriculture",
    "crop",
    "irrigation",
    "water",
    "tractor",
    "harvest",
    "spray",
  ],
  "American Necessities": [
    "spectrum",
    "wireless",
    "water",
    "construction",
    "logistics",
    "permitting",
    "infrastructure",
    "telecom",
  ],
};

const technicalKeywords = [
  "autonomous",
  "robot",
  "controls",
  "rf",
  "spectrum",
  "materials",
  "grid",
  "battery",
  "computer vision",
  "embedded",
  "hardware",
  "industrial ai",
  "machine learning",
];

const timingKeywords = [
  "labor shortage",
  "reshoring",
  "data center",
  "grid congestion",
  "spectrum",
  "water scarcity",
  "critical minerals",
  "manufacturing capacity",
  "electrification",
  "federal",
  "infrastructure",
];

export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function countMatches(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.reduce((count, keyword) => count + (lower.includes(keyword) ? 1 : 0), 0);
}

export function scoreCompany(company: Omit<Company, "fit_score" | "risk_score" | "score_components">) {
  const signalText = company.signals.map((signal) => `${signal.text} ${signal.tags.join(" ")}`).join(" ");
  const fullText = `${company.name} ${company.description} ${company.sector} ${company.buyer_hypothesis} ${company.why_now} ${signalText}`;

  const thesisMatches = countMatches(fullText, pillarKeywords[company.atas_pillar]);
  const technicalMatches = countMatches(fullText, technicalKeywords);
  const timingMatches = countMatches(fullText, timingKeywords);
  const primarySignals = company.signals.filter((signal) => signal.source_type === "primary").length;
  const enrichmentSignals = company.signals.filter((signal) => signal.source_type === "enrichment").length;
  const sourceDiversity = new Set(company.signals.map((signal) => signal.source)).size;

  const thesis_fit = Math.min(30, 14 + thesisMatches * 4);
  const buyer_pain = company.buyer_hypothesis.length > 30 ? 18 : 10;
  const traction_signal = Math.min(20, primarySignals * 8 + enrichmentSignals * 4 + sourceDiversity * 2);
  const timing = Math.min(15, 7 + timingMatches * 3);
  const technical_depth = Math.min(10, 3 + technicalMatches * 2);
  const under_the_radar = company.hype_flags.includes("obvious consensus name") ? 1 : 4;
  const risk_score = Math.min(100, company.hype_flags.length * 12 + (primarySignals === 0 ? 25 : 0));

  return {
    ...company,
    score_components: {
      thesis_fit,
      buyer_pain,
      traction_signal,
      timing,
      technical_depth,
      under_the_radar,
    },
    fit_score: Math.round(thesis_fit + buyer_pain + traction_signal + timing + technical_depth + under_the_radar),
    risk_score,
  } satisfies Company;
}

export function diligenceFor(company: {
  atas_pillar: AtasPillar;
  buyer_hypothesis: string;
  sector: string;
}) {
  const base = [
    `What operational metric would make ${company.buyer_hypothesis} adopt this within 90 days?`,
    "Which incumbent workflow does the product actually displace rather than decorate?",
  ];

  if (company.atas_pillar === "Evolution of Energy") {
    return [
      ...base,
      "How much value comes from verified customer savings versus modelled/simulated value?",
      "What integration path is required before the product can touch live operations?",
      "Who owns liability when the system makes a bad dispatch, routing, or control decision?",
    ];
  }

  if (company.atas_pillar === "Future of Manufacturing") {
    return [
      ...base,
      "Does the software change production throughput, yield, downtime, or only visibility?",
      "How long is the deployment before the first paid production run improves?",
      "What does the buyer stop paying for if this works?",
    ];
  }

  if (company.atas_pillar === "Agricultural Infrastructure") {
    return [
      ...base,
      "Does the product survive field conditions, seasonality, and farm labor realities?",
      "What is the payback period per acre, machine, or crew?",
      "Who distributes this into farms: direct sales, dealers, co-ops, OEMs, or contractors?",
    ];
  }

  return [
    ...base,
    "What legal or regulatory authority remains outside the software layer?",
    "Which stakeholder can say yes quickly, and which stakeholder can block adoption?",
    "Is this a product wedge or a services/procurement wedge?",
  ];
}

export function signalId(source: string, name: string, index: number) {
  return `${normalizeName(source)}-${normalizeName(name)}-${index}`;
}

export function makeSignal(input: Omit<Signal, "signal_id" | "company_name_normalized"> & { index: number }) {
  return {
    ...input,
    signal_id: signalId(input.source, input.company_name_raw, input.index),
    company_name_normalized: normalizeName(input.company_name_raw),
  };
}
