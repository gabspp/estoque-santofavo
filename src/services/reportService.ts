import { supabase } from "@/lib/supabase";
import { type WeeklyReport, type WeeklyReportItem } from "@/types";
import { productService } from "./productService";

export const reportService = {
  getCurrentWeekData: async (): Promise<WeeklyReport> => {
    // 1. Find last closed report to determine start date
    const { data: lastReport } = await supabase
      .from("weekly_reports")
      .select("*")
      .order("end_date", { ascending: false })
      .limit(1)
      .single();

    // Default start date: 7 days ago if no report, else last report end date
    const startDate = lastReport
      ? lastReport.end_date
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString(); // Now

    // 2. Fetch all necessary data
    const products = await productService.getProducts();

    const { data: entries } = await supabase
      .from("stock_entries")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    // Find latest approved count in this period
    const { data: counts } = await supabase
      .from("stock_counts")
      .select("*, items:stock_count_items(*)")
      .eq("status", "approved")
      .gte("created_at", startDate)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestCount = counts && counts.length > 0 ? counts[0] : null;
    const workingEntries = entries || [];

    // 3. fetching initial stock from last report items if available
    let lastReportItems: any[] = [];
    if (lastReport) {
      const { data: items } = await supabase
        .from("weekly_report_items")
        .select("*")
        .eq("report_id", lastReport.id);
      if (items) lastReportItems = items;
    }

    // 4. Calculate items
    const reportItems: WeeklyReportItem[] = products.map((product) => {
      // Initial Stock
      const lastItem = lastReportItems.find((i) => i.product_id === product.id);
      const initialStock = lastItem ? lastItem.final_stock : 0;

      // Entries
      const productEntries = workingEntries.filter(
        (e) => e.product_id === product.id,
      );
      const entriesQty = productEntries.reduce((sum, e) => sum + e.quantity, 0);

      // Final Stock (from Count or Current System if no count)
      // Use count if available, otherwise fallback to current stock
      //Ideally we enforce a count before closing, but for display:
      const countedItem = latestCount?.items.find(
        (i: any) => i.product_id === product.id,
      );
      const finalStock = countedItem
        ? countedItem.quantity_counted
        : product.current_stock;

      // Consumption = Initial + Entries - Final
      // Ensure non-negative?
      // In reality, if Final > Initial + Entries, it means we gained stock (audit gain). Consumption would be negative.
      // Let's allow negative for audit purposes, or clamp to 0?
      // Usually consumption is positive. Negative consumption means "Gain".
      const consumptionQty = initialStock + entriesQty - finalStock;
      const consumptionValue = consumptionQty * (product.average_cost || 0);

      return {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        unit: product.unit,
        initial_stock: Number(initialStock.toFixed(3)),
        entries_quantity: Number(entriesQty.toFixed(3)),
        final_stock: Number(finalStock.toFixed(3)),
        consumption_quantity: Number(consumptionQty.toFixed(3)),
        consumption_value: Number(consumptionValue.toFixed(2)),
      };
    });

    const totalValue = reportItems.reduce(
      (sum, item) => sum + item.consumption_value,
      0,
    );

    return {
      id: "draft", // Placeholder
      start_date: startDate,
      end_date: endDate,
      status: "open",
      total_consumption_value: totalValue,
      items: reportItems,
      created_at: new Date().toISOString(),
    };
  },

  closeWeek: async (report: WeeklyReport): Promise<void> => {
    // 1. Create Report Header
    const { data: newReport, error: headerError } = await supabase
      .from("weekly_reports")
      .insert({
        start_date: report.start_date,
        end_date: report.end_date,
        total_consumption_value: report.total_consumption_value,
        status: "closed",
      })
      .select()
      .single();

    if (headerError) throw headerError;

    // 2. Create Report Items
    const itemsToInsert = report.items.map((item) => ({
      report_id: newReport.id,
      product_id: item.product_id,
      product_name: item.product_name,
      category: item.category,
      unit: item.unit,
      initial_stock: item.initial_stock,
      entries_quantity: item.entries_quantity,
      final_stock: item.final_stock,
      consumption_quantity: item.consumption_quantity,
      consumption_value: item.consumption_value,
    }));

    const { error: itemsError } = await supabase
      .from("weekly_report_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
  },

  getReports: async (): Promise<WeeklyReport[]> => {
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*") // We might want to fetch items too if needed for list display, but mostly header is enough
      .order("end_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
