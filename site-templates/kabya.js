import { escapeHtml, t, link, localized } from "./shared.js";
import { recordPage, section } from "./music.js";

export default function kabya(record, ctx) {
  const lang = ctx.lang;
  const gitas = ctx.refsTo(record.id, "gita").sort((a, b) => (a.kabya.position ?? 0) - (b.kabya.position ?? 0));
  const facts = [
    [t("gita.poet", {}, lang), record.poet && link(ctx, record.poet)],
    [t("kabya.form", {}, lang), record.form && escapeHtml(t(`kabya.form.${record.form}`, {}, lang))],
    [t("kabya.parts", {}, lang), record.parts && String(record.parts)],
    [t("kabya.in_archive", {}, lang), String(gitas.length)],
  ];
  const list = gitas.length
    ? `<ul class="record-list record-list--detail">\n${gitas.map((g) => `<li>${link(ctx, g.id)} <span class="count">${g.kabya.section ? localized(g.kabya.section, lang) : ""}</span></li>`).join("\n")}\n</ul>`
    : "";
  const main = [
    record.description ? `<p>${localized(record.description, lang)}</p>` : "",
    section(t("kind.gita.plural", {}, lang), list, "gitas"),
  ].join("\n");
  return recordPage(ctx, record, { facts, main });
}
