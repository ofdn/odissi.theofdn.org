import { escapeHtml, t, link, embed, mediaLink, displayName, renditionPeople } from "./shared.js";
import { recordPage, links, section, names, recordCitation, stanzaLabel } from "./music.js";

const BIB = { recording: "audio", notation: "unpublished", manuscript_copy: "unpublished" };

function creditRows(ctx, r) {
  const lang = ctx.lang;
  const rows = [];
  const named = renditionPeople(r);
  for (const role of ["vocalist", "notator", "scribe", "chorus", "music_director"]) {
    // the people under the heading are not listed again
    const people = r.credits.filter((c) => c.role === role && !named.includes(c.person));
    if (people.length) rows.push([t(`role.${role}`, {}, lang), people.map((c) => link(ctx, c.person)).join(", ")]);
  }
  const players = r.credits.filter((c) => c.role === "instrumentalist");
  if (players.length) {
    const list = players.map((c) => `${link(ctx, c.person)}${c.instrument ? ` (${escapeHtml(c.instrument)})` : ""}`);
    rows.push([t("role.instrumentalist.plural", {}, lang), list.join("<br>")]);
  }
  return rows;
}

function heldOn(ctx, r) {
  return (r.held_on ?? [])
    .map((h) => {
      const where = [h.side && t("carrier.side", { side: h.side }, ctx.lang), h.track && t("carrier.track", { track: h.track }, ctx.lang), h.pages && t("carrier.pages", { pages: h.pages }, ctx.lang)].filter(Boolean);
      return `${link(ctx, h.carrier)}${where.length ? `, ${escapeHtml(where.join(", "))}` : ""}`;
    })
    .join("<br>");
}

// the first online copy that can be embedded plays on the page
function player(ctx, r) {
  const title = displayName(r, ctx.lang);
  for (const h of r.held_on ?? []) {
    for (const o of ctx.get(h.carrier)?.online ?? []) {
      if (["youtube", "internet_archive"].includes(o.provider) && o.id) {
        const credit = o.uploaded_by ? `<p class="record-meta">${escapeHtml(t("media.uploaded_by", { name: o.uploaded_by }, ctx.lang))} ${mediaLink(o, ctx.lang)}</p>` : "";
        return `${embed(o, title, ctx.lang)}\n${credit}`;
      }
    }
  }
  return "";
}

export default function rendition(record, ctx) {
  const lang = ctx.lang;
  const gita = ctx.get(record.gita);
  // stanzas sung link to the text on the gīta page
  const stanzas = (record.stanzas ?? []).map((n) => `<a href="${escapeHtml(ctx.url(record.gita))}#stanza-${n}">${escapeHtml(stanzaLabel(n, lang))}</a>`).join(", ");
  const facts = [
    ...creditRows(ctx, record),
    [t("rendition.raga", {}, lang), links(ctx, record.raga)],
    [t("rendition.tala", {}, lang), links(ctx, record.tala)],
    [t("rendition.stanzas", {}, lang), stanzas],
    [t("rendition.pitch", {}, lang), record.pitch && escapeHtml(record.pitch)],
    [t("rendition.duration", {}, lang), record.duration && escapeHtml(record.duration)],
    [t("rendition.lineage", {}, lang), record.lineage && link(ctx, record.lineage)],
    [t("rendition.based_on", {}, lang), record.based_on && link(ctx, record.based_on)],
    [t("rendition.held_on", {}, lang), heldOn(ctx, record)],
  ];
  const derived = ctx.refsTo(record.id, "rendition").filter((r) => r.based_on === record.id);
  const main = [
    derived.length ? section(t("rendition.derived", {}, lang), `<ul>${derived.map((r) => `<li>${link(ctx, r.id)}</li>`).join("")}</ul>`, "derived") : "",
  ].join("\n");
  const people = record.credits.filter((c) => c.role !== "music_director").map((c) => c.person);
  const composer = gita?.composer ? [displayName(ctx.get(gita.composer), lang)] : [];
  const carrier = record.held_on?.length ? ctx.get(record.held_on[0].carrier) : null;
  const citation = recordCitation(ctx, record, {
    type: BIB[record.kind],
    title: gita ? displayName(gita, lang) : displayName(record, lang),
    authors: composer,
    performers: record.kind === "recording" ? names(ctx, people) : [],
    year: record.date?.slice(0, 4),
    container: carrier && carrier.kind !== "online" ? displayName(carrier, lang) : undefined,
    note: record.kind === "notation" ? t("cite.notation_by", { names: names(ctx, people).join(", ") }, lang) : undefined,
  });
  return recordPage(ctx, record, {
    facts,
    main,
    player: player(ctx, record),
    citation,
    description: displayName(record, lang),
    name: gita?.name,
    crumb: `<a href="${escapeHtml(ctx.url(record.gita))}">${escapeHtml(t("kind.gita", {}, lang))}</a>`,
    kicker: escapeHtml([t(`rendition.kind.${record.kind}`, {}, lang), record.date].filter(Boolean).join(", ")),
    subtitle: renditionPeople(record).map((id) => link(ctx, id)).join(", "),
  });
}
