import { supabase } from "@/lib/supabase";
import { type Product, type StockEntry } from "@/types";

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  },

  createProduct: async (
    product: Omit<
      Product,
      "id" | "updated_at" | "current_stock" | "average_cost"
    >,
  ): Promise<Product> => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...product,
        current_stock: 0,
        average_cost: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProduct: async (
    id: string,
    updates: Partial<Product>,
  ): Promise<Product> => {
    const { data, error } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;
  },

  // Stock Entry Methods
  addStockEntry: async (
    entry: Omit<StockEntry, "id" | "created_at" | "total_cost">,
  ): Promise<StockEntry> => {
    // 1. Get current product state
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", entry.product_id)
      .single();

    if (fetchError || !product) throw new Error("Product not found");

    const totalCost = entry.quantity * entry.cost_price;

    // 2. Calculate new average cost
    const currentTotalValue =
      product.current_stock * (product.average_cost || 0);
    const newTotalValue = currentTotalValue + totalCost;
    const newStock = product.current_stock + entry.quantity;
    const newAverageCost =
      newStock > 0 ? newTotalValue / newStock : entry.cost_price;

    // 3. Update Product
    const { error: updateError } = await supabase
      .from("products")
      .update({
        current_stock: newStock,
        average_cost: newAverageCost,
        last_cost: entry.cost_price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entry.product_id);

    if (updateError) throw updateError;

    // 4. Create Entry Record
    const { data: newEntry, error: insertError } = await supabase
      .from("stock_entries")
      .insert({
        product_id: entry.product_id,
        quantity: entry.quantity,
        cost_price: entry.cost_price,
        total_cost: totalCost,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newEntry;
  },

  getStockEntries: async (): Promise<StockEntry[]> => {
    const { data, error } = await supabase
      .from("stock_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Helper for approval flow
  updateStockForStore: async (
    productId: string,
    storeId: string,
    newQuantity: number,
  ): Promise<void> => {
    console.log(`Updating stock for Product ${productId}, Store ${storeId}, Qty ${newQuantity}`);

    // 1. Update Inventory Level for specific store
    const { error: inventoryError } = await supabase
      .from("inventory_levels")
      .upsert(
        {
          product_id: productId,
          store_id: storeId,
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id,store_id" },
      );

    if (inventoryError) {
      console.error("Error updating inventory level:", inventoryError);
      throw inventoryError;
    }

    // 2. Calculate new total stock
    const { data: levels, error: sumError } = await supabase
      .from("inventory_levels")
      .select("quantity")
      .eq("product_id", productId);

    if (sumError) {
      console.error("Error calculating total stock:", sumError);
      throw sumError;
    }

    const totalStock = levels.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`New total stock for ${productId}: ${totalStock}`);

    // 3. Update Product Total Stock
    const { error: updateError } = await supabase
      .from("products")
      .update({
        current_stock: totalStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      console.error("Error updating product total:", updateError);
      throw updateError;
    }
  },
};
