// Parts shared by the record pages: header, sources, verse, renditions.
import { escapeHtml, t, localized, pick, displayName, link, pageShell, filmLayout, factsAside, arkPermalink, citationBlock, citationMeta } from "./shared.js";
import { SITE_URL } from "../scripts/lib/config.js";

export function links(ctx, ids = []) {
  return ids.map((id) => link(ctx, id)).join(", ");
}

export function numbers(list = []) {
  return list.join(", ");
}

export function sortByName(records, lang) {
  return [...records].sort((a, b) => displayName(a, lang).localeCompare(displayName(b, lang)));
}

export function linkList(ctx, records) {
  if (!records.length) return "";
  return `<ul class="record-list">\n${sortByName(records, ctx.lang).map((r) => `<li>${link(ctx, r.id)}</li>`).join("\n")}\n</ul>`;
}

export function section(heading, html, id) {
  if (!html) return "";
  return `<section aria-labelledby="${id}">\n<h2 id="${id}">${escapeHtml(heading)}</h2>\n${html}\n</section>`;
}

// stanza 0 is the ghoṣā
export function stanzaLabel(n, lang) {
  return n === 0 ? t("gita.ghosa", {}, lang) : String(n);
}

export function verse(stanzas, lang, only) {
  return stanzas
    .filter((s) => !only || only.includes(s.n))
    .map((s) => `<div class="stanza" id="stanza-${s.n}">
<span class="stanza__num">${escapeHtml(stanzaLabel(s.n, lang))}</span>
<p lang="or">${s.lines.map(escapeHtml).join("\n")}</p>
</div>`)
    .join("\n");
}

// authors may be names or person ids
export function people(ctx, list = []) {
  return list.map((p) => (ctx.get(p) ? link(ctx, p) : escapeHtml(p))).join(", ");
}

// One cited source, as HTML. A contributing source is named without its
// authors; they are credited on its own page.
export function citation(ctx, c) {
  const lang = ctx.lang;
  const src = ctx.get(c.source);
  const bits = [link(ctx, c.source)];
  const byline = (src.authors ?? []).filter((a) => a !== displayName(src, lang));
  if (!src.contributing) bits.push(people(ctx, byline), src.date && escapeHtml(src.date));
  if (c.pages) bits.push(escapeHtml(t("source.pages", { pages: c.pages }, lang)));
  const pages = [
    c.url && `<a href="${escapeHtml(c.url)}">${escapeHtml(t("source.original", {}, lang))}</a>`,
    c.archive_url && `<a href="${escapeHtml(c.archive_url)}">${escapeHtml(t("source.archived", {}, lang))}</a>`,
  ].filter(Boolean);
  const note = pick(c.note, lang) ? ` ${localized(c.note, lang)}` : "";
  return `${bits.filter(Boolean).join(", ")}${pages.length ? `: ${pages.join(", ")}` : ""}${note}`;
}

export function sourcesList(ctx, sources = []) {
  if (!sources.length) return "";
  const items = sources.map((c) => `<li>${citation(ctx, c)}</li>`);
  return section(t("sources.heading", {}, ctx.lang), `<ul class="sources">\n${items.join("\n")}\n</ul>`, "sources");
}

export function creditsFor(ctx, record, role) {
  return (record.credits ?? []).filter((c) => c.role === role);
}

export function names(ctx, ids) {
  return ids.map((id) => displayName(ctx.get(id), ctx.lang));
}

// One line per rendition: the gīta, then kind, artists, rāga, tāḷa and date in small type.
// pageId is the record the list sits on, so its own name is not repeated.
export function renditionLine(ctx, r, pageId) {
  const lang = ctx.lang;
  const href = escapeHtml(ctx.url(r.id));
  const kind = escapeHtml(t(`rendition.kind.${r.kind}`, {}, lang));
  const credited = r.credits.filter((c) => ["vocalist", "notator", "scribe"].includes(c.role) && c.person !== pageId).map((c) => link(ctx, c.person));
  const others = (ids = []) => ids.filter((id) => id !== pageId).map((id) => link(ctx, id)).join(", ");
  const rest = [credited.join(", "), others(r.raga), others(r.tala), r.date && escapeHtml(r.date)].filter(Boolean);
  if (r.gita === pageId) return `<li><span class="count">${[`<a href="${href}">${kind}</a>`, ...rest].join(", ")}</span></li>`;
  return `<li><a href="${href}">${localized(ctx.get(r.gita).name, lang)}</a> <span class="count">${[kind, ...rest].join(", ")}</span></li>`;
}

export function renditionList(ctx, renditions, pageId) {
  if (!renditions.length) return "";
  const sorted = [...renditions].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  return `<ul class="record-list record-list--detail">\n${sorted.map((r) => renditionLine(ctx, r, pageId)).join("\n")}\n</ul>`;
}

export function recordCitation(ctx, record, extra = {}) {
  return {
    type: "misc",
    id: record.id,
    title: displayName(record, ctx.lang),
    authors: [],
    year: record.created_at?.slice(0, 4),
    url: `${SITE_URL}${record.id.split("-")[1]}/${record.id}/`,
    ...extra,
  };
}

function recordEnd(ctx, record, citation, citeAs) {
  const lang = ctx.lang;
  const kind = record.id.split("-")[1];
  const note = pick(record.note, lang) ? `<p class="record-note">${localized(record.note, lang)}</p>` : "";
  const by = t("record.entered_by", { names: record.entered_by.join(", ") }, lang);
  return `${note}
${sourcesList(ctx, record.sources)}
${citationBlock(citation, lang, citeAs)}
${arkPermalink(record.id, lang)}
<p class="record-meta">${escapeHtml(by)} ${escapeHtml(t("record.updated", { date: record.updated_at }, lang))} <a href="/api/${kind}/${record.id}.json">${escapeHtml(t("record.json", {}, lang))}</a></p>`;
}

// every record page goes through here so they share one layout
export function recordPage(ctx, record, { facts = [], main = "", player = "", citation, citeAs, description } = {}) {
  const lang = ctx.lang;
  const kind = record.id.split("-")[1];
  const title = displayName(record, lang);
  const odia = record.name?.or && lang !== "or" ? `<p class="film__lede" lang="or">${escapeHtml(record.name.or)}</p>` : "";
  const header = `<p class="kind-label"><a href="/${kind}/">${escapeHtml(t(`kind.${kind}`, {}, lang))}</a></p>
<h1 class="film__title">${escapeHtml(title)}</h1>
${odia}`;
  const cite = citation ?? recordCitation(ctx, record);
  const body = filmLayout({
    header,
    player,
    facts: factsAside(facts, { lang }),
    main,
    end: recordEnd(ctx, record, cite, citeAs),
  });
  return pageShell({ title, description, body, lang, path: `/${kind}/${record.id}/`, headMeta: citationMeta(cite, lang) });
}
