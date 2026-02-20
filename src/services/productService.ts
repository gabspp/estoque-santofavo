import { supabase } from "@/lib/supabase";
import { type Product, type StockEntry } from "@/types";

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    // 1. Fetch products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (productsError) throw productsError;

    // 2. Fetch inventory levels
    const { data: inventory, error: inventoryError } = await supabase
      .from("inventory_levels")
      .select("*");

    if (inventoryError) throw inventoryError;

    // 3. Map inventory to products
    const productsWithInventory = products.map((product) => {
      const productInventory = inventory.filter((i) => i.product_id === product.id);
      const inventoryMap: { [storeId: string]: number } = {};

      productInventory.forEach((item) => {
        inventoryMap[item.store_id] = item.quantity;
      });

      return {
        ...product,
        inventory: inventoryMap,
      };
    });

    return productsWithInventory || [];
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
    if (!entry.store_id) {
      throw new Error("Store ID is required for stock entry");
    }

    // 1. Get current product state
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", entry.product_id)
      .single();

    if (fetchError || !product) throw new Error("Product not found");

    const totalCost = entry.quantity * entry.cost_price;

    // 2. Calculate new average cost (Global/Consolidated)
    // Note: We update the global average cost even if entry is for a specific store
    const currentTotalValue =
      product.current_stock * (product.average_cost || 0);
    const newTotalValue = currentTotalValue + totalCost;
    const newStock = product.current_stock + entry.quantity;
    const newAverageCost =
      newStock > 0 ? newTotalValue / newStock : entry.cost_price;

    // 3. Update Product (Consolidated)
    // Note: detailed inventory update happens via inventory_levels, but we update total here too
    // Ideally this should be a trigger or careful transaction, but we'll do app-side for now
    const { error: updateError } = await supabase
      .from("products")
      .update({
        // current_stock will be updated by updateStockForStore via helper calculation, 
        // BUT we need to save the average cost.
        // Let's rely on updateStockForStore to set the final stock quantity to be safe.
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
        store_id: entry.store_id,
        quantity: entry.quantity,
        cost_price: entry.cost_price,
        total_cost: totalCost,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Update Specific Store Inventory
    // First get current quantity for that store
    const { data: currentLevel } = await supabase.from('inventory_levels')
      .select('quantity')
      .eq('product_id', entry.product_id)
      .eq('store_id', entry.store_id)
      .single();

    const currentStoreQty = currentLevel?.quantity || 0;
    const newStoreQty = currentStoreQty + entry.quantity;

    await productService.updateStockForStore(entry.product_id, entry.store_id, newStoreQty);

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
