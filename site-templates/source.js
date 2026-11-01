import { escapeHtml, t, displayName, pageShell, countLabel, texEscape } from "./shared.js";
import { recordPage, section, linkList, people, sortByName } from "./music.js";
import { KINDS } from "../scripts/lib/config.js";

const BIB = { book: "book", book_chapter: "inbook", article: "article", thesis: "thesis", website: "online", recording: "audio", video: "video", unpublished: "unpublished" };
const IN_FIELD = { book_chapter: "booktitle", article: "journaltitle" };

const names = (ctx, list = []) => list.map((p) => (ctx.get(p) ? displayName(ctx.get(p)) : p));

// the source's own reference, in the four styles the citation block offers
export function sourceCitations(src, ctx) {
  const by = names(ctx, src.authors).join(", ");
  const year = src.date?.slice(0, 4) ?? "n.d.";
  const title = displayName(src);
  const where = [src.in && `${t("cite.in", {}, ctx.lang)} ${src.in}${src.volume ? ` ${src.volume}` : ""}`, src.publisher, src.pages].filter(Boolean).join(", ");
  const online = [src.url, src.archive_url && `${t("source.archived_at", {}, ctx.lang)} ${src.archive_url}`].filter(Boolean).join(". ");
  const tail = [where, online].filter(Boolean).join(". ");
  const apa = `${by ? `${by} (${year}). ` : ""}${title}.${by ? "" : ` (${year}).`}${tail ? ` ${tail}.` : ""}`;
  const chicago = `${by ? `${by}. ` : ""}${title}.${where ? ` ${where},` : ""} ${year}.${online ? ` ${online}.` : ""}`;
  const mla = `${by ? `${by}. ` : ""}${title}.${where ? ` ${where},` : ""} ${year}${online ? `, ${online}` : ""}.`;
  return { apa, chicago, mla, bibtex: bibtex(src, ctx) };
}

export function bibtex(src, ctx) {
  const fields = [
    ["author", names(ctx, src.authors).map(texEscape).join(" and ")],
    ["editor", names(ctx, src.editors).map(texEscape).join(" and ")],
    ["title", `{${texEscape(displayName(src))}}`],
    [IN_FIELD[src.type] ?? "howpublished", src.in && texEscape(src.in)],
    ["volume", src.volume],
    ["publisher", src.publisher && texEscape(src.publisher)],
    ["location", src.place && texEscape(src.place)],
    ["date", src.date],
    ["pages", src.pages],
    ["isbn", src.isbn],
    ["doi", src.doi],
    ["url", src.url],
    ["langid", src.language],
    ["addendum", src.archive_url && `Archived at \\url{${src.archive_url}}`],
  ].filter(([, v]) => v);
  return `@${BIB[src.type] ?? "misc"}{${src.id},\n${fields.map(([k, v]) => `  ${k.padEnd(9)} = {${v}},`).join("\n")}\n}`;
}

export default function source(record, ctx) {
  const lang = ctx.lang;
  const facts = [
    [t("source.type", {}, lang), escapeHtml(t(`source.type.${record.type}`, {}, lang))],
    [t("source.authors", {}, lang), people(ctx, record.authors)],
    [t("source.editors", {}, lang), people(ctx, record.editors)],
    [t("source.in", {}, lang), record.in && escapeHtml(record.volume ? `${record.in} ${record.volume}` : record.in)],
    [t("source.publisher", {}, lang), record.publisher && escapeHtml(record.place ? `${record.publisher}, ${record.place}` : record.publisher)],
    [t("source.date", {}, lang), record.date && escapeHtml(record.date)],
    [t("source.pages_label", {}, lang), record.pages && escapeHtml(record.pages)],
    ["ISBN", record.isbn && escapeHtml(record.isbn)],
    ["DOI", record.doi && `<a href="https://doi.org/${escapeHtml(record.doi)}">${escapeHtml(record.doi)}</a>`],
    [t("source.url", {}, lang), record.url && `<a href="${escapeHtml(record.url)}">${escapeHtml(record.url.replace(/^https?:\/\/|\/$/g, ""))}</a>`],
    [t("source.archive_url", {}, lang), record.archive_url && `<a href="${escapeHtml(record.archive_url)}">${escapeHtml(t("source.archived", {}, lang))}</a>`],
  ];
  const citing = ctx.refsTo(record.id);
  const groups = KINDS.map((kind) => {
    const list = citing.filter((r) => r.id.split("-")[1] === kind);
    return list.length ? `<h3>${escapeHtml(t(`kind.${kind}.plural`, {}, lang))}</h3>\n${linkList(ctx, list)}` : "";
  }).filter(Boolean);
  const main = [
    record.contributing ? `<p>${escapeHtml(t("source.contributing_note", {}, lang))}</p>` : "",
    section(t("source.cited_by", {}, lang), groups.join("\n"), "cited-by"),
  ].join("\n");
  return recordPage(ctx, record, {
    facts,
    main,
    citeAs: { heading: t("source.cite", {}, lang), built: sourceCitations(record, ctx) },
    description: t("source.description", { title: displayName(record, lang) }, lang),
  });
}

// contributing sources first, since they carry most records
export function list(ctx) {
  const lang = ctx.lang;
  const all = sortByName(ctx.byKind.source, lang);
  const contributing = all.filter((s) => s.contributing);
  const other = all.filter((s) => !s.contributing);
  const title = t("kind.source.plural", {}, lang);
  const body = `<div class="page__wrap">
<header class="page__header">
<h1 class="page__title">${escapeHtml(title)}</h1>
<p class="page__count">${escapeHtml(countLabel(all.length, lang))}</p>
</header>
${section(t("source.contributing", {}, lang), linkList(ctx, contributing), "contributing")}
${section(t("source.other", {}, lang), linkList(ctx, other), "other")}
<p><a href="/sources.bib">${escapeHtml(t("source.bib_all", {}, lang))}</a></p>
</div>`;
  return pageShell({ title, body, lang, path: "/source/" });
}
