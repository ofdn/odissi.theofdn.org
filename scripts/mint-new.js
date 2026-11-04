#!/usr/bin/env node
// Gives each data/<kind>/new-*.json the next free id and points every link at it.
// Runs before the check on pull requests and before the build on main.
//   node scripts/mint-new.js [data dir]
import { writeFileSync, renameSync } from "node:fs";
import { join, basename } from "node:path";
import { DATA_DIR, KINDS, ID_PREFIX } from "./lib/config.js";
import { loadRecords, jsonFiles, nextNumber, NEW_ID } from "./lib/records.js";

const dataDir = process.argv[2] || DATA_DIR;
const ids = new Map();
for (const kind of KINDS) {
  let n = nextNumber(dataDir, kind);
  const fresh = jsonFiles(join(dataDir, kind)).map((f) => f.slice(0, -5)).filter((id) => NEW_ID.test(id));
  for (const id of fresh.sort((a, b) => a.localeCompare(b, "en", { numeric: true }))) {
    ids.set(id, `${ID_PREFIX}-${kind}-${String(n++).padStart(6, "0")}`);
  }
}

// [@new-source-…] in an archival note is a link too
function swap(v) {
  if (typeof v === "string") return ids.get(v) ?? v.replace(/\[@(new-[a-z0-9-]+)/g, (m, id) => (ids.has(id) ? `[@${ids.get(id)}` : m));
  if (Array.isArray(v)) return v.map(swap);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
  return v;
}

if (ids.size) {
  for (const { kind, file, record } of loadRecords(dataDir)) {
    if (!record) continue;
    const next = swap(record);
    const id = basename(file, ".json");
    if (!ids.has(id) && JSON.stringify(next) === JSON.stringify(record)) continue;
    writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
    if (ids.has(id)) renameSync(file, join(dataDir, kind, `${ids.get(id)}.json`));
  }
  for (const [from, to] of ids) console.log(`${from} -> ${to}`);
}
