import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('L:/EducationPay/.env', 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx >= 0) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
}

const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function callRpc(name, params) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function getJson(path) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Find approved applications with approved directors
const apps = await getJson('/establishment_applications?select=id,responsible_user_id,establishment_id,status,responsible_account_status&status=eq.APPROVED&responsible_account_status=eq.ACTIVE');
const rows = apps || [];

console.log(`Found ${rows.length} approved applications, attempting to activate profiles via RPC...`);

for (const app of rows) {
  if (!app.responsible_user_id) {
    console.log(`Skipping app ${app.id}: no responsible_user_id`);
    continue;
  }
  const result = await callRpc('activate_director_profile', {
    p_user_id: app.responsible_user_id,
    p_establishment_id: app.establishment_id,
  });
  console.log(`App ${app.id}: RPC call status ${result.status}`);
}

console.log('Done.');
