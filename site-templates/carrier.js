import { escapeHtml, t, link, mediaLink } from "./shared.js";
import { recordPage, section, renditionList } from "./music.js";

export default function carrier(record, ctx) {
  const lang = ctx.lang;
  const r = record.rights;
  const rights = escapeHtml(t(`rights.${r.status}`, {}, lang)) + (r.until ? escapeHtml(t("rights.until", { year: r.until }, lang)) : "") + (r.note ? `. ${escapeHtml(r.note)}` : "");
  const online = (record.online ?? []).map((o) => `${mediaLink(o, lang)}${o.uploaded_by ? `, ${escapeHtml(t("media.uploaded_by", { name: o.uploaded_by }, lang))}` : ""}`).join("<br>");
  const a = record.audio ?? {};
  const facts = [
    [t("carrier.label", {}, lang), record.label && escapeHtml(record.label)],
    [t("carrier.catalogue_number", {}, lang), record.catalogue_number && escapeHtml(record.catalogue_number)],
    [t("carrier.matrix", {}, lang), record.matrix?.map(escapeHtml).join(", ")],
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
  const main = [section(t("kind.rendition.plural", {}, lang), renditionList(ctx, renditions, record.id), "renditions")].join("\n");
  const kicker = escapeHtml([t(`carrier.kind.${record.kind}`, {}, lang), record.year].filter(Boolean).join(", "));
  return recordPage(ctx, record, { facts, main, kicker });
}
