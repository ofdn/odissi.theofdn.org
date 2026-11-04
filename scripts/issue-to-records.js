#!/usr/bin/env node
// Turns an issue from /enter-data/ into pull requests, one per record, or one per group
// of new records that link to each other. Run by .github/workflows/enter-data.yml.
// Ids stay new-* until the merge; the deploy gives them numbers (mint-new.js).
// The issue body is untrusted: it only ever reaches git and gh as arguments, never a shell.
import { cpSync, mkdtempSync, writeFileSync, appendFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DATA_DIR, ROOT } from "./lib/config.js";
import { NEW_ID } from "./lib/records.js";

const KINDS = ["raga", "tala", "person", "kabya", "gita", "rendition"];
const issue = process.env.ISSUE_NUMBER;
const enteredBy = process.env.ISSUE_AUTHOR_NAME || `@${process.env.ISSUE_AUTHOR}`;
const today = new Date().toISOString().slice(0, 10);

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<END_${issue}_${key}\n${value}\nEND_${issue}_${key}\n`);
  else console.log(`${key}: ${value}`);
}

function fail(message) {
  output("error", message);
  process.exit(1);
}

// the page puts the entries in a json block, or in an attached .txt file when they are too long
async function entries(body) {
  const block = body.match(/```json\s*\n([\s\S]*?)\n```/);
  if (block) return JSON.parse(block[1]);
  const file = body.match(/https:\/\/github\.com\/(?:user-attachments\/files|[\w.-]+\/[\w.-]+\/files)\/[^\s)]+\.txt/);
  if (!file) fail("No entries found. Submit them from the enter data page, or attach the .txt file it saves.");
  const res = await fetch(file[0], { headers: { Authorization: `token ${process.env.GH_TOKEN}` } });
  if (!res.ok) fail(`Could not open the attached file (${res.status}).`);
  return JSON.parse(await res.text());
}

let payload;
try {
  payload = await entries(process.env.ISSUE_BODY ?? "");
} catch (e) {
  fail(`The entries are not valid JSON: ${e.message}`);
}
const list = payload?.records;
if (!Array.isArray(list) || !list.length) fail("The entries hold no records.");

// new-gita-1 becomes new-gita-i12-1, so two issues never share a name
const rename = new Map(list.map((e) => [e.record?.id, String(e.record?.id).replace(/^new-([a-z]+)-/, `new-$1-i${issue}-`)]));
function swap(v) {
  if (typeof v === "string") return rename.get(v) ?? v;
  if (Array.isArray(v)) return v.map(swap);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
  return v;
}

const records = list.map((e, i) => {
  if (!KINDS.includes(e.kind)) fail(`Entry ${i + 1}: "${e.kind}" is not a kind the form adds.`);
  if (!NEW_ID.test(e.record?.id ?? "") || !e.record.id.startsWith(`new-${e.kind}-`)) fail(`Entry ${i + 1}: the id should be new-${e.kind}-<number>.`);
  const record = swap(e.record);
  return { kind: e.kind, record: { ...record, record_status: "active", superseded_by: null, created_at: today, updated_at: today, entered_by: [enteredBy] } };
});

// records that link to each other go in one pull request
const group = new Map(records.map((r) => [r.record.id, r.record.id]));
const root = (id) => (group.get(id) === id ? id : root(group.get(id)));
for (const { record } of records) {
  for (const id of JSON.stringify(record).match(/new-[a-z]+-i\d+-[0-9a-z-]+/g) ?? []) {
    if (group.has(id)) group.set(root(id), root(record.id));
  }
}
const groups = new Map();
for (const r of records) groups.set(root(r.record.id), [...(groups.get(root(r.record.id)) ?? []), r]);

// a rendition has no name of its own; it goes by its gīta
function label({ kind, record }) {
  if (record.name?.en) return record.name.en;
  const gita = records.find((r) => r.record.id === record.gita)?.record ?? (existsSync(join(DATA_DIR, "gita", `${record.gita}.json`)) && JSON.parse(readFileSync(join(DATA_DIR, "gita", `${record.gita}.json`), "utf8")));
  return gita?.name?.en ? `${gita.name.en} (${kind})` : record.id;
}

const git = (...args) => execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();
const urls = [];
const problems = [];
let n = 0;
for (const members of groups.values()) {
  n += 1;
  const write = (dir) => members.forEach(({ kind, record }) => writeFileSync(join(dir, kind, `${record.id}.json`), JSON.stringify(record, null, 2) + "\n"));
  const names = members.map((m) => `${m.kind} "${label(m)}"`).join(", ");

  // check on a copy with real ids, as the deploy will
  const copy = mkdtempSync(join(tmpdir(), "entries-"));
  cpSync(DATA_DIR, copy, { recursive: true });
  write(copy);
  try {
    execFileSync("node", [join(ROOT, "scripts/mint-new.js"), copy], { stdio: "pipe" });
    execFileSync("node", [join(ROOT, "scripts/validate.js")], { env: { ...process.env, DATA_DIR: copy }, stdio: "pipe" });
  } catch (e) {
    const report = (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? "");
    problems.push(`${names}:\n${report.replace(/\S*entries-\w+\//g, "")}`.trim());
    continue;
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }

  const first = label(members[0]);
  const branch = `entries-${issue}-${n}`;
  git("checkout", "-q", "-B", branch, "origin/main");
  write(DATA_DIR);
  git("add", "data");
  git("commit", "-q", "-m", `add ${first}${members.length > 1 ? ` and ${members.length - 1} more` : ""}`);
  git("push", "-q", "-f", "origin", branch);
  const body = `From #${issue}, entered by ${enteredBy}.\n\n${members.map((m) => `- ${m.kind}: ${label(m)}`).join("\n")}\n\nThe ids are given when this is merged.`;
  urls.push(execFileSync("gh", ["pr", "create", "--base", "main", "--head", branch, "--title", `Add ${first}`, "--body", body], { cwd: ROOT }).toString().trim());
  git("checkout", "-q", "main");
}

output("prs", urls.join("\n"));
output("problems", problems.join("\n\n"));
