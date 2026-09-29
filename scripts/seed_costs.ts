import { createClient } from "@supabase/supabase-js";
import path from "path";
import XLSX from "xlsx";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Authenticate to bypass RLS policies
const signIn = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: "gabriel.picanco@gmail.com",
    password: "123",
  });
  if (error) {
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: "gabriel.picanco@gmail.com",
      password: "123456",
    });
    if (loginError) {
      console.error("Authentication failed:", loginError);
      process.exit(1);
    }
  }
  console.log("Authenticated successfully.");
};

const runSeed = async () => {
  await signIn();

  const excelPath = path.resolve(__dirname, "../Downloads/Controle 2026.xlsm");
  console.log("Reading Excel file at:", excelPath);
  
  const workbook = XLSX.readFile(excelPath);
  const sheetName = "Master Estoque";
  
  if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`Sheet '${sheetName}' not found in workbook!`);
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  // Parse sheet as array of arrays to be fully robust to row formats
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  console.log(`Loaded ${rows.length} rows from sheet '${sheetName}'.`);

  // Find the header row that contains "Cod" and "Valor Unitário"
  let colCodIndex = -1;
  let colCostIndex = -1;
  let headerRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    const codIdx = row.findIndex(cell => 
      cell && typeof cell === "string" && ["cod", "cód", "código", "codigo"].includes(cell.trim().toLowerCase())
    );
    const costIdx = row.findIndex(cell => 
      cell && typeof cell === "string" && ["valor unitário", "valor unitario", "preço unitário", "preco unitario", "custo", "last_cost"].includes(cell.trim().toLowerCase())
    );

    if (codIdx !== -1 && costIdx !== -1) {
      colCodIndex = codIdx;
      colCostIndex = costIdx;
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.error("Could not find headers for 'Cod' and 'Valor Unitário' in any row.");
    process.exit(1);
  }

  console.log(`Found headers at row ${headerRowIndex}:`);
  console.log(`- Column for Code: index ${colCodIndex} (${rows[headerRowIndex][colCodIndex]})`);
  console.log(`- Column for Cost: index ${colCostIndex} (${rows[headerRowIndex][colCostIndex]})`);

  let successCount = 0;
  let errorCount = 0;

  // Process rows after the header row
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rawCode = row[colCodIndex];
    const rawCost = row[colCostIndex];

    if (rawCode === undefined || rawCode === null || rawCode === "" || rawCost === undefined || rawCost === null || rawCost === "") {
      continue;
    }

    const codeVal = parseInt(String(rawCode).trim(), 10);
    if (isNaN(codeVal)) {
      continue;
    }

    // Clean cost value (remove R$, replace comma with dot, parseFloat)
    const cleanCostStr = String(rawCost)
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(",", ".");
    
    const costVal = parseFloat(cleanCostStr);
    if (isNaN(costVal)) {
      console.warn(`[WARN] Invalid cost '${rawCost}' for product code ${codeVal}, skipping.`);
      continue;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .update({ last_cost: costVal, updated_at: new Date().toISOString() })
        .eq("code", codeVal)
        .select("name");

      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log(`[OK] Updated code ${codeVal} (${data[0].name}) with last_cost = R$ ${costVal.toFixed(4)}`);
        successCount++;
      } else {
        // Log but don't count as failure, could just be a product not present in database
        console.warn(`[WARN] Product with code ${codeVal} (${row[colCodIndex - 1] || 'Unknown'}) not found in database.`);
        errorCount++;
      }
    } catch (err) {
      console.error(`[ERROR] Failed to update code ${codeVal}:`, err);
      errorCount++;
    }
  }

  console.log(`\nSeed completed successfully from Excel:`);
  console.log(`- ${successCount} products updated in database.`);
  console.log(`- ${errorCount} products skipped or not found in database.`);
  process.exit(0);
};

runSeed();
