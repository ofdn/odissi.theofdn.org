import { pageShell, escapeHtml, t } from "./shared.js";

// privacy text from theofdn.org's policies page and Archiving the Present's PRIVACY.md

const DOI = "10.5281/zenodo.23938196";

function permanentLinks(config) {
  if (!config.ARK_ON) {
    return `<p>Each record will also get an ARK (Archival Resource Key). This is a permanent link that keeps working if the archive moves to another address. The links will show on every page once they are registered.</p>`;
  }
  const ark = config.arkName("oa-gita-000001");
  return `<p>Each record also has an ARK (Archival Resource Key), such as <code>${escapeHtml(ark)}</code>. It opens through <a href="https://n2t.net/${escapeHtml(ark)}">n2t.net/${escapeHtml(ark)}</a>. ARKs keep working if the archive moves to another address.</p>`;
}

function shell(title, path, description, prose, lang) {
  const body = `<div class="page__wrap">
<header class="page__header">
<h1 class="page__title">${escapeHtml(title)}</h1>
</header>
<div class="prose">
${prose}
</div>
</div>`;
  return pageShell({ title, description, body, lang, path });
}

export function about(ctx) {
  const { byKind, config, lang } = ctx;
  const counts = config.NAV_KINDS.filter((k) => byKind[k]?.length)
    .map((k) => `<li><a href="/${k}/">${escapeHtml(t(`kind.${k}.plural`, {}, lang))}</a>: ${byKind[k].length.toLocaleString("en-IN")}</li>`)
    .join("\n");
  const prose = `<p>The Odissi Archive is an archive of Odissi music. It holds gītas, the kābyas they come from, their renditions, the discs and manuscripts that carry them, and the people, rāgas and tāḷas behind them.</p>
<p>Prateek Pattanaik leads the archive and edits every record. It builds on his earlier work, including his site <a href="https://odissimusic.co.in/">Odissi Music</a>. O Foundation publishes it. A gīta or kābya is cited to its poet.</p>
<h2 id="records">What it holds</h2>
<ul>
${counts}
</ul>
<h2 id="ids">IDs and permanent links</h2>
<p>Every record has an ID, such as <code>oa-gita-000001</code>. The ID is a number with a short label for the kind of record. It says nothing else about the record, so it never has to change.</p>
${permanentLinks(config)}
<p>An ID is never reused or given to another record. See <a href="/preservation/">preservation and persistence</a>.</p>
<h2 id="using-the-data">Using the data</h2>
<ul>
<li>Every record is a JSON file at <code>/api/&lt;kind&gt;/&lt;id&gt;.json</code>, such as <a href="/api/gita/oa-gita-000001.json">api/gita/oa-gita-000001.json</a>. Each kind has a full list at <code>/api/&lt;kind&gt;.json</code>.</li>
<li>Each kind is also a CSV file, such as <a href="/dumps/gita.csv">dumps/gita.csv</a>. All records are in one NDJSON file, <a href="/dumps/all.ndjson">dumps/all.ndjson</a>.</li>
<li>Every source is in <a href="/sources.bib">sources.bib</a>, in BibTeX.</li>
<li>The records, schemas and build are on <a href="${escapeHtml(config.REPO_URL)}">GitHub</a>.</li>
</ul>
<h2>Licence</h2>
<p>Records and text are under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> unless a record says otherwise. You can copy and share them if you credit the archive and share under the same licence.</p>
<h2 id="privacy">Privacy</h2>
<p>This site has no accounts, comments, analytics or advertising. It sets no cookies.</p>
<ul>
<li><strong>Theme.</strong> If you switch between light and dark mode, your browser remembers the choice. It stays on your device.</li>
<li><strong>Enter data.</strong> Records you add on <a href="/enter-data/">Enter data</a> are kept in your browser until you send or clear them.</li>
<li><strong>Sending records.</strong> Sending records opens an issue on GitHub under your own account. The issue is public. Your GitHub name is saved with the records as the person who entered them, and it shows in the data files. It's never cited as an author.</li>
<li><strong>Hosting.</strong> GitHub Pages hosts the site and Cloudflare serves it. Both may log your IP address for security. See the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub Privacy Statement</a> and the <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare privacy policy</a>.</li>
<li><strong>Fonts.</strong> The site loads fonts from Google Fonts, so your browser sends Google a request for them. See the <a href="https://developers.google.com/fonts/faq/privacy">Google Fonts privacy FAQ</a>.</li>
<li><strong>Embedded media.</strong> Some rendition pages play recordings from YouTube, through youtube-nocookie.com, or from the Internet Archive. The player loads from that service, which may collect data about you as if you visited its site.</li>
</ul>
<p>Records about people hold their names, birth and death years and gender where known, a short biography, their gurus and śiṣyas, and the works they made or performed. These details come from published sources. If a record is about you or a family member, you can ask us to correct or remove details. If a whole record is removed, its ID is withdrawn and never reused.</p>
<h2>Contact</h2>
<p>To suggest a change or ask about your data, open an issue on <a href="${escapeHtml(config.REPO_URL)}/issues">GitHub</a> or write to O Foundation through <a href="https://theofdn.org/reach-out/">theofdn.org/reach-out</a>.</p>`;
  return shell("About the archive", "/about/", "What The Odissi Archive holds, how its IDs work, how to use its data and how it handles privacy.", prose, lang);
}

export function preservation(ctx) {
  const { config, lang } = ctx;
  const prose = `<p>O Foundation keeps the records of The Odissi Archive and their IDs available for the long term. This page says what we do to make that possible.</p>
<h2>IDs</h2>
<ul>
<li>An ID, and the ARK built on it, is never reused or given to another record.</li>
<li>IDs are opaque. They hold a number and the kind of record, not a name or a date that could change.</li>
<li>IDs and ARKs are written in lower case.</li>
<li>When a record is withdrawn, its address stays. It shows a short page saying the record was withdrawn.</li>
<li>When two records turn out to be the same, one is kept and the other ID is withdrawn in the same way.</li>
</ul>
<h2>Copies of the data</h2>
<ul>
<li>Every record is a JSON file in a public <a href="${escapeHtml(config.REPO_URL)}">Git repository</a>. Its full history of changes is public, and every copy of the repository holds all of it.</li>
<li>Each release of the archive is deposited on <a href="https://doi.org/${DOI}">Zenodo</a>, which CERN runs. The DOI <code>${DOI}</code> always points to the latest release.</li>
<li>The whole archive can be downloaded as JSON, CSV and NDJSON. See <a href="/about/#using-the-data">using the data</a>.</li>
<li>We're adding links to Wayback Machine copies of the web pages that records cite, next to each link.</li>
</ul>
<h2>Licence</h2>
<p>Records are under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Anyone may keep and share a copy, so the archive does not depend on one server.</p>
<h2>Who is responsible</h2>
<p>O Foundation, based in Bhubaneswar, Odisha, publishes and hosts the archive. Prateek Pattanaik leads it and edits the records. If this site's URL changes, the ARK IDs will continue to resolve to the existing entries.</p>
<p>Contact O Foundation through <a href="https://theofdn.org/reach-out/">theofdn.org/reach-out</a>.</p>`;
  return shell("Preservation and persistence", "/preservation/", "How The Odissi Archive keeps its records and IDs available for the long term.", prose, lang);
}
