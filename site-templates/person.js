import { escapeHtml, t, localized, displayName } from "./shared.js";
import { recordPage, links, section, linkList, renditionList, sortByName } from "./music.js";

// gurus are stored on the sisya; sisyas are found by lookng the other way
function parampara(ctx, record) {
  const lang = ctx.lang;
  const gurus = (record.gurus ?? []).map((id) => ctx.get(id));
  const sisyas = ctx.refsTo(record.id, "person").filter((p) => p.gurus?.includes(record.id));
  if (!gurus.length && !sisyas.length) return "";
  const col = (heading, people) => people.length
    ? `<div><h3>${escapeHtml(heading)}</h3>${linkList(ctx, people)}</div>`
    : "";
  return section(t("person.parampara", {}, lang), `<div class="parampara">
${col(t("person.gurus", {}, lang), gurus)}
<div class="parampara__self"><p>${escapeHtml(displayName(record, lang))}</p></div>
${col(t("person.sisyas", {}, lang), sisyas)}
</div>`, "parampara");
}

export default function person(record, ctx) {
  const lang = ctx.lang;
  const years = [record.birth_year, record.death_year].filter(Boolean).join("–");
  const awards = (record.awards ?? []).map((a) => escapeHtml(a.year ? `${a.name}, ${a.year}` : a.name)).join("<br>");
  const facts = [
    [t("person.roles", {}, lang), record.roles.map((r) => escapeHtml(t(`role.${r}`, {}, lang))).join(", ")],
    [t("person.instruments", {}, lang), record.instruments?.map(escapeHtml).join(", ")],
    [t("person.years", {}, lang), years ? escapeHtml(years) : record.period && escapeHtml(record.period)],
    [t("person.place", {}, lang), record.place && localized(record.place, lang)],
    [t("person.sampradaya", {}, lang), record.sampradaya && escapeHtml(record.sampradaya)],
    [t("person.gurus", {}, lang), links(ctx, record.gurus)],
    [t("person.awards", {}, lang), awards],
    [t("person.website", {}, lang), record.website && `<a href="${escapeHtml(record.website)}">${escapeHtml(record.website.replace(/^https?:\/\/|\/$/g, ""))}</a>`],
  ];
  const poems = sortByName(ctx.refsTo(record.id, "gita").filter((g) => g.poet === record.id), lang);
  const kabyas = ctx.refsTo(record.id, "kabya").filter((k) => k.poet === record.id);
  const renditions = ctx.refsTo(record.id, "rendition").filter((r) => r.credits.some((c) => c.person === record.id));
  const main = [
    record.bio ? `<p>${localized(record.bio, lang)}</p>` : "",
    parampara(ctx, record),
    section(t("person.gitas", {}, lang), linkList(ctx, poems), "gitas"),
    section(t("kind.kabya.plural", {}, lang), linkList(ctx, kabyas), "kabyas"),
    section(t("kind.rendition.plural", {}, lang), renditionList(ctx, renditions), "renditions"),
    section(t("kind.collection.plural", {}, lang), linkList(ctx, ctx.refsTo(record.id, "collection")), "collections"),
  ].join("\n");
  return recordPage(ctx, record, { facts, main });
}
