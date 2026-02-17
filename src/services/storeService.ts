import { supabase } from "@/lib/supabase";
import type { Store } from "@/types";

export const storeService = {
    async getAll(): Promise<Store[]> {
        const { data, error } = await supabase
            .from("stores")
            .select("*")
            .order("name");

        if (error) {
            throw new Error(error.message);
        }

        return data;
    },

    async getById(id: string): Promise<Store | null> {
        const { data, error } = await supabase
            .from("stores")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    },
};
