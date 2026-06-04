import { readFile } from "node:fs/promises";
import path from "node:path";
import RadarApp from "@/components/RadarApp";
import type { RadarDataset } from "@/lib/types";

async function loadDataset(): Promise<RadarDataset> {
  const filePath = path.join(process.cwd(), "data", "normalized", "radar.json");
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as RadarDataset;
  } catch {
    return {
      generated_at: new Date().toISOString(),
      companies: [],
      signals: [],
      rejected: [],
      source_health: [],
    };
  }
}

export default async function Home() {
  const dataset = await loadDataset();
  return <RadarApp dataset={dataset} />;
}
