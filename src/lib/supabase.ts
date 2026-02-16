import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase credentials");
}

export const supabase = createClient(
  supabaseUrl || "https://pnpoyhwdjconuillhfcz.supabase.co",
  supabaseAnonKey ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucG95aHdkamNvbnVpbGxoZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTQyOTYsImV4cCI6MjA4NjY3MDI5Nn0.5SjXEnkOg3vBUmd-k5Ntl3WJEQvfxuMcIwvULJDaF74",
);
