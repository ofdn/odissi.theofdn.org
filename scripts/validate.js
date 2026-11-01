#!/usr/bin/env node
// Checks every record against its kind's schema, then the rules a schema
// cannot hold: id matches the file, and every id a record mentions exists.
import { readFileSync } from "node:fs";
import { join, basename, relative, dirname } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { DATA_DIR, SCHEMA_DIR, KINDS } from "./lib/config.js";
import { loadRecords, jsonFiles, refs, kindOf, tombstones } from "./lib/records.js";

// unknown keywords still fail; "pattern" beside a $ref with no "type" is fine
const ajv = new Ajv2020({ allErrors: true, strictTypes: false });
addFormats(ajv);

// all schema files are added first so $ref between them resolves
const schemaIds = {};
for (const name of jsonFiles(SCHEMA_DIR)) {
  const schema = { $id: name, ...JSON.parse(readFileSync(join(SCHEMA_DIR, name), "utf8")) };
  ajv.addSchema(schema);
  schemaIds[name] = schema.$id;
}

const errors = [];
const entries = loadRecords(DATA_DIR);
const ids = new Set(entries.map((e) => e.record?.id));
const retired = new Set(tombstones(DATA_DIR));

for (const { kind, file, record, error } of entries) {
  const where = relative(dirname(DATA_DIR), file);
  if (error) {
    errors.push(`${where}: not valid JSON, ${error}`);
    continue;
  }
  const expected = basename(file, ".json");
  if (record.id !== expected) errors.push(`${where}#/id: is "${record.id}", the file name says "${expected}"`);
  if (kindOf(expected) !== kind) errors.push(`${where}: file name "${expected}" is not a ${kind} id`);
  if (retired.has(record.id)) errors.push(`${where}#/id: "${record.id}" is in tombstones.json`);

  const schemaId = schemaIds[`${kind}.schema.json`];
  if (!schemaId) {
    errors.push(`${where}: no schema/${kind}.schema.json`);
  } else {
    let validate;
    try {
      validate = ajv.getSchema(schemaId);
    } catch (e) {
      console.error(`schema/${kind}.schema.json: ${e.message}`);
      process.exit(1);
    }
    if (!validate(record)) {
      for (const err of validate.errors) {
        const extra = err.params?.additionalProperty ? ` ("${err.params.additionalProperty}")`
          : err.params?.unevaluatedProperty ? ` ("${err.params.unevaluatedProperty}")`
          : err.params?.allowedValues ? `: ${err.params.allowedValues.join(", ")}` : "";
        errors.push(`${where}#${err.instancePath}: ${err.message}${extra}`);
      }
    }
  }

  for (const ref of refs(record)) {
    const target = kindOf(ref.id);
    if (!KINDS.includes(target)) errors.push(`${where}#${ref.path}: "${ref.id}" names an unknown kind "${target}"`);
    else if (!ids.has(ref.id)) errors.push(`${where}#${ref.path}: no ${target} record "${ref.id}"`);
  }
}

if (errors.length) {
  console.error(`Validation failed, ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`Validation passed: ${entries.length} record(s).`);
