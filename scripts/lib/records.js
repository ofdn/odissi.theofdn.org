import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ID_PREFIX, KINDS, DATA_DIR } from "./config.js";

export const ID_PATTERN = new RegExp(`^${ID_PREFIX}-([a-z]+)-(\\d{6})$`);

export function kindOf(id) {
  return ID_PATTERN.exec(id)?.[1];
}

export function jsonFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
}

// Every record file as { kind, file, record } or { kind, file, error }.
export function loadRecords(dataDir = DATA_DIR) {
  const out = [];
  for (const kind of KINDS) {
    for (const name of jsonFiles(join(dataDir, kind))) {
      const file = join(dataDir, kind, name);
      try {
        out.push({ kind, file, record: JSON.parse(readFileSync(file, "utf8")) });
      } catch (e) {
        out.push({ kind, file, error: e.message });
      }
    }
  }
  return out;
}

export function tombstones(dataDir = DATA_DIR) {
  const file = join(dataDir, "tombstones.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
}

function pointerPart(key) {
  return String(key).replaceAll("~", "~0").replaceAll("/", "~1");
}

// Yields { id, path } for every string that looks like a record id, path as a JSON pointer.
export function* refs(value, path = "") {
  if (typeof value === "string") {
    if (ID_PATTERN.test(value)) yield { id: value, path };
  } else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (path === "" && key === "id") continue;
      yield* refs(v, `${path}/${pointerPart(key)}`);
    }
  }
}

// Maintainer-only fields never reach a page, the API or a dump.
export function publicCopy(value) {
  if (Array.isArray(value)) return value.map(publicCopy);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.startsWith("_") && key !== "verification_status")
      .map(([key, v]) => [key, publicCopy(v)])
  );
}
