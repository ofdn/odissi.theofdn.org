import { readFileSync } from "node:fs";
import { SITE_NAME, SITE_URL, PUBLISHER, PUBLISHER_PLACE, LICENCE, KINDS, NAV_KINDS, arkUrl } from "../scripts/lib/config.js";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const strings = {};
function table(lang) {
  strings[lang] ??= JSON.parse(readFileSync(new URL(`strings/${lang}.json`, import.meta.url), "utf8"));
  return strings[lang];
}

export function t(key, vars = {}, lang = "en") {
  const s = table(lang)[key] ?? table("en")[key];
  if (s === undefined) throw new Error(`No UI string "${key}" in strings/${lang}.json`);
  return s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

// vars here are already HTML, such as a link
export function tHtml(key, vars = {}, lang = "en") {
  return escapeHtml(t(key, {}, lang)).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

export function countLabel(n, lang = "en") {
  return n === 1 ? t("list.count.one", {}, lang) : t("list.count", { n }, lang);
}

// build.js sets these once the assets are hashed and the templates are known
const site = { cssVersion: "", jsVersion: "", pageKinds: [] };
export function configure(values) {
  Object.assign(site, values);
}

const ODIA = /[଀-୿]/;

// A plain string or a bilingual { en, or }. Returns { text, lang } or null.
export function pick(value, lang = "en") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return { text: value, lang: ODIA.test(value) ? "or" : lang };
  const key = value[lang] ? lang : value.en ? "en" : Object.keys(value).find((k) => typeof value[k] === "string" && value[k]);
  return key ? { text: value[key], lang: key } : null;
}

// Escaped text, wrapped in a lang span when it is not in the page language.
export function localized(value, lang = "en") {
  const p = pick(value, lang);
  if (!p) return "";
  const text = escapeHtml(p.text);
  return p.lang === lang ? text : `<span lang="${p.lang}">${text}</span>`;
}

export function odia(text) {
  return `<span lang="or">${escapeHtml(text)}</span>`;
}

export function nameValue(record) {
  return record.title ?? record.name ?? record.id;
}

export function displayName(record, lang = "en") {
  return pick(nameValue(record), lang)?.text ?? record.id;
}

function allStrings(value) {
  if (typeof value === "string") return [value];
  return value && typeof value === "object" ? Object.values(value).flatMap(allStrings) : [];
}

// Every other spelling of a record's name (name.or, name.alternates and so on), for search
export function altNames(record) {
  const main = displayName(record);
  const all = allStrings([nameValue(record), record.alt_names]);
  return [...new Set(all.filter((s) => s && s !== main))];
}

const TITLE_ROLES = { recording: ["vocalist", "instrumentalist"], notation: ["notator"], manuscript_copy: ["scribe"] };

// the people a rendition is known by: singers, else players; notators; scribes
export function renditionPeople(r) {
  for (const role of TITLE_ROLES[r.kind]) {
    const ids = r.credits.filter((c) => c.role === role).map((c) => c.person);
    if (ids.length) return ids;
  }
  return [];
}

// "Kadamba bane bansi bajila re (Notation, First1 Last1, 1969)" for tabs, search and links
export function renditionTitle(r, get, lang = "en") {
  const details = [t(`rendition.kind.${r.kind}`, {}, lang), ...renditionPeople(r).map((id) => displayName(get(id), lang)), r.date].filter(Boolean);
  return t("rendition.title", { gita: displayName(get(r.gita), lang), details: details.join(", ") }, lang);
}

// the name with its title (Kabisurjya, Gajapati) in a span of its own
export function titledName(name, lang = "en") {
  const p = pick(name, lang);
  if (!p) return "";
  const title = name.title?.[p.lang];
  let html = escapeHtml(p.text);
  const span = title ? `<span class="name-title">${escapeHtml(title)}</span>` : "";
  // a title not written in the name, like Kabi Kalahansa, goes before it
  if (title) html = p.text.includes(title) ? html.replace(escapeHtml(title), span) : `${span} ${html}`;
  return p.lang === lang ? html : `<span lang="${p.lang}">${html}</span>`;
}

// lists sort by the name without its title, Baladeba Ratha under B
export function sortName(record, lang = "en") {
  const p = pick(nameValue(record), lang);
  const title = record.name?.title?.[p.lang];
  return (title && p.text.replace(title, "").trim()) || p.text;
}

export function link(ctx, id) {
  const record = ctx.get(id);
  if (!record) return escapeHtml(id);
  const name = titledName(nameValue(record), ctx.lang);
  const url = ctx.url(id);
  return url ? `<a href="${escapeHtml(url)}">${name}</a>` : name;
}

export const COPY_ICON = `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

const DOWNLOAD_ICON = `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

const SEARCH_ICON = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

const THEME_ICON = `<svg class="icon-sun" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"></circle><line x1="12" y1="1.5" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22.5"></line><line x1="1.5" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22.5" y2="12"></line><line x1="4.5" y1="4.5" x2="6.2" y2="6.2"></line><line x1="17.8" y1="17.8" x2="19.5" y2="19.5"></line><line x1="4.5" y1="19.5" x2="6.2" y2="17.8"></line><line x1="17.8" y1="6.2" x2="19.5" y2="4.5"></line></svg><svg class="icon-moon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 1 0 11 11z"></path></svg>`;

export function arkPermalink(id, lang = "en") {
  const url = arkUrl(id);
  if (!url) return "";
  return `<p class="ark-permalink">${escapeHtml(t("ark.label", {}, lang))} <code>${escapeHtml(url)}</code> <button type="button" class="copy-id copy-icon-btn" data-copy="${escapeHtml(url)}" aria-label="${escapeHtml(t("ark.copy", {}, lang))}">${COPY_ICON}</button></p>`;
}

// Stops a "</script>" inside a string from closing the tag.
export function jsonLdScript(data) {
  const json = JSON.stringify(data, null, 2).replaceAll("</", "<\\/");
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function searchForm(lang) {
  const kinds = Object.fromEntries(KINDS.map((k) => [k, t(`kind.${k}`, {}, lang)]));
  return `<div class="header-search-wrap">
<form class="header-search" action="/" method="get" role="search" data-index="/search.json" data-kinds="${escapeHtml(JSON.stringify(kinds))}" data-none="${escapeHtml(t("search.none", {}, lang))}">
<span class="header-search-icon" aria-hidden="true">${SEARCH_ICON}</span>
<label class="visually-hidden" for="header-search-input">${escapeHtml(t("search.label", {}, lang))}</label>
<input id="header-search-input" type="search" name="q" placeholder="${escapeHtml(t("search.placeholder", {}, lang))}" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="header-search-results" aria-autocomplete="list">
<button type="button" id="header-search-clear" class="header-search-clear" aria-label="${escapeHtml(t("search.clear", {}, lang))}" hidden>&times;</button>
</form>
<div id="header-search-results" class="header-search-results" hidden></div>
</div>`;
}

function siteNav(path, lang) {
  const items = NAV_KINDS.filter((k) => site.pageKinds.includes(k)).map((k) => {
    const href = `/${k}/`;
    const current = path === href ? ' aria-current="page"' : path.startsWith(href) ? ' aria-current="true"' : "";
    return `<li><a href="${href}"${current}>${escapeHtml(t(`kind.${k}.plural`, {}, lang))}</a></li>`;
  });
  if (!items.length) return "";
  return `<nav class="site-nav" aria-label="${escapeHtml(t("nav.label", {}, lang))}">\n<ul>\n${items.join("\n")}\n</ul>\n</nav>`;
}

export function pageShell({ title, description, body, lang = "en", path = "/", pageScript = "", jsonld, headMeta = "" }) {
  const url = SITE_URL + path.replace(/^\//, "");
  const fullTitle = title ? `${title}, ${SITE_NAME}` : SITE_NAME;
  const desc = description ? `<meta name="description" content="${escapeHtml(description)}">\n<meta property="og:description" content="${escapeHtml(description)}">\n` : "";
  const licenceLink = `<a href="https://creativecommons.org/licenses/by-sa/4.0/">${escapeHtml(LICENCE)}</a>`;
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<script>
try { var theme = localStorage.getItem("oa-theme"); if (theme === "light" || theme === "dark") document.documentElement.setAttribute("data-theme", theme); } catch (e) {}
</script>
<title>${escapeHtml(fullTitle)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="${escapeHtml(url)}">
${desc}<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title || SITE_NAME)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&amp;family=Noto+Sans:wdth,wght@75,400..800&amp;family=Noto+Sans+Oriya:wght@400;600&amp;family=Source+Serif+4:ital,wght@0,400;0,600;1,400&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css${site.cssVersion ? `?v=${site.cssVersion}` : ""}">
${headMeta}
${jsonld ? jsonLdScript(jsonld) : ""}
</head>
<body>
<a class="skip-link" href="#main">${escapeHtml(t("skip", {}, lang))}</a>
<header class="site-header">
<a class="site-name" href="/">${escapeHtml(SITE_NAME)}</a>
${searchForm(lang)}
<button type="button" id="theme-toggle" class="theme-toggle" aria-label="${escapeHtml(t("theme.dark", {}, lang))}" data-dark="${escapeHtml(t("theme.dark", {}, lang))}" data-light="${escapeHtml(t("theme.light", {}, lang))}">${THEME_ICON}</button>
${siteNav(path, lang)}
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
<div class="site-footer__inner">
<img class="site-footer__logo" src="/ofdn-logo-white.svg" alt="" width="88" height="24">
<p>${escapeHtml(SITE_NAME)}. ${tHtml("footer.project", { ofdn: '<a href="https://theofdn.org/">O Foundation</a>' }, lang)} ${tHtml("footer.licence", { licence: licenceLink }, lang)} <a href="/source/">${escapeHtml(t("footer.sources", {}, lang))}</a></p>
</div>
</footer>
<script src="/site.js${site.jsVersion ? `?v=${site.jsVersion}` : ""}"></script>
${pageScript}
</body>
</html>
`;
}

// Film page layout from theofdn.org: details on the left, text on the right.
export function filmLayout({ header = "", player = "", facts = "", main = "", end = "" }) {
  const text = `<div class="film__main prose">\n${main}\n</div>`;
  // with no text, sources and citation go straight under the details
  const body = !facts ? text : main.trim() ? `<div class="film__body">\n${facts}\n${text}\n</div>` : `<div class="film__solo">\n${facts}\n</div>`;
  return `<div class="film__wrap">
<header class="film__header">
${header}
</header>
${player ? `<div class="film__player">\n${player}\n</div>\n` : ""}${body}
${end ? `<div class="page-end${!facts || !main.trim() ? " page-end--solo" : ""}">\n${end}\n</div>` : ""}
</div>`;
}

// rows are [label, valueHtml]; rows with no value are left out
export function factsAside(rows, { lang = "en", heading } = {}) {
  const items = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`);
  if (!items.length) return "";
  return `<aside class="film__facts" aria-labelledby="details">
<h2 class="label" id="details">${escapeHtml(heading ?? t("facts.heading", {}, lang))}</h2>
<dl>
${items.join("\n")}
</dl>
</aside>`;
}

const PROVIDERS = { youtube: "YouTube", internet_archive: "Internet Archive", spotify: "Spotify" };

function mediaUrl(online) {
  if (online.url) return online.url;
  if (online.provider === "youtube") return `https://www.youtube.com/watch?v=${encodeURIComponent(online.id)}`;
  if (online.provider === "internet_archive") return `https://archive.org/details/${encodeURI(online.id)}`;
  return null;
}

export function mediaLink(online, lang = "en") {
  const url = mediaUrl(online);
  if (!url) return "";
  const provider = PROVIDERS[online.provider] ?? online.provider;
  return `<a class="media-link" href="${escapeHtml(url)}">${escapeHtml(t("media.open", { provider }, lang))}</a>`;
}

// online is { provider, id, url }; title names the recording for screen readers
export function embed(online, title, lang = "en") {
  const provider = PROVIDERS[online.provider] ?? online.provider;
  let src = null;
  if (online.provider === "youtube" && online.id) src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(online.id)}`;
  if (online.provider === "internet_archive" && online.id) src = `https://archive.org/embed/${encodeURI(online.id)}`;
  if (!src) return mediaLink(online, lang);
  const frameTitle = escapeHtml(t("media.player", { title, provider }, lang));
  return `<div class="media-embed"><iframe src="${src}" title="${frameTitle}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}

export function texEscape(s) {
  return String(s).replace(/([&%$#_{}])/g, "\\$1");
}

const BIB_TYPES = ["audio", "music", "unpublished", "inbook", "inreference"];
const CITE_LABELS = ["audio", "music", "unpublished", "inbook", "score"];

// "First Last" becomes ["Last", "First"]; one-word names and github usernames stay whole
function nameParts(name) {
  const words = name.trim().split(/\s+/);
  return words.length < 2 || name.startsWith("@") ? [name] : [words.at(-1), words.slice(0, -1).join(" ")];
}
export const inverted = (name) => nameParts(name).join(", ");
const initialsOf = (given) => given.split(" ").map((w) => `${[...w.normalize("NFC")][0]}.`).join(" ");
const givenFirstInitials = (name) => {
  const [last, first] = nameParts(name);
  return first ? `${initialsOf(first)} ${last}` : last;
};
export const initials = (name) => {
  const [last, first] = nameParts(name);
  return first ? `${last}, ${initialsOf(first)}` : last;
};
export const dot = (s) => (s.endsWith(".") ? s : `${s}.`);
export const andList = (list, and) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")}, ${and} ${list.at(-1)}`);

// c is { type, title, dated, authors[], asWritten[], editors[] (of the container), compilers[], performers[], year, publisher, url, id, note, container }.
// names in asWritten have no surname and are never turned surname first
// __ACCESSED__ and __ACCESSED_ISO__ are filled in with the reader's date by site.js.
export function buildCitations(c, lang = "en") {
  const authors = c.authors ?? [];
  const performers = c.performers ?? [];
  const editors = c.container ? (c.editors ?? []).filter((e) => !authors.includes(e)) : [];
  const keep = new Set(c.asWritten);
  const surnameFirst = (a) => (keep.has(a) ? a : inverted(a));
  const compilers = c.compilers ?? [];
  const publisher = c.publisher ?? PUBLISHER;
  const year = c.year ?? "n.d.";
  const and = t("cite.and", {}, lang);
  const firstInverted = authors.map((a, i) => (i ? a : surnameFirst(a)));
  const byApa = andList(authors.map((a) => (keep.has(a) ? a : initials(a))), "&");
  const byChicago = andList(firstInverted, and);
  const byMla = authors.length > 2 ? `${firstInverted[0]}, et al.` : andList(firstInverted, and);
  const end = (by) => (by ? `${dot(by)} ` : "");
  const pub = publisher ? `${publisher}. ` : "";
  const pubYear = [publisher, year].filter(Boolean).join(", ");
  // dated is when the thing itself was made, year is when it was published here
  const label = CITE_LABELS.includes(c.type) ? t(`cite.type.${c.type}`, {}, lang) : "";
  const described = [label, c.dated].filter(Boolean).join(", ");
  const typeLabel = described ? ` [${described}]` : "";
  const edited = andList(editors, and);
  const inBook = c.container ? `${t("cite.in", {}, lang)} ${c.container}${edited ? `, ${t("cite.edited_by", { names: edited }, lang)}` : ""}. ` : "";
  const inApa = c.container
    ? `${t("cite.in", {}, lang)} ${editors.length ? `${andList(editors.map(givenFirstInitials), "&")} (${t(editors.length > 1 ? "cite.eds" : "cite.ed", {}, lang)}), ` : ""}${c.container}. `
    : "";
  const inMla = c.container ? `${c.container}, ${edited ? `${t("cite.edited_by", { names: edited }, lang)}, ` : ""}` : "";
  const compiled = compilers.length ? `${t("cite.compiled_by", { names: andList(compilers, and) }, lang)}. ` : "";
  const played = performers.length ? `${t("cite.performers", { names: performers.join(", ") }, lang)}. ` : "";
  const noted = c.note ? `${dot(c.note)} ` : "";
  const accessed = `${t("cite.accessed", {}, lang)} __ACCESSED__`;

  const apa = authors.length
    ? `${dot(byApa)} (${year}). ${c.title}${typeLabel}. ${played}${noted}${compiled}${inApa}${pub}${c.url}`
    : `${c.title}${typeLabel}. (${year}). ${played}${noted}${compiled}${inApa}${pub}${c.url}`;
  const chicago = `${end(byChicago)}"${c.title}." ${described ? `${described}. ` : ""}${played}${noted}${compiled}${inBook}${dot(pubYear)} ${accessed}. ${c.url}.`;
  const mla = `${end(byMla)}"${c.title}." ${described ? `${described}. ` : ""}${played}${noted}${compiled}${inMla}${pubYear}, ${c.url}. ${accessed}.`;

  const fields = [
    ["author", authors.map((a) => (keep.has(a) ? `{${texEscape(a)}}` : texEscape(inverted(a)))).join(" and ")],
    ["editora", performers.map(texEscape).join(" and ")],
    ["editoratype", performers.length ? "performer" : ""],
    ["editorb", compilers.map((a) => texEscape(inverted(a))).join(" and ")],
    ["editorbtype", compilers.length ? "compiler" : ""],
    ["editor", editors.map((a) => texEscape(inverted(a))).join(" and ")],
    ["title", `{${texEscape(c.title)}}`],
    ["titleaddon", label],
    ["booktitle", c.container && texEscape(c.container)],
    ["publisher", texEscape(publisher)],
    ["date", c.year],
    ["origdate", c.dated],
    ["url", c.url],
    ["urldate", "__ACCESSED_ISO__"],
    ["note", c.note && texEscape(c.note)],
  ].filter(([, v]) => v);
  const entry = c.container === SITE_NAME ? "inreference" : BIB_TYPES.includes(c.type) ? c.type : "misc";
  const bibtex = `@${entry}{${c.id},\n${fields.map(([k, v]) => `  ${k.padEnd(11)} = {${v}},`).join("\n")}\n}`;

  return { apa, chicago, mla, bibtex };
}

// Highwire Press and Dublin Core tags for Zotero and Mendeley, passed to pageShell as headMeta.
// No <link rel="schema.DC">: Zotero drops the DC tags if it is rewritten to https.
export function citationMeta(c, lang = "en") {
  const tags = [
    ["citation_title", c.title],
    ...(c.authors ?? []).map((a) => ["citation_author", c.asWritten?.includes(a) ? a : inverted(a)]),
    ["citation_inbook_title", c.container],
    ["citation_publication_date", c.year],
    ["citation_publisher", c.publisher ?? PUBLISHER],
    ["citation_language", lang],
    ["citation_public_url", c.url],
    ["DC.title", c.title],
    ...(c.authors ?? []).map((a) => ["DC.creator", a]),
    ...(c.performers ?? []).map((p) => ["DC.contributor", p]),
    ["DC.date", c.year],
    ["DC.relation.ispartof", c.container],
    ["DC.publisher", c.publisher ?? PUBLISHER],
    ["DC.rights", LICENCE],
    ["eprints.place_of_pub", PUBLISHER_PLACE],
    ["DC.language", lang],
    ["DC.identifier", c.url],
    ["DC.identifier", arkUrl(c.id)],
  ];
  return tags
    .filter(([, v]) => v)
    .map(([name, content]) => `<meta name="${name}" content="${escapeHtml(content)}">`)
    .join("\n");
}

// built is { apa, chicago, mla, bibtex } when the page cites something other than itself
export function citationBlock(c, lang = "en", { heading = t("cite.heading", {}, lang), built = buildCitations(c, lang) } = {}) {
  const data = escapeHtml(JSON.stringify(built));
  const id = escapeHtml(c.id);
  return `<section class="citation-block" data-citation="${data}" data-id="${id}" aria-labelledby="cite-${id}">
<h2 id="cite-${id}">${escapeHtml(heading)}</h2>
<div class="citation-controls">
<label class="visually-hidden" for="citation-style-${id}">${escapeHtml(t("cite.format", {}, lang))}</label>
<select id="citation-style-${id}" class="citation-style">
<option value="apa">APA</option>
<option value="chicago">Chicago</option>
<option value="mla">MLA</option>
<option value="bibtex">BibTeX</option>
</select>
<button type="button" class="copy-id copy-icon-btn citation-copy" aria-label="${escapeHtml(t("cite.copy", {}, lang))}">${COPY_ICON}</button>
<button type="button" class="citation-download">${DOWNLOAD_ICON}${escapeHtml(t("cite.download", {}, lang))}</button>
</div>
<pre class="citation-text"></pre>
</section>`;
}

export function listPage(ctx, kind) {
  const lang = ctx.lang;
  const plural = t(`kind.${kind}.plural`, {}, lang);
  const records = [...ctx.byKind[kind]].sort((a, b) => sortName(a, lang).localeCompare(sortName(b, lang)));
  const items = (rs) => `<ul class="record-list">\n${rs.map((r) => `<li>${link(ctx, r.id)}</li>`).join("\n")}\n</ul>`;
  let list = records.length ? items(records) : `<p>${escapeHtml(t("list.empty", {}, lang))}</p>`;
  // long lists get an A to Z row; Āḍatāḷi files under A
  if (records.length > 30) {
    const initial = (r) => {
      const c = sortName(r, lang).normalize("NFD")[0].toUpperCase();
      return c >= "A" && c <= "Z" ? c : "#";
    };
    const groups = new Map();
    for (const r of records) groups.set(initial(r), [...(groups.get(initial(r)) ?? []), r]);
    const row = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"]
      .filter((c) => c !== "#" || groups.has("#"))
      .map((c) => `<li>${groups.has(c) ? `<a href="#letter-${c === "#" ? "other" : c.toLowerCase()}">${c}</a>` : `<span>${c}</span>`}</li>`);
    const sections = [...groups].map(([c, rs]) => `<h2 class="letter" id="letter-${c === "#" ? "other" : c.toLowerCase()}">${c}</h2>\n${items(rs)}`);
    list = `<nav class="letters" aria-label="${escapeHtml(t("list.letters", {}, lang))}"><ul>${row.join("")}</ul></nav>\n${sections.join("\n")}`;
  }
  const body = `<div class="page__wrap">
<header class="page__header">
<h1 class="page__title">${escapeHtml(plural)}</h1>
<p class="page__count">${escapeHtml(countLabel(records.length, lang))}</p>
</header>
${list}
</div>`;
  return pageShell({ title: plural, body, lang, path: `/${kind}/` });
}

export function homePage(ctx) {
  const lang = ctx.lang;
  const items = site.pageKinds
    .map((k) => `<li><a href="/${k}/">${escapeHtml(t(`kind.${k}.plural`, {}, lang))}</a> <span class="count">${escapeHtml(countLabel(ctx.byKind[k].length, lang))}</span></li>`)
    .join("\n");
  const body = `<div class="page__wrap">
<header class="page__header">
<h1 class="page__title">${escapeHtml(SITE_NAME)}</h1>
</header>
${items ? `<h2>${escapeHtml(t("home.browse", {}, lang))}</h2>\n<ul class="record-list">\n${items}\n</ul>` : ""}
</div>`;
  return pageShell({ body, lang, path: "/" });
}
