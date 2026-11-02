#!/usr/bin/env node
// Builds dist/: a page per record for every kind that has a template in
// site-templates/<kind>.js, list pages, the JSON API, dumps and search.json.
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import * as config from "./lib/config.js";
import { loadRecords, refs, kindOf, publicCopy, tombstones } from "./lib/records.js";
import { toCsv, flatten } from "./csv.js";
import { configure, t, displayName, altNames, listPage, homePage, renditionTitle, pageShell, escapeHtml } from "../site-templates/shared.js";

const { DATA_DIR, OUT_DIR, TEMPLATE_DIR, KINDS, LANGS } = config;
const STATIC_DIR = join(TEMPLATE_DIR, "static");

// templates link from the site root; this moves those links under BASE_PATH
// and opens links to other sites in a new window
function rebase(html) {
  const out = config.BASE_PATH === "/" ? html : html.replace(/ (href|src|action|data-index)="\/(?!\/)/g, ` $1="${config.BASE_PATH}`);
  return out.replace(/<a ([^>]*?)href="(https?:\/\/[^"]+)"/g, (m, attrs, u) => (u.startsWith(config.SITE_URL) ? m : `<a ${attrs}href="${u}" target="_blank" rel="noopener"`));
}

function write(relPath, content) {
  const full = join(OUT_DIR, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

// pages also go to /dev/ for trying out design changes
const pages = [];
function page(relPath, html) {
  write(relPath, html);
  pages.push([relPath, html]);
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

for (const r of byKind.rendition) r.name ??= { en: renditionTitle(r, (id) => records.get(id)) };

const backlinks = {};
for (const record of records.values()) {
  for (const ref of refs(record)) {
    (backlinks[ref.id] ??= []).push({ from: record.id, kind: kindOf(record.id), path: ref.path });
  }
}

const templates = {};
const lists = {};
const modules = {};
for (const kind of KINDS) {
  const file = join(TEMPLATE_DIR, `${kind}.js`);
  if (!existsSync(file)) continue;
  modules[kind] = await import(pathToFileURL(file));
  templates[kind] = modules[kind].default;
  lists[kind] = modules[kind].list ?? ((c) => listPage(c, kind));
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
    page(`${kind}/${record.id}/index.html`, rebase(templates[kind](record, ctx)));
    search.push({ id: record.id, kind, title: displayName(record, lang), alt: altNames(record), url: config.BASE_PATH + url(record.id).slice(1) });
  }
  page(`${kind}/index.html`, rebase(lists[kind](ctx)));
}

// a retired id keeps its address, so old links and citations say what happened
for (const id of tombstones(DATA_DIR)) {
  const kind = kindOf(id);
  if (!templates[kind]) continue;
  const title = t("withdrawn.title", {}, lang);
  const body = `<div class="page__wrap">\n<h1 class="page__title">${escapeHtml(title)}</h1>\n<p>${escapeHtml(t("withdrawn.text", { id }, lang))}</p>\n</div>`;
  page(`${kind}/${id}/index.html`, rebase(pageShell({ title, body, lang, path: `/${kind}/${id}/` })));
}

const homeFile = join(TEMPLATE_DIR, "home.js");
const renderHome = existsSync(homeFile) ? (await import(pathToFileURL(homeFile))).default : homePage;
page("index.html", rebase(renderHome(ctx)));
write("search.json", JSON.stringify(search));
if (modules.source) write("sources.bib", byKind.source.map((s) => modules.source.bibtex(s, ctx)).join("\n\n") + "\n");

for (const kind of KINDS) {
  for (const record of byKind[kind]) write(`api/${kind}/${record.id}.json`, JSON.stringify(record, null, 2) + "\n");
  write(`api/${kind}.json`, JSON.stringify(byKind[kind], null, 2) + "\n");
  const rows = byKind[kind].map((r) => flatten(r));
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  write(`dumps/${kind}.csv`, toCsv(rows, columns.length ? columns : ["id"]));
}
write("dumps/all.ndjson", [...records.values()].map((r) => JSON.stringify(r) + "\n").join(""));

// /dev/ is not linked from the site and asks search engines to stay away
const DEV_DIR = join(TEMPLATE_DIR, "dev");
if (existsSync(DEV_DIR)) {
  const dev = config.BASE_PATH + "dev/";
  for (const name of readdirSync(DEV_DIR)) if (!name.endsWith("-credit.html")) write(`dev/${name}`, readFileSync(join(DEV_DIR, name)));
  const head = `<meta name="robots" content="noindex, nofollow">\n<link rel="stylesheet" href="${dev}dev.css?v=${hash(readFileSync(join(DEV_DIR, "dev.css")))}">\n</head>`;
  for (const [rel, html] of pages) {
    // a list page gets its kind's picture when dev/<kind>.png exists
    const icon = rel.match(/^(\w+)\/index\.html$/)?.[1];
    const credit = icon && existsSync(join(DEV_DIR, `${icon}-credit.html`)) ? rebase(readFileSync(join(DEV_DIR, `${icon}-credit.html`), "utf8").trim()) : "";
    const withIcon = icon && existsSync(join(DEV_DIR, `${icon}.png`))
      ? html
          .replace('<header class="page__header">', `<header class="page__header page__header--icon">\n<img class="kind-icon" src="${dev}${icon}.png?v=${hash(readFileSync(join(DEV_DIR, `${icon}.png`)))}" alt="" width="160" height="160">`)
          .replace(/(<p class="page__count">.*?<\/p>)/, credit ? `$1\n<p class="kind-icon__credit">${credit}</p>` : "$1")
      : html;
    // page links move under /dev/, files (css, js, json, bib) stay where they are
    const out = withIcon
      .replace(/ (href|action)="([^"]*)"/g, (m, attr, u) => (u.startsWith(config.BASE_PATH) && !/\.[a-z]+([?#]|$)/i.test(u) ? ` ${attr}="${dev}${u.slice(config.BASE_PATH.length)}"` : m))
      .replace(/ data-index="[^"]*"/, ` data-index="${dev}search.json"`)
      .replace("</head>", head);
    write(`dev/${rel}`, out);
  }
  write("dev/search.json", JSON.stringify(search.map((s) => ({ ...s, url: dev + s.url.slice(config.BASE_PATH.length) }))));
}

console.log(`Built ${records.size} record(s); pages for ${pageKinds.join(", ") || "no kinds yet"}.`);
