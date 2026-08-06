import { z } from "zod";

// ---------------------------------------------------------------------------
// Lore Guard data schemas (PRD §4 F1, DIRECTIVE §3)
// All KB JSON files are validated against these schemas at load time.
// Validation failure is treated as a build failure. The tool CIs its own data.
// ---------------------------------------------------------------------------

export const ENTITY_TYPES = [
  "character",
  "location",
  "faction",
  "artifact",
  "event",
  "planet",
  "concept",
  "creature",
] as const;

export const CLAIM_TYPES = [
  "timeline",
  "relation",
  "attribute",
  "naming",
  "tone-canon",
] as const;

export const FACT_STATUSES = [
  "active",
  "superseded",
  "deprecated",
  "conflicted",
] as const;

export const SOURCE_TIERS = [
  "official-site",
  "steam-official",
  "dev-note",
  "official-wiki",
  "community-wiki",
  "press",
] as const;

export const CONFIDENCE_LEVELS = ["confirmed", "probable", "speculative"] as const;

export const RELATION_TYPES = [
  "sentinel_of",
  "member_of",
  "leads",
  "created",
  "opposes",
  "allied_with",
  "located_in",
  "wields",
  "transformed_into",
] as const;

export const FORESHADOWING_STATUSES = [
  "unresolved",
  "resurfaced",
  "resolved",
  "abandoned",
] as const;

export const CHECK_TYPES = ["C1", "C2", "C3", "C4", "C5"] as const;
export const SEVERITIES = ["critical", "warning", "info"] as const;

// Copyright guardrail: verbatim quotes are capped at schema level
// (~15 words: 40 Korean chars / 90 Latin chars). Restating is the default.
const QUOTE_KO_MAX = 40;
const QUOTE_EN_MAX = 90;

export const SourceRefSchema = z.object({
  url: z.string().url(),
  source_tier: z.enum(SOURCE_TIERS),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const FactSchema = z.object({
  id: z.string().regex(/^FACT-\d{4}$/),
  entity_ids: z.array(z.string().regex(/^ENT-[A-Z0-9-]+$/)).min(1),
  claim_type: z.enum(CLAIM_TYPES),
  statement_ko: z.string().min(1),
  statement_en: z.string().min(1),
  quote_ko: z.string().max(QUOTE_KO_MAX).optional(),
  quote_en: z.string().max(QUOTE_EN_MAX).optional(),
  sources: z.array(SourceRefSchema).min(1),
  status: z.enum(FACT_STATUSES),
  superseded_by: z
    .string()
    .regex(/^FACT-\d{4}$/)
    .nullable(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  first_seen_kb_version: z.string().regex(/^\d{4}\.\d{2}(\.\d+)?$/),
  notes: z.string(),
});

export const EntitySchema = z.object({
  id: z.string().regex(/^ENT-[A-Z0-9-]+$/),
  type: z.enum(ENTITY_TYPES),
  name_ko: z.string().min(1),
  name_en: z.string().min(1),
  aliases: z.array(z.string()),
  summary_ko: z.string().min(1),
  status: z.enum(["active", "deprecated"]),
});

export const RelationSchema = z.object({
  id: z.string().regex(/^REL-\d{4}$/),
  from: z.string().regex(/^ENT-[A-Z0-9-]+$/),
  to: z.string().regex(/^ENT-[A-Z0-9-]+$/),
  type: z.enum(RELATION_TYPES),
  fact_ids: z.array(z.string().regex(/^FACT-\d{4}$/)),
});

export const ForeshadowingSchema = z.object({
  id: z.string().regex(/^FS-\d{3}$/),
  title_ko: z.string().min(1),
  summary_ko: z.string().min(1),
  status: z.enum(FORESHADOWING_STATUSES),
  linked_fact_ids: z.array(z.string().regex(/^FACT-\d{4}$/)),
  history: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      event: z.string().min(1),
      source_url: z.string().url().optional(),
    })
  ),
});

export const CheckReportSchema = z.object({
  id: z.string().regex(/^CHK-\d{4}$/),
  kb_version: z.string().regex(/^\d{4}\.\d{2}(\.\d+)?$/),
  check_type: z.enum(CHECK_TYPES),
  severity: z.enum(SEVERITIES),
  fact_ids: z.array(z.string().regex(/^FACT-\d{4}$/)),
  verdict_ko: z.string().min(1),
  evidence_ko: z.string().min(1),
  recommendation_ko: z.string().min(1),
  created_at: z.string(),
});

export const GlossaryEntrySchema = z.object({
  entity_id: z.string().regex(/^ENT-[A-Z0-9-]+$/),
  ko: z.string().min(1),
  en: z.string().min(1),
  variants: z.array(z.string()),
  type: z.enum(ENTITY_TYPES),
  definition_ko: z.string().min(1),
  source_url: z.string().url(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  status: z.enum(FACT_STATUSES),
  conflict: z.boolean(),
});

export const KbMetaSchema = z.object({
  kb_version: z.string().regex(/^\d{4}\.\d{2}(\.\d+)?$/),
  updated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_registry: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      url: z.string().url(),
      tier: z.enum(SOURCE_TIERS),
      registered_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
  ),
});

export const ChangeReportSchema = z.object({
  kb_version: z.string().regex(/^\d{4}\.\d{2}(\.\d+)?$/),
  previous_version: z.string().regex(/^\d{4}\.\d{2}(\.\d+)?$/),
  source: z.object({
    url: z.string().url(),
    label: z.string(),
    tier: z.enum(SOURCE_TIERS),
  }),
  created_at: z.string(),
  summary_ko: z.string(),
  new_fact_ids: z.array(z.string()),
  changed: z.array(z.object({ old_id: z.string(), new_id: z.string() })),
  confirmed_fact_ids: z.array(z.string()),
  resurfaced_foreshadowing_ids: z.array(z.string()),
});

export const ToneCanonSchema = z.object({
  principles: z.array(z.string()),
  banned_patterns: z.array(
    z.object({
      pattern: z.string(),
      label: z.string(),
      severity: z.enum(SEVERITIES),
    })
  ),
});

export type Entity = z.infer<typeof EntitySchema>;
export type ToneCanon = z.infer<typeof ToneCanonSchema>;
export type ChangeReport = z.infer<typeof ChangeReportSchema>;
export type Fact = z.infer<typeof FactSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type Foreshadowing = z.infer<typeof ForeshadowingSchema>;
export type CheckReport = z.infer<typeof CheckReportSchema>;
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;
export type KbMeta = z.infer<typeof KbMetaSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;
