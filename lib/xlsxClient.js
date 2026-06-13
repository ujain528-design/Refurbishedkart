// Client-only .xlsx helpers — ExcelJS is dynamically imported so it never lands
// in any other bundle. Builds a per-category template (grouped headers, field
// names, example row, frozen panes, dropdowns via a hidden Lists sheet) and parses
// an uploaded workbook back into record objects.
import { getColumns, columnKeys, CATEGORY_EXAMPLES } from "@/lib/bulkTemplates";

const GROUP_FILL = "FFEDE7DD";   // warm light fill for ROW 1 group headers
const FIELD_FILL = "FFF5F2EC";   // lighter fill for ROW 2 field names
const DATA_ROWS = 300;           // rows to attach data-validation to

/* Resolve the dropdown value list for a column from the provided live sources. */
function listFor(col, sources) {
  if (col.dd === "list") return col.list || [];
  if (col.dd && sources[col.dd]) return sources[col.dd];
  return null;
}

/* Build the template workbook for a category and return a Blob.
   sources = { brand, ram, ssd, os, warranty, processor, condition, category } */
export async function buildTemplateBlob(category, sources = {}) {
  const ExcelJS = (await import("exceljs")).default;
  const cols = getColumns(category);
  const keys = columnKeys(category);

  const wb = new ExcelJS.Workbook();
  wb.creator = "RefurbishedKart";
  const ws = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 2 }] });
  const lists = wb.addWorksheet("Lists", { state: "hidden" });

  // ── Lists sheet: one column per dropdown column (simple, no dedupe). ──
  const ranges = {}; // col.key → "Lists!$A$1:$A$n"
  let listCol = 0;
  cols.forEach((col) => {
    const values = listFor(col, sources);
    if (!values || !values.length) return;
    listCol += 1;
    values.forEach((v, r) => { lists.getCell(r + 1, listCol).value = v; });
    const letter = lists.getColumn(listCol).letter;
    ranges[col.key] = `Lists!$${letter}$1:$${letter}$${values.length}`;
  });

  // ── ROW 1: merged group headers ──
  let i = 0;
  while (i < cols.length) {
    let j = i;
    while (j + 1 < cols.length && cols[j + 1].group === cols[i].group) j++;
    const cell = ws.getCell(1, i + 1);
    cell.value = cols[i].group;
    if (j > i) ws.mergeCells(1, i + 1, 1, j + 1);
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GROUP_FILL } };
    i = j + 1;
  }

  // ── ROW 2: field names ──
  keys.forEach((k, idx) => {
    const cell = ws.getCell(2, idx + 1);
    cell.value = k;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FIELD_FILL } };
    cell.alignment = { horizontal: "center", wrapText: true };
    ws.getColumn(idx + 1).width = Math.min(Math.max(k.length + 4, 12), 22);
  });

  // ── ROW 3: example row ──
  const example = (CATEGORY_EXAMPLES[category] || [])[0] || {};
  keys.forEach((k, idx) => {
    const v = example[k];
    if (v != null && v !== "") ws.getCell(3, idx + 1).value = v;
  });

  // ── Data validation dropdowns on rows 3..DATA_ROWS ──
  cols.forEach((col, idx) => {
    const range = ranges[col.key];
    if (!range) return;
    const strict = col.dd === "category"; // only category is hard-blocking
    const dv = {
      type: "list",
      allowBlank: true,
      formulae: [range],
      showErrorMessage: true,
      errorStyle: strict ? "stop" : "warning",
      errorTitle: strict ? "Invalid category" : "Not in list",
      error: strict
        ? "Pick one of the 5 categories — a bad category breaks the product."
        : "This value isn't in the suggested list. You can keep it — it'll be added as a new master value on import.",
    };
    for (let r = 3; r <= DATA_ROWS; r++) ws.getCell(r, idx + 1).dataValidation = { ...dv };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* Coerce an ExcelJS cell value to a plain scalar (string/number). */
function cellValue(v) {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("text" in v) return v.text;
    if ("result" in v) return v.result;
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("hyperlink" in v) return v.text || v.hyperlink;
    return String(v);
  }
  return v;
}

/* Parse an uploaded .xlsx ArrayBuffer: ROW 2 = headers, ROW 3+ = data.
   Returns { headers, records } where each record is keyed by header + __row. */
export async function parseWorkbook(arrayBuffer) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { headers: [], records: [] };

  const colCount = ws.actualColumnCount || ws.columnCount || 0;
  const headers = [];
  for (let cI = 1; cI <= colCount; cI++) {
    const h = String(cellValue(ws.getCell(2, cI).value)).trim();
    headers[cI] = h; // 1-based; "" for unnamed columns
  }

  const records = [];
  for (let rI = 3; rI <= ws.rowCount; rI++) {
    const rec = { __row: rI };
    let any = false;
    for (let cI = 1; cI <= colCount; cI++) {
      const key = headers[cI];
      if (!key) continue;
      const raw = cellValue(ws.getCell(rI, cI).value);
      const val = typeof raw === "string" ? raw.trim() : raw;
      if (val !== "" && val != null) any = true;
      rec[key] = val;
    }
    if (any) records.push(rec);
  }
  return { headers: headers.filter(Boolean), records };
}
