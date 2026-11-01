import { escapeHtml, t, link, localized } from "./shared.js";
import { recordPage, section, linkList, renditionList } from "./music.js";

const svara = (s) => s && `<span class="svara">${escapeHtml(s)}</span>`;

export default function raga(record, ctx) {
  const lang = ctx.lang;
  const facts = [
    [t("raga.svaras", {}, lang), svara(record.svaras)],
    [t("raga.aroha", {}, lang), svara(record.aroha)],
    [t("raga.abaroha", {}, lang), svara(record.abaroha)],
    [t("raga.badi", {}, lang), svara(record.badi)],
    [t("raga.sambadi", {}, lang), svara(record.sambadi)],
    [t("raga.anga", {}, lang), record.anga && link(ctx, record.anga)],
  ];
  const gitas = ctx.refsTo(record.id, "gita");
  const renditions = ctx.refsTo(record.id, "rendition");
  const main = [
    record.description ? `<p>${localized(record.description, lang)}</p>` : "",
    section(t("raga.gitas", {}, lang), linkList(ctx, gitas), "gitas"),
    section(t("raga.renditions", {}, lang), renditionList(ctx, renditions, record.id), "renditions"),
  ].join("\n");
  return recordPage(ctx, record, { facts, main });
}
