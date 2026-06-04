export type AtasPillar =
  | "Evolution of Energy"
  | "Future of Manufacturing"
  | "Agricultural Infrastructure"
  | "American Necessities";

export type SourceConfidence = "primary" | "enrichment" | "market context" | "manual review";

export type Signal = {
  signal_id: string;
  source: string;
  source_url: string;
  source_type: SourceConfidence;
  confidence: number;
  company_name_raw: string;
  company_name_normalized: string;
  date: string;
  amount?: number;
  agency_or_platform?: string;
  text: string;
  tags: string[];
  raw_snapshot_path?: string;
};

export type Company = {
  company_id: string;
  name: string;
  website: string;
  description: string;
  atas_pillar: AtasPillar;
  sector: string;
  buyer_hypothesis: string;
  why_now: string;
  signals: Signal[];
  fit_score: number;
  risk_score: number;
  score_components: {
    thesis_fit: number;
    buyer_pain: number;
    traction_signal: number;
    timing: number;
    technical_depth: number;
    under_the_radar: number;
  };
  hype_flags: string[];
  diligence_questions: string[];
  source_links: string[];
  last_seen_at: string;
};

export type RejectedCandidate = {
  name: string;
  source: string;
  source_url: string;
  reason: string;
  what_would_change: string;
  last_seen_at: string;
};

export type SourceHealth = {
  source: string;
  status: "ok" | "partial" | "error";
  records: number;
  last_refresh: string;
  note: string;
  url: string;
};

export type RadarDataset = {
  generated_at: string;
  companies: Company[];
  signals: Signal[];
  rejected: RejectedCandidate[];
  source_health: SourceHealth[];
};
