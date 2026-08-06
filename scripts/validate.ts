// KB validation: runs zod schema checks + referential integrity on /data.
// Non-zero exit on any failure; wired into the build so bad data fails CI.
import {
  loadEntities,
  loadFacts,
  loadRelations,
  loadForeshadowing,
  loadKbMeta,
  loadReports,
  checkIntegrity,
} from "../lib/kb";

try {
  const entities = loadEntities();
  const facts = loadFacts();
  const relations = loadRelations();
  const foreshadowing = loadForeshadowing();
  const meta = loadKbMeta();
  const reports = loadReports();

  const errors = checkIntegrity(entities, facts, relations, foreshadowing);
  if (errors.length > 0) {
    console.error("KB integrity errors:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }

  console.log(`KB ${meta.kb_version} OK`);
  console.log(
    `  entities=${entities.length} facts=${facts.length} relations=${relations.length} foreshadowing=${foreshadowing.length} reports=${reports.length}`
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
