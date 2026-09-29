import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.resolve(__dirname, "../Downloads/Controle 2026.xlsm");

console.log("Reading Excel file at:", excelPath);
const workbook = XLSX.readFile(excelPath);

console.log("Sheets found in workbook:", workbook.SheetNames);

const sheetName = "Master Estoque";
if (!workbook.SheetNames.includes(sheetName)) {
  console.error(`Sheet '${sheetName}' not found!`);
  process.exit(1);
}

const sheet = workbook.Sheets[sheetName];
// Convert to JSON
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log(`Parsed ${rows.length} rows from sheet '${sheetName}'.`);
if (rows.length > 0) {
  console.log("Headers (Keys of first row):", Object.keys(rows[0]));
  console.log("First 5 rows:");
  console.log(JSON.stringify(rows.slice(0, 5), null, 2));
} else {
  console.warn("Sheet is empty!");
}
