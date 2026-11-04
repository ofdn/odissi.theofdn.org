import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const DATA_DIR = process.env.DATA_DIR || join(ROOT, "data");
export const SCHEMA_DIR = process.env.SCHEMA_DIR || join(ROOT, "schema");
export const OUT_DIR = join(ROOT, "dist");
export const TEMPLATE_DIR = join(ROOT, "site-templates");

export const SITE_NAME = "The Odissi Archive";
export const SITE_URL = (process.env.SITE_URL || "https://odissi.theofdn.org/").replace(/\/?$/, "/");
// "/" on our own domain, "/odissi.theofdn.org/" on github.io
export const BASE_PATH = new URL(SITE_URL).pathname;
export const PUBLISHER = "O Foundation";
// editor of the archive on every record without its own editors
export const CURATOR = "Prateek Pattanaik";
export const PUBLISHER_PLACE = "Bhubaneswar";
export const LICENCE = "CC BY-SA 4.0";

export const ID_PREFIX = "oa";
export const KINDS = ["gita", "kabya", "rendition", "carrier", "person", "raga", "tala", "collection", "source"];
// sources are reached from each record and the footer, not the header
export const NAV_KINDS = ["gita", "raga", "tala", "kabya", "person", "rendition", "carrier", "collection"];
export const LANGS = ["en"];

// ark links stay off until the shoulder is assigned
export const ARK_NAAN = "15056";
export const ARK_SHOULDER = null;

export function arkUrl(id) {
  return ARK_SHOULDER ? `https://n2t.net/ark:/${ARK_NAAN}/${ARK_SHOULDER}${id}` : null;
}
