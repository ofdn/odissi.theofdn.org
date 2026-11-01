import { escapeHtml, t, localized } from "./shared.js";
import { recordPage, links, section, linkList } from "./music.js";

export default function collection(record, ctx) {
  const lang = ctx.lang;
  const facts = [
    [t("collection.held_by", {}, lang), links(ctx, record.held_by) || (record.held_by_name && escapeHtml(record.held_by_name))],
    [t("person.place", {}, lang), record.place && localized(record.place, lang)],
  ];
  const carriers = ctx.refsTo(record.id, "carrier");
  const main = [
    record.description ? `<p>${localized(record.description, lang)}</p>` : "",
    section(t("kind.carrier.plural", {}, lang), linkList(ctx, carriers), "carriers"),
  ].join("\n");
  return recordPage(ctx, record, { facts, main });
}
