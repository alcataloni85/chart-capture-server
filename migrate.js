require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SQL = `
  ALTER TABLE signals ADD COLUMN IF NOT EXISTS closed_at     TIMESTAMPTZ;
  ALTER TABLE signals ADD COLUMN IF NOT EXISTS closed_price  NUMERIC;
  ALTER TABLE signals ADD COLUMN IF NOT EXISTS pnl_percent   NUMERIC;
`;

(async () => {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/`,
    { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY } }
  );

  // Use pg endpoint via service role
  const r = await fetch(`${process.env.SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (r.ok) {
    console.log('✅ Migration done');
  } else {
    const text = await r.text();
    // Fallback: run each ALTER separately via rpc if available
    console.log('pg endpoint returned:', r.status, text);
    console.log('\n📋 Run this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log(SQL);
  }
})();
