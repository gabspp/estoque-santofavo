import { supabase } from "@/lib/supabase";
import { type Category, type Subcategory } from "@/types";

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  getSubcategories: async (categoryId: string): Promise<Subcategory[]> => {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*") // 'id, name, category_id'
      .eq("category_id", categoryId)
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Helper to get all subcategories if needed, but usually filtered by category
  getAllSubcategories: async (): Promise<Subcategory[]> => {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },
};
