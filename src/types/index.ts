// export type Unit = 'UN' | 'KG' | 'LT' | 'CX' // Keeping as string for now if imported data has various units
export type Unit = string;

export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  category_id?: string; // UUID from categories table
  subcategory_id?: string; // UUID from subcategories table
  category: string; // Legacy or display name (e.g. "Mercearia") - kept for back-compat or quick display
  unit: Unit;
  min_stock: number;
  current_stock: number;
  last_cost?: number;
  average_cost?: number;
  updated_at: string;
  inventory?: { [storeId: string]: number };
  active_status?: { [storeId: string]: boolean };
}

export interface StockEntry {
  id: string;
  product_id: string;
  quantity: number;
  cost_price: number;
  total_cost: number;
  store_id?: string;
  created_at: string;
}

export type StockCountStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export interface StockCountItem {
  product_id: string;
  quantity_counted: number;
  quantity_system: number; // Snapshot of system stock at time of count
}

export interface Store {
  id: string;
  name: string;
  code: string;
}

export interface InventoryLevel {
  product_id: string;
  store_id: string;
  quantity: number;
  is_active?: boolean;
}

export interface StockCount {
  id: string;
  store_id?: string; // Optional for migration of old counts, but should be required for new ones
  date: string;
  status: StockCountStatus;
  items: StockCountItem[];
  completed_categories?: string[];
  created_at: string;
  updated_at: string;
}

export interface WeeklyReportItem {
  product_id: string;
  product_name: string;
  category: string;
  unit: string;
  initial_stock: number;
  entries_quantity: number; // Total purchased
  final_stock: number; // From physical count
  consumption_quantity: number; // (Initial + Entries) - Final
  consumption_value: number;
}

export interface WeeklyReport {
  id: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
  total_consumption_value: number;
  items: WeeklyReportItem[];
  created_at: string;
}
