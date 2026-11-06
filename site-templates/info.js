import { pageShell, escapeHtml, t } from "./shared.js";

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
<h2 id="ids">Ids and permanent links</h2>
<p>Every record has an id, such as <code>oa-gita-000001</code>. The id is a number with a short label for the kind of record. It says nothing else about the record, so it never has to change.</p>
${permanentLinks(config)}
<p>An id is never reused or given to another record. See <a href="/preservation/">preservation and persistence</a>.</p>
<h2 id="using-the-data">Using the data</h2>
<ul>
<li>Every record is a JSON file at <code>/api/&lt;kind&gt;/&lt;id&gt;.json</code>, such as <a href="/api/gita/oa-gita-000001.json">api/gita/oa-gita-000001.json</a>. Each kind has a full list at <code>/api/&lt;kind&gt;.json</code>.</li>
<li>Each kind is also a CSV file, such as <a href="/dumps/gita.csv">dumps/gita.csv</a>. All records are in one NDJSON file, <a href="/dumps/all.ndjson">dumps/all.ndjson</a>.</li>
<li>Every source is in <a href="/sources.bib">sources.bib</a>, in BibTeX.</li>
<li>The records, schemas and build are on <a href="${escapeHtml(config.REPO_URL)}">GitHub</a>.</li>
</ul>
<h2>Licence</h2>
<p>Records and text are under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> unless a record says otherwise. You can copy and share them if you credit the archive and share under the same licence.</p>
<h2>Contact</h2>
<p>To suggest a change, open an issue on <a href="${escapeHtml(config.REPO_URL)}/issues">GitHub</a> or write to O Foundation through <a href="https://theofdn.org/reach-out/">theofdn.org/reach-out</a>.</p>`;
  return shell("About the archive", "/about/", "What The Odissi Archive holds, how its ids work and how to use its data.", prose, lang);
}

export function preservation(ctx) {
  const { config, lang } = ctx;
  const prose = `<p>O Foundation keeps the records of The Odissi Archive and their ids available for the long term. This page says what we do to make that possible.</p>
<h2>Ids</h2>
<ul>
<li>An id, and the ARK built on it, is never reused or given to another record.</li>
<li>Ids are opaque. They hold a number and the kind of record, not a name or a date that could change.</li>
<li>Ids and ARKs are written in lower case.</li>
<li>When a record is withdrawn, its address stays. It shows a short page saying the record was withdrawn.</li>
<li>When two records turn out to be the same, one is kept and the other id is withdrawn in the same way.</li>
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
<p>O Foundation, based in Bhubaneswar, Odisha, publishes and hosts the archive. Prateek Pattanaik leads it and edits the records. If O Foundation can no longer host it, we'll move it to another host and point the permanent links there.</p>
<p>Contact O Foundation through <a href="https://theofdn.org/reach-out/">theofdn.org/reach-out</a>.</p>`;
  return shell("Preservation and persistence", "/preservation/", "How The Odissi Archive keeps its records and ids available for the long term.", prose, lang);
}
