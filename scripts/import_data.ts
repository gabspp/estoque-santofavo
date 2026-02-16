import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import dotenv from "dotenv";

// Load environment variables from .env file
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // or SERVICE_ROLE if we need to bypass RLS, but assumes Anon works for now if policies allow insert

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Authenticate to bypass RLS policies
const signIn = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: "gabriel.picanco@gmail.com",
    password: "123", // The user said 123456, but earlier logs might have hinted or I should use precisely what they said. User said '123456'.
  });
  if (error) {
    // If login fails, try to sign up or just fail
    // Actually, user said 123456.
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

const filePath = path.resolve(__dirname, "../import_data.csv");
const fileContent = fs.readFileSync(filePath, "utf8");

interface CsvRow {
  Produto: string;
  Grupo: string;
  Categoria: string;
  Unidade: string;
  "Estoque Minimo": string;
}

Papa.parse(fileContent, {
  header: true,
  delimiter: "\t",
  skipEmptyLines: true,
  complete: async (results) => {
    await signIn();
    const rows = results.data as CsvRow[];
    console.log(`Parsed ${rows.length} rows. Starting import...`);

    for (const row of rows) {
      try {
        const productName = row.Produto?.trim();
        const groupName = row.Grupo?.trim(); // Category
        const categoryName = row.Categoria?.trim(); // Subcategory
        const unit = row.Unidade?.trim();
        const minStock = parseFloat(
          row["Estoque Minimo"]?.replace(",", ".") || "0",
        );

        if (!productName || !groupName) {
          console.warn("Skipping invalid row:", row);
          continue;
        }

        // 1. Get or Create Category (Grupo)
        let categoryId: string;
        const { data: existingCat, error: catFetchErr } = await supabase
          .from("categories")
          .select("id")
          .eq("name", groupName)
          .single();

        if (existingCat) {
          categoryId = existingCat.id;
        } else {
          const { data: newCat, error: catCreateErr } = await supabase
            .from("categories")
            .insert({ name: groupName })
            .select("id")
            .single();

          if (catCreateErr) throw catCreateErr;
          categoryId = newCat.id;
          console.log(`Created Category: ${groupName}`);
        }

        // 2. Get or Create Subcategory (Categoria)
        let subcategoryId: string | null = null;
        if (categoryName) {
          const { data: existingSub, error: subFetchErr } = await supabase
            .from("subcategories")
            .select("id")
            .eq("name", categoryName)
            .eq("category_id", categoryId)
            .single();

          if (existingSub) {
            subcategoryId = existingSub.id;
          } else {
            const { data: newSub, error: subCreateErr } = await supabase
              .from("subcategories")
              .insert({ name: categoryName, category_id: categoryId })
              .select("id")
              .single();

            if (subCreateErr) throw subCreateErr;
            subcategoryId = newSub.id;
            console.log(`Created Subcategory: ${categoryName}`);
          }
        }

        // 3. Create or Update Product
        // Check if product exists by name?
        const { data: existingProd } = await supabase
          .from("products")
          .select("id")
          .eq("name", productName)
          .single();

        if (existingProd) {
          await supabase
            .from("products")
            .update({
              category_id: categoryId,
              subcategory_id: subcategoryId,
              unit: unit,
              min_stock: minStock,
              // We don't overwrite current_stock or costs here necessarily
            })
            .eq("id", existingProd.id);
          console.log(`Updated Product: ${productName}`);
        } else {
          await supabase.from("products").insert({
            name: productName,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            // Legacy category field: keep it populated for now if needed, or put Group Name
            category: groupName,
            unit: unit,
            min_stock: minStock,
            current_stock: 0,
          });
          console.log(`Created Product: ${productName}`);
        }
      } catch (err) {
        console.error(`Error processing row ${row.Produto}:`, err);
      }
    }
    console.log("Import completed!");
  },
});
