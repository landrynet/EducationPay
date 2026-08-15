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

async function getJson(path, init = {}) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

const apps = await getJson('/establishment_applications?select=id,responsible_user_id,establishment_id,status,responsible_account_status&status=eq.APPROVED&responsible_account_status=eq.ACTIVE');
const rows = apps.data || [];
for (const app of rows) {
  if (!app.responsible_user_id) continue;
  const patch = await getJson(`/profiles?id=eq.${app.responsible_user_id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      role: 'DIRECTOR',
      establishment_id: app.establishment_id,
      is_active: true,
      must_change_password: false,
      updated_at: new Date().toISOString(),
    }),
  });
  console.log(JSON.stringify({ appId: app.id, responsibleUserId: app.responsible_user_id, patch }, null, 2));
}
