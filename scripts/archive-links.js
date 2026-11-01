#!/usr/bin/env node
// Fills archive_url beside every url in sources and citations with the latest
// Wayback Machine copy. With --save, pages that have no copy yet are sent to
// Save Page Now first.
//   node scripts/archive-links.js [--save]
import { writeFileSync } from "node:fs";
import { loadRecords } from "./lib/records.js";

const save = process.argv.includes("--save");
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

async function latest(url) {
  const res = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Wayback lookup gave ${res.status}`);
  const snap = (await res.json()).archived_snapshots?.closest;
  return snap?.available ? snap.url.replace(/^http:/, "https:") : null;
}

// Save Page Now allows a few requests a minute  without an acount
async function archive(url) {
  const res = await fetch(`https://web.archive.org/save/${url}`, { redirect: "manual" });
  const where = res.headers.get("location") || res.headers.get("content-location");
  if (where) return new URL(where, "https://web.archive.org").href;
  await wait(20000);
  return latest(url);
}

// objects that carry a url: a source record, a citation, a gīta's text edition
function* targets(record) {
  if (record.url) yield record;
  for (const c of record.sources ?? []) if (c.url) yield c;
  if (record.text?.edition?.url) yield record.text.edition;
}

let found = 0;
const missing = [];
for (const { file, record, error } of loadRecords()) {
  if (error) continue;
  let changed = false;
  for (const target of targets(record)) {
    if (target.archive_url) continue;
    let copy = await latest(target.url);
    if (!copy && save) {
      copy = await archive(target.url);
      await wait(12000 + Math.random() * 6000);
    }
    if (copy) {
      target.archive_url = copy;
      changed = true;
      found++;
    } else {
      missing.push(`${record.id}: ${target.url}`);
    }
  }
  if (changed) writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
}

console.log(`Added ${found} archived link(s).`);
if (missing.length) {
  console.log(`No Wayback copy for ${missing.length} page(s)${save ? "" : "; run with --save to archive them"}:`);
  for (const m of missing) console.log(`  ${m}`);
}
