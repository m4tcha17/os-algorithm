/**
 * Turns the text of an uploaded .csv or .json file into raw rows.
 * Values are returned as strings and then go through the same
 * validation as manual entry (see lib/validate.ts).
 */
export interface RawProcessRow {
  pid: string;
  arrival: string;
  burst: string;
}

export type ParseResult =
  | { ok: true; rows: RawProcessRow[] }
  | { ok: false; error: string };

const CSV_HEADER = ["pid", "arrival", "burst"];

function parseCsv(text: string): ParseResult {
  // Ignore blank lines (e.g. a trailing newline at the end of the file).
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length === 0) {
    return { ok: false, error: "The CSV file is empty." };
  }

  // Header row is required and the column order is fixed.
  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase());
  if (header.join(",") !== CSV_HEADER.join(",")) {
    return { ok: false, error: 'CSV header must be exactly "pid,arrival,burst".' };
  }

  const rows: RawProcessRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((cell) => cell.trim());
    if (cells.length !== 3) {
      return { ok: false, error: `CSV line ${i + 1} must have 3 values (pid,arrival,burst).` };
    }
    rows.push({ pid: cells[0], arrival: cells[1], burst: cells[2] });
  }

  if (rows.length === 0) {
    return { ok: false, error: "The CSV file has a header but no processes." };
  }
  return { ok: true, rows };
}

// JSON values may be numbers or strings; anything else becomes "" so validation flags it.
function toText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function parseJson(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "The JSON file could not be read (invalid JSON)." };
  }

  if (!Array.isArray(data)) {
    return { ok: false, error: "The JSON file must contain an array of processes." };
  }
  if (data.length === 0) {
    return { ok: false, error: "The JSON array is empty." };
  }

  const rows: RawProcessRow[] = [];
  for (let i = 0; i < data.length; i++) {
    const item: unknown = data[i];
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: `JSON item ${i + 1} must be an object with pid, arrival, burst.` };
    }
    const record = item as Record<string, unknown>;
    rows.push({
      pid: toText(record.pid),
      arrival: toText(record.arrival),
      burst: toText(record.burst),
    });
  }
  return { ok: true, rows };
}

export function parseInputFile(fileName: string, text: string): ParseResult {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".csv")) {
    return parseCsv(text);
  }
  if (lowerName.endsWith(".json")) {
    return parseJson(text);
  }
  return { ok: false, error: "Only .csv and .json files are supported." };
}
