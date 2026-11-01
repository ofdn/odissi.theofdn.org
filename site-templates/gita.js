import { escapeHtml, t, link, localized, displayName } from "./shared.js";
import { recordPage, links, verse, section, renditionList, stanzaLabel } from "./music.js";

function meaning(gita, lang) {
  const m = gita.meaning;
  if (!m?.stanzas?.length) return "";
  const byN = new Map(m.stanzas.map((s) => [s.n, s.text]));
  const rows = gita.text.stanzas
    .filter((s) => byN.has(s.n))
    .map((s) => `<div class="bilingual">
<p lang="or"><span class="stanza__num">${escapeHtml(stanzaLabel(s.n, lang))}</span> ${s.lines.map(escapeHtml).join("<br>")}</p>
<p>${escapeHtml(byN.get(s.n))}</p>
</div>`);
  return section(t("gita.meaning", {}, lang), `${rows.join("\n")}\n<p class="record-meta">${escapeHtml(t("gita.meaning_by", { names: m.by.join(", ") }, lang))}</p>`, "meaning");
}

// the text's edition joins the sources list, so one source is not named twice
function withEdition(record) {
  const ed = record.text?.edition;
  const sources = record.sources ?? [];
  if (!ed) return sources;
  const same = sources.findIndex((c) => c.source === ed.source && (!c.url || !ed.url || c.url === ed.url));
  if (same < 0) return [ed, ...sources];
  return sources.map((c, i) => (i === same ? { ...ed, ...c, url: c.url ?? ed.url, archive_url: c.archive_url ?? ed.archive_url } : c));
}

export default function gita(record, ctx) {
  const lang = ctx.lang;
  const kabya = record.kabya
    ? `${link(ctx, record.kabya.id)}${record.kabya.section ? `, ${localized(record.kabya.section, lang)}` : ""}`
    : "";
  const facts = [
    [t("gita.composer", {}, lang), record.composer ? link(ctx, record.composer) : escapeHtml(t("gita.unknown", {}, lang))],
    [t("gita.mula_raga", {}, lang), links(ctx, record.mula_raga)],
    [t("gita.mula_tala", {}, lang), links(ctx, record.mula_tala)],
    [t("gita.song_type", {}, lang), record.song_type && escapeHtml(t(`song_type.${record.song_type}`, {}, lang))],
    [t("kind.kabya", {}, lang), kabya],
    [t("gita.stanzas", {}, lang), record.text && String(record.text.stanzas.filter((s) => s.n > 0).length)],
  ];
  const text = record.text ? section(t("gita.text", {}, lang), verse(record.text.stanzas, lang), "text") : "";
  const renditions = ctx.refsTo(record.id, "rendition").filter((r) => r.gita === record.id);
  const main = [
    text,
    meaning(record, lang),
    section(t("kind.rendition.plural", {}, lang), renditionList(ctx, renditions, record.id), "renditions"),
  ].join("\n");
  const composer = record.composer ? displayName(ctx.get(record.composer), lang) : t("gita.unknown", {}, lang);
  return recordPage(ctx, record, {
    facts,
    main,
    sources: withEdition(record),
    description: t("gita.description", { title: record.name.en, composer }, lang),
  });
}
