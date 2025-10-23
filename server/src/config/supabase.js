import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config("../../.env");


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL. Check your .env file dont be a yuna");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY. Check your .env file dumbasses");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
