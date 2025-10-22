import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load .env
dotenv.config();

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or ANON key is missing in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
