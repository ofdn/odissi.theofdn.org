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

function sourceItem(s) {
  const title = s.url ? `<a href="${escapeHtml(s.url)}">${escapeHtml(s.title)}</a>` : escapeHtml(s.title);
  const bits = [s.author !== s.title && s.author, s.publisher, s.date, s.pages].filter(Boolean).map(escapeHtml);
  return `<li>${title}${bits.length ? `, ${bits.join(", ")}` : ""}</li>`;
}

export function sourcesList(sources = [], lang) {
  if (!sources.length) return "";
  return section(t("sources.heading", {}, lang), `<ul class="sources">\n${sources.map(sourceItem).join("\n")}\n</ul>`, "sources");
}

export function creditsFor(ctx, record, role) {
  return (record.credits ?? []).filter((c) => c.role === role);
}

export function names(ctx, ids) {
  return ids.map((id) => displayName(ctx.get(id), ctx.lang));
}

// one line per rendition ,for gīta, person, rāga and tāḷa pages
export function renditionLine(ctx, r) {
  const lang = ctx.lang;
  const people = (r.credits ?? []).filter((c) => ["vocalist", "notator", "scribe"].includes(c.role)).map((c) => link(ctx, c.person));
  const bits = [t(`rendition.kind.${r.kind}`, {}, lang), people.join(", "), r.date && escapeHtml(r.date)].filter(Boolean);
  return `<li><a href="${escapeHtml(ctx.url(r.id))}">${localized(r.name, lang)}</a> <span class="count">${bits.join(", ")}</span></li>`;
}

export function renditionList(ctx, renditions) {
  if (!renditions.length) return "";
  const sorted = [...renditions].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  return `<ul class="record-list record-list--detail">\n${sorted.map((r) => renditionLine(ctx, r)).join("\n")}\n</ul>`;
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

function recordEnd(ctx, record, citation) {
  const lang = ctx.lang;
  const kind = record.id.split("-")[1];
  const note = pick(record.note, lang) ? `<p class="record-note">${localized(record.note, lang)}</p>` : "";
  const by = t("record.entered_by", { names: record.entered_by.join(", ") }, lang);
  return `${note}
${sourcesList(record.sources, lang)}
${citationBlock(citation, lang)}
${arkPermalink(record.id, lang)}
<p class="record-meta">${escapeHtml(by)} ${escapeHtml(t("record.updated", { date: record.updated_at }, lang))} <a href="/api/${kind}/${record.id}.json">${escapeHtml(t("record.json", {}, lang))}</a></p>`;
}

// every record page goes through here so they share one layout
export function recordPage(ctx, record, { facts = [], main = "", player = "", citation, description } = {}) {
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
    end: recordEnd(ctx, record, cite),
  });
  return pageShell({ title, description, body, lang, path: `/${kind}/${record.id}/`, headMeta: citationMeta(cite, lang) });
}
