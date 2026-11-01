import { escapeHtml, t, link, mediaLink } from "./shared.js";
import { recordPage, section, renditionList } from "./music.js";

export default function carrier(record, ctx) {
  const lang = ctx.lang;
  const r = record.rights;
  const rights = escapeHtml(t(`rights.${r.status}`, {}, lang)) + (r.until ? escapeHtml(t("rights.until", { year: r.until }, lang)) : "");
  const online = (record.online ?? []).map((o) => `${mediaLink(o, lang)}${o.uploaded_by ? `, ${escapeHtml(t("media.uploaded_by", { name: o.uploaded_by }, lang))}` : ""}`).join("<br>");
  const a = record.audio ?? {};
  const facts = [
    [t("carrier.kind", {}, lang), escapeHtml(t(`carrier.kind.${record.kind}`, {}, lang))],
    [t("carrier.label", {}, lang), record.label && escapeHtml(record.label)],
    [t("carrier.catalogue_number", {}, lang), record.catalogue_number && escapeHtml(record.catalogue_number)],
    [t("carrier.matrix", {}, lang), record.matrix?.map(escapeHtml).join(", ")],
    [t("carrier.year", {}, lang), record.year && String(record.year)],
    [t("carrier.speed", {}, lang), record.speed && escapeHtml(t("carrier.rpm", { speed: record.speed }, lang))],
    [t("carrier.material", {}, lang), record.material && escapeHtml(t(`carrier.material.${record.material}`, {}, lang))],
    [t("carrier.folios", {}, lang), record.folios && String(record.folios)],
    [t("carrier.script", {}, lang), record.script && escapeHtml(record.script)],
    [t("carrier.scribe", {}, lang), record.scribe && link(ctx, record.scribe)],
    [t("kind.collection", {}, lang), record.collection && link(ctx, record.collection)],
    [t("carrier.online", {}, lang), online],
    [t("carrier.audio", {}, lang), [a.format, a.bitrate, a.sample_rate].filter(Boolean).map(escapeHtml).join(", ")],
    [t("carrier.rights", {}, lang), rights],
  ];
  const renditions = ctx.refsTo(record.id, "rendition");
  const note = r.note ? `<p>${escapeHtml(r.note)}</p>` : "";
  const main = [section(t("carrier.rights", {}, lang), note, "rights"), section(t("kind.rendition.plural", {}, lang), renditionList(ctx, renditions), "renditions")].join("\n");
  return recordPage(ctx, record, { facts, main });
}
