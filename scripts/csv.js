// RFC 4180 writer from the Registry of Type Design

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const str = Array.isArray(value)
    ? value.every((v) => typeof v !== "object") ? value.join("; ") : JSON.stringify(value)
    : typeof value === "object"
    ? JSON.stringify(value)
    : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

// { title: { en, or } } becomes "title.en" and "title.or" columns
export function flatten(value, prefix = "", out = {}) {
  for (const [key, v] of Object.entries(value)) {
    const col = prefix + key;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, `${col}.`, out);
    else out[col] = v;
  }
  return out;
}

export function toCsv(rows, columns) {
  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns.map((col) => csvCell(row[col])).join(",")
  );
  return [header, ...lines].join("\n") + "\n";
}
