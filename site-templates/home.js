import { escapeHtml, t, countLabel, pageShell } from "./shared.js";
import { SITE_NAME, KINDS } from "../scripts/lib/config.js";

export default function home(ctx) {
  const lang = ctx.lang;
  const items = KINDS.filter((k) => ctx.byKind[k].length)
    .map((k) => `<li><a href="/${k}/">${escapeHtml(t(`kind.${k}.plural`, {}, lang))}</a> <span class="count">${escapeHtml(countLabel(ctx.byKind[k].length, lang))}</span></li>`)
    .join("\n");
  const body = `<div class="page__wrap">
<header class="page__header">
<h1 class="page__title">${escapeHtml(SITE_NAME)}</h1>
<p class="page__lede">${escapeHtml(t("home.lede", {}, lang))}</p>
</header>
<h2>${escapeHtml(t("home.records", {}, lang))}</h2>
<ul class="record-list">
${items}
</ul>
</div>`;
  return pageShell({ body, lang, path: "/", description: t("home.lede", {}, lang) });
}
