const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL, // Supabase URL
  process.env.SUPABASE_KEY // Service role key
);

module.exports = supabase;
// make sure to !!!! put the god damn
// SUPABASE_URL and SUPABASE_KEY are 
// in the env files bruh