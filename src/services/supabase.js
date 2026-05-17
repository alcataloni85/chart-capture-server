const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const BUCKET = 'charts';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  }

  return createClient(url, key, { realtime: { transport: ws } });
}

async function uploadToSupabase(buffer, fileName) {
  const supabase = getClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return data.publicUrl;
}

module.exports = { uploadToSupabase };
