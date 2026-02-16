import { supabase } from "@/lib/supabase";
import { type StockCount, type StockCountItem } from "@/types";
import { productService } from "./productService";

export const countingService = {
  getCounts: async (): Promise<StockCount[]> => {
    const { data, error } = await supabase
      .from("stock_counts")
      .select("*, items:stock_count_items(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getCountById: async (id: string): Promise<StockCount | undefined> => {
    const { data, error } = await supabase
      .from("stock_counts")
      .select("*, items:stock_count_items(*)")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  },

  createCount: async (): Promise<StockCount> => {
    // 1. Create the Count Header
    const { data: count, error: countError } = await supabase
      .from("stock_counts")
      .insert({
        date: new Date().toISOString(),
        status: "draft",
      })
      .select()
      .single();

    if (countError) throw countError;

    // 2. Fetch products to create items snapshot
    const products = await productService.getProducts();
    const itemsToInsert = products.map((p) => ({
      count_id: count.id,
      product_id: p.id,
      quantity_counted: 0,
      quantity_system: p.current_stock,
    }));

    // 3. Insert Items
    const { error: itemsError } = await supabase
      .from("stock_count_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // 4. Return complete object
    return {
      ...count,
      items: itemsToInsert.map((item) => ({
        product_id: item.product_id,
        quantity_counted: item.quantity_counted,
        quantity_system: item.quantity_system,
      })),
    };
  },

  updateCount: async (id: string, items: StockCountItem[]): Promise<void> => {
    // Upsert items (update quantity_counted)
    // Note: We need to map back to the DB structure (including count_id)
    const itemsToUpsert = items.map((item) => ({
      count_id: id,
      product_id: item.product_id,
      quantity_counted: item.quantity_counted,
      quantity_system: item.quantity_system, // Keep original snapshot or update? Usually snapshot stays.
    }));

    const { error } = await supabase
      .from("stock_count_items")
      .upsert(itemsToUpsert, { onConflict: "count_id,product_id" });

    if (error) throw error;

    // Update timestamp on parent
    await supabase
      .from("stock_counts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);
  },

  finalizeCount: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("stock_counts")
      .update({
        status: "pending_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  approveCount: async (id: string): Promise<void> => {
    // 1. Get the count with items
    const count = await countingService.getCountById(id);
    if (!count) throw new Error("Contagem não encontrada");

    // 2. Update actual stock for each item
    for (const item of count.items) {
      await productService.updateStockFromCount(
        item.product_id,
        item.quantity_counted,
      );
    }

    // 3. Update status
    const { error } = await supabase
      .from("stock_counts")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  rejectCount: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("stock_counts")
      .update({
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  reset: () => {
    // No-op for real service
  },
};
