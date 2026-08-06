import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  EntitySchema,
  FactSchema,
  RelationSchema,
  ForeshadowingSchema,
  CheckReportSchema,
  GlossaryEntrySchema,
  KbMetaSchema,
  type Entity,
  type Fact,
  type Relation,
  type Foreshadowing,
  type CheckReport,
  type GlossaryEntry,
  type KbMeta,
} from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");

function loadJson<T>(file: string, schema: z.ZodType<T>): T {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(
      `KB validation failed for ${file}:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }
  return parsed.data;
}

export function loadEntities(): Entity[] {
  return loadJson("entities.json", z.array(EntitySchema));
}

export function loadFacts(): Fact[] {
  return loadJson("facts.json", z.array(FactSchema));
}

export function loadRelations(): Relation[] {
  return loadJson("relations.json", z.array(RelationSchema));
}

export function loadForeshadowing(): Foreshadowing[] {
  return loadJson("foreshadowing.json", z.array(ForeshadowingSchema));
}

export function loadGlossary(): GlossaryEntry[] {
  if (!fs.existsSync(path.join(DATA_DIR, "glossary.json"))) return [];
  return loadJson("glossary.json", z.array(GlossaryEntrySchema));
}

export function loadKbMeta(): KbMeta {
  return loadJson("kb-meta.json", KbMetaSchema);
}

export function loadReports(): CheckReport[] {
  const dir = path.join(DATA_DIR, "reports");
  if (!fs.existsSync(dir)) return [];
  const reports: CheckReport[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json") || f.startsWith("change-")) continue;
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    const parsed = z.array(CheckReportSchema).safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error(`KB validation failed for reports/${f}`);
    }
    reports.push(...parsed.data);
  }
  return reports;
}

/** Findings for the current KB version only. Every headline count (sidebar
 *  gauge, dashboard stat, reports header) reads this; older report files stay
 *  on disk as history and are reachable through the reports screen's version
 *  picker, never summed into a headline number. */
export function loadLatestReports(): CheckReport[] {
  const version = loadKbMeta().kb_version;
  return loadReports().filter((r) => r.kb_version === version);
}

import { ChangeReportSchema, type ChangeReport } from "./schema";

/** Change-detection reports (F6), newest first. */
export function loadChangeReports(): ChangeReport[] {
  const dir = path.join(DATA_DIR, "reports");
  if (!fs.existsSync(dir)) return [];
  const reports: ChangeReport[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.startsWith("change-") || !f.endsWith(".json")) continue;
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    const parsed = ChangeReportSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error(`KB validation failed for reports/${f}`);
    reports.push(parsed.data);
  }
  return reports.sort((a, b) => b.kb_version.localeCompare(a.kb_version));
}

/** Cross-file referential integrity. Returns a list of human-readable errors. */
export function checkIntegrity(
  entities: Entity[],
  facts: Fact[],
  relations: Relation[],
  foreshadowing: Foreshadowing[]
): string[] {
  const errors: string[] = [];
  const entityIds = new Set(entities.map((e) => e.id));
  const factIds = new Set(facts.map((f) => f.id));

  const dupEnt = findDuplicates(entities.map((e) => e.id));
  const dupFact = findDuplicates(facts.map((f) => f.id));
  if (dupEnt.length) errors.push(`duplicate entity ids: ${dupEnt.join(", ")}`);
  if (dupFact.length) errors.push(`duplicate fact ids: ${dupFact.join(", ")}`);

  for (const f of facts) {
    for (const eid of f.entity_ids) {
      if (!entityIds.has(eid)) errors.push(`${f.id}: unknown entity ${eid}`);
    }
    if (f.superseded_by && !factIds.has(f.superseded_by)) {
      errors.push(`${f.id}: superseded_by points to unknown ${f.superseded_by}`);
    }
    if (f.status === "superseded" && !f.superseded_by) {
      errors.push(`${f.id}: superseded but no superseded_by link`);
    }
  }
  for (const r of relations) {
    if (!entityIds.has(r.from)) errors.push(`${r.id}: unknown entity ${r.from}`);
    if (!entityIds.has(r.to)) errors.push(`${r.id}: unknown entity ${r.to}`);
    for (const fid of r.fact_ids) {
      if (!factIds.has(fid)) errors.push(`${r.id}: unknown fact ${fid}`);
    }
  }
  for (const fs_ of foreshadowing) {
    for (const fid of fs_.linked_fact_ids) {
      if (!factIds.has(fid)) errors.push(`${fs_.id}: unknown fact ${fid}`);
    }
  }
  return errors;
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dups.add(id);
    seen.add(id);
  }
  return [...dups];
}
