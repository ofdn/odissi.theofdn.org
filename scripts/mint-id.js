#!/usr/bin/env node
// Prints the next free id for a kind: node scripts/mint-id.js gita
import { DATA_DIR, KINDS, ID_PREFIX } from "./lib/config.js";
import { nextNumber } from "./lib/records.js";

const kind = process.argv[2];
if (!KINDS.includes(kind)) {
  console.error(`Usage: node scripts/mint-id.js <${KINDS.join("|")}>`);
  process.exit(1);
}
console.log(`${ID_PREFIX}-${kind}-${String(nextNumber(DATA_DIR, kind)).padStart(6, "0")}`);
