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

async function getJson(path) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return null; }
}

async function updateJson(path, body) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

// Get all APPROVED / ACTIVE applications
const apps = await getJson('/establishment_applications?select=id,responsible_user_id,establishment_id,status,responsible_account_status&status=eq.APPROVED&responsible_account_status=eq.ACTIVE');
const rows = apps || [];

console.log(`Syncing ${rows.length} approved director profiles...`);
for (const app of rows) {
  if (!app.responsible_user_id) continue;
  const result = await updateJson(`/profiles?id=eq.${app.responsible_user_id}`, {
    role: 'DIRECTOR',
    establishment_id: app.establishment_id,
    is_active: true,
    must_change_password: false,
  });
  console.log(`User ${app.responsible_user_id.substring(0, 8)}... : status=${result.status}`);
}

console.log('Sync complete. Verifying...');
const verifyApps = await getJson('/establishment_applications?select=id,responsible_user_id,establishment_id&status=eq.APPROVED&responsible_account_status=eq.ACTIVE&limit=5');
if (verifyApps && verifyApps.length) {
  const sample = verifyApps[0];
  const profiles = await getJson(`/profiles?id=eq.${sample.responsible_user_id}`);
  console.log(JSON.stringify({ sample, profiles }, null, 2));
}
