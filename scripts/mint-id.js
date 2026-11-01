#!/usr/bin/env node
// Prints the next free id for a kind: node scripts/mint-id.js gita
import { join } from "node:path";
import { DATA_DIR, KINDS, ID_PREFIX } from "./lib/config.js";
import { jsonFiles, tombstones, ID_PATTERN } from "./lib/records.js";

const kind = process.argv[2];
if (!KINDS.includes(kind)) {
  console.error(`Usage: node scripts/mint-id.js <${KINDS.join("|")}>`);
  process.exit(1);
}

const used = [...jsonFiles(join(DATA_DIR, kind)).map((f) => f.slice(0, -5)), ...tombstones(DATA_DIR)];
let max = 0;
for (const id of used) {
  const m = ID_PATTERN.exec(id);
  if (m && m[1] === kind) max = Math.max(max, Number(m[2]));
}
console.log(`${ID_PREFIX}-${kind}-${String(max + 1).padStart(6, "0")}`);
