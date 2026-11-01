import { escapeHtml, t, localized } from "./shared.js";
import { recordPage, section, linkList, renditionList, numbers } from "./music.js";

// one cell per mātrā, marked for ghāta and anāghāta.  a gap between bhāgas
function cycle(record, lang) {
  if (!record.matra) return "";
  const ghata = new Set(record.ghata ?? []);
  const wave = new Set(record.anaghata ?? []);
  const groups = record.chanda?.length ? record.chanda : [record.matra];
  let m = 0;
  const parts = groups.map((size) => {
    const cells = [];
    for (let i = 0; i < size; i++) {
      m++;
      const mark = ghata.has(m) ? "ghata" : wave.has(m) ? "anaghata" : "";
      const label = mark ? t(`tala.${mark}.short`, {}, lang) : "";
      cells.push(`<li class="matra${mark ? ` matra--${mark}` : ""}"><span class="matra__n">${m}</span>${label ? `<span class="matra__mark">${escapeHtml(label)}</span>` : ""}</li>`);
    }
    return `<ol class="bhaga" start="${m - size + 1}">${cells.join("")}</ol>`;
  });
  return `<div class="tala-cycle" role="group" aria-label="${escapeHtml(t("tala.cycle", {}, lang))}">${parts.join("")}</div>`;
}

export default function tala(record, ctx) {
  const lang = ctx.lang;
  const none = t("tala.none", {}, lang);
  const facts = [
    [t("tala.matra", {}, lang), record.matra && String(record.matra)],
    [t("tala.bhaga", {}, lang), record.bhaga && String(record.bhaga)],
    [t("tala.chanda", {}, lang), record.chanda?.join(" + ")],
    [t("tala.ghata", {}, lang), record.ghata && (numbers(record.ghata) || none)],
    [t("tala.anaghata", {}, lang), record.anaghata && (numbers(record.anaghata) || none)],
  ];
  const gitas = ctx.refsTo(record.id, "gita");
  const renditions = ctx.refsTo(record.id, "rendition");
  const main = [
    cycle(record, lang) ? section(t("tala.cycle", {}, lang), `${cycle(record, lang)}\n<p class="record-meta">${escapeHtml(t("tala.legend", {}, lang))}</p>`, "cycle") : "",
    record.description ? `<p>${localized(record.description, lang)}</p>` : "",
    section(t("raga.gitas", {}, lang), linkList(ctx, gitas), "gitas"),
    section(t("raga.renditions", {}, lang), renditionList(ctx, renditions), "renditions"),
  ].join("\n");
  return recordPage(ctx, record, { facts, main });
}
