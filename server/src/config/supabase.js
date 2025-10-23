const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;



if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL. Check your .env file dont be a yuna");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY. Check your .env file dumbasses");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;