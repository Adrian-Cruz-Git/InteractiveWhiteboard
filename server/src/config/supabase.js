const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Loaded env vars:', {
  url: process.env.SUPABASE_URL,
  hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;



if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL. Check your .env file dont be a yuna");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Check your .env file dumbasses");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
