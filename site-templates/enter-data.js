// /enter-data/: a form for new records that sends them to GitHub as an issue.
// The fields are listed here; static/enter-data.js draws the form from this list.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_DIR, REPO_URL } from "../scripts/lib/config.js";
import { escapeHtml, t, pageShell } from "./shared.js";

const schema = (kind) => JSON.parse(readFileSync(join(SCHEMA_DIR, `${kind}.schema.json`), "utf8"));
const props = (kind) => Object.assign({}, schema(kind).properties, ...(schema(kind).allOf ?? []).map((p) => p.properties ?? {}));
const options = (values, prefix, lang) => values.map((v) => ({ value: v, label: t(`${prefix}.${v}`, {}, lang) }));

export default function enterData(ctx) {
  const lang = ctx.lang;
  const f = (path, type, extra = {}) => ({ path, type, label: t(`enter.field.${path}`, {}, lang), ...extra });
  const named = [f("name.en", "text", { required: true }), f("name.or", "text", { lang: "or" }), f("name.alternates", "list")];
  const sources = f("sources", "sources");
  const roles = props("person").roles.items.enum;
  const creditRoles = props("rendition").credits.items.properties.role.enum;

  const forms = {
    gita: [
      ...named,
      f("composer", "link", { kind: "person" }),
      f("mula_raga", "links", { kind: "raga" }),
      f("mula_tala", "links", { kind: "tala" }),
      f("song_type", "select", { options: props("gita").song_type.enum.map((v) => ({ value: v, label: v })) }),
      f("kabya.id", "link", { kind: "kabya" }),
      f("kabya.section.en", "text"),
      f("text.stanzas", "stanzas", { lang: "or" }),
      sources,
    ],
    raga: [...named, f("svaras", "text"), f("aroha", "text"), f("abaroha", "text"), f("badi", "text"), f("sambadi", "text"), f("anga", "link", { kind: "raga" }), f("description.en", "textarea"), sources],
    tala: [...named, f("matra", "int"), f("bhaga", "int"), f("chanda", "ints"), f("ghata", "ints"), f("anaghata", "ints"), f("description.en", "textarea"), sources],
    person: [
      ...named,
      f("name.title.en", "text"),
      f("name.title.or", "text", { lang: "or" }),
      f("roles", "checks", { required: true, options: options(roles, "role", lang) }),
      f("instruments", "list"),
      f("birth_year", "int"),
      f("death_year", "int"),
      f("period", "text"),
      f("place.en", "text"),
      f("gurus", "links", { kind: "person" }),
      f("sampradaya", "text"),
      f("bio.en", "textarea"),
      f("website", "text"),
      sources,
    ],
    kabya: [...named, f("composer", "link", { kind: "person" }), f("form", "select", { options: props("kabya").form.enum.map((v) => ({ value: v, label: v })) }), f("period", "text"), f("parts", "int"), f("description.en", "textarea"), sources],
    rendition: [
      f("gita", "link", { kind: "gita", required: true }),
      f("kind", "select", { required: true, options: options(props("rendition").kind.enum, "rendition.kind", lang) }),
      f("credits", "credits", { required: true, options: options(creditRoles, "role", lang) }),
      f("raga", "links", { kind: "raga" }),
      f("tala", "links", { kind: "tala" }),
      f("stanzas", "ints"),
      f("date", "text"),
      f("held_on", "links", { kind: "carrier" }),
      f("pitch", "text"),
      f("duration", "text"),
      sources,
    ],
  };

  const kinds = Object.keys(forms);
  const spec = {
    forms,
    kinds: Object.fromEntries([...kinds, "carrier", "source"].map((k) => [k, t(`kind.${k}`, {}, lang)])),
    repo: REPO_URL,
    text: Object.fromEntries(
      ["add", "added", "remove", "none", "exists", "new", "unmatched", "role", "sent", "pasted", "attach", "empty", "missing", "rows", "search", "instrument", "stanza_hint", "list_hint", "ints_hint", "source", "source_url", "source_pages"].map((k) => [k, t(`enter.${k}`, {}, lang)])
    ),
  };
  const tabs = kinds.map((k, i) => `<option value="${k}"${i ? "" : " selected"}>${escapeHtml(t(`kind.${k}`, {}, lang))}</option>`).join("");

  const body = `<div class="page__wrap enter">
<header class="page__header">
<h1 class="page__title">${escapeHtml(t("enter.title", {}, lang))}</h1>
</header>
<div class="prose">
<p>${escapeHtml(t("enter.intro", {}, lang))}</p>
</div>
<form id="enter-form" class="enter__form" novalidate>
<label class="enter__label" for="enter-kind">${escapeHtml(t("enter.kind", {}, lang))}</label>
<select id="enter-kind">${tabs}</select>
<div id="enter-fields"></div>
<p id="enter-warning" class="enter__warning" role="status"></p>
<button type="submit" class="enter__button">${escapeHtml(t("enter.add", {}, lang))}</button>
</form>
<section class="enter__bulk" aria-labelledby="enter-bulk">
<h2 id="enter-bulk">${escapeHtml(t("enter.bulk", {}, lang))}</h2>
<p>${escapeHtml(t("enter.bulk_text", {}, lang))}</p>
<p><button type="button" id="enter-template" class="enter__button enter__button--quiet">${escapeHtml(t("enter.template", {}, lang))}</button></p>
<label class="enter__label" for="enter-csv">${escapeHtml(t("enter.csv", {}, lang))}</label>
<input type="file" id="enter-csv" accept=".csv,text/csv">
<div id="enter-unmatched"></div>
</section>
<section class="enter__list" aria-labelledby="enter-list">
<h2 id="enter-list">${escapeHtml(t("enter.list", {}, lang))}</h2>
<ul id="enter-entries" class="record-list"></ul>
<p><button type="button" id="enter-send" class="enter__button">${escapeHtml(t("enter.send", {}, lang))}</button>
<button type="button" id="enter-clear" class="enter__button enter__button--quiet">${escapeHtml(t("enter.clear", {}, lang))}</button></p>
<p id="enter-status" class="enter__status" role="status"></p>
</section>
</div>
<script type="application/json" id="enter-spec">${JSON.stringify(spec).replaceAll("<", "\\u003c")}</script>`;

  return pageShell({
    title: t("enter.title", {}, lang),
    body,
    lang,
    path: "/enter-data/",
    headMeta: '<meta name="robots" content="noindex">',
    pageScript: `<script src="/enter-data.js?v=${ctx.enterVersion}"></script>`,
  });
}
