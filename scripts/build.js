#!/usr/bin/env node
// Builds dist/: a page per record for every kind that has a template in
// site-templates/<kind>.js, list pages, the JSON API, dumps and search.json.
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import * as config from "./lib/config.js";
import { loadRecords, refs, kindOf, publicCopy } from "./lib/records.js";
import { toCsv, flatten } from "./csv.js";
import { configure, t, displayName, altNames, listPage, homePage } from "../site-templates/shared.js";

const { DATA_DIR, OUT_DIR, TEMPLATE_DIR, KINDS, LANGS } = config;
const STATIC_DIR = join(TEMPLATE_DIR, "static");

function write(relPath, content) {
  const full = join(OUT_DIR, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function hash(content) {
  return createHash("md5").update(content).digest("hex").slice(0, 8);
}

const records = new Map();
const byKind = Object.fromEntries(KINDS.map((k) => [k, []]));
for (const { kind, file, record, error } of loadRecords(DATA_DIR)) {
  if (error) throw new Error(`${file}: ${error}`);
  const copy = publicCopy(record);
  records.set(copy.id, copy);
  byKind[kind].push(copy);
}

const backlinks = {};
for (const record of records.values()) {
  for (const ref of refs(record)) {
    (backlinks[ref.id] ??= []).push({ from: record.id, kind: kindOf(record.id), path: ref.path });
  }
}

const templates = {};
for (const kind of KINDS) {
  const file = join(TEMPLATE_DIR, `${kind}.js`);
  if (existsSync(file)) templates[kind] = (await import(pathToFileURL(file))).default;
}
const pageKinds = KINDS.filter((k) => templates[k]);

rmSync(OUT_DIR, { recursive: true, force: true });

for (const name of readdirSync(STATIC_DIR)) write(name, readFileSync(join(STATIC_DIR, name)));
configure({
  cssVersion: hash(readFileSync(join(STATIC_DIR, "styles.css"))),
  jsVersion: hash(readFileSync(join(STATIC_DIR, "site.js"))),
  pageKinds,
});

const lang = LANGS[0];
const url = (id) => (templates[kindOf(id)] ? `/${kindOf(id)}/${id}/` : null);
const ctx = {
  records,
  byKind,
  backlinks,
  config,
  lang,
  get: (id) => records.get(id),
  url,
  t: (key, vars) => t(key, vars, lang),
  // records of a kind that mention id, each once
  refsTo: (id, kind) => [...new Set((backlinks[id] ?? []).filter((b) => !kind || b.kind === kind).map((b) => b.from))].map((from) => records.get(from)),
};

const search = [];
for (const kind of pageKinds) {
  for (const record of byKind[kind]) {
    write(`${kind}/${record.id}/index.html`, templates[kind](record, ctx));
    search.push({ id: record.id, kind, title: displayName(record, lang), alt: altNames(record), url: url(record.id) });
  }
  write(`${kind}/index.html`, listPage(ctx, kind));
}

const homeFile = join(TEMPLATE_DIR, "home.js");
const renderHome = existsSync(homeFile) ? (await import(pathToFileURL(homeFile))).default : homePage;
write("index.html", renderHome(ctx));
write("search.json", JSON.stringify(search));

for (const kind of KINDS) {
  for (const record of byKind[kind]) write(`api/${kind}/${record.id}.json`, JSON.stringify(record, null, 2) + "\n");
  write(`api/${kind}.json`, JSON.stringify(byKind[kind], null, 2) + "\n");
  const rows = byKind[kind].map((r) => flatten(r));
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  write(`dumps/${kind}.csv`, toCsv(rows, columns.length ? columns : ["id"]));
}
write("dumps/all.ndjson", [...records.values()].map((r) => JSON.stringify(r) + "\n").join(""));

console.log(`Built ${records.size} record(s); pages for ${pageKinds.join(", ") || "no kinds yet"}.`);
