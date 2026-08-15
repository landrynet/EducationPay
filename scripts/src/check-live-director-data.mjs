import fs from 'fs';

const raw = fs.readFileSync('L:/EducationPay/.env', 'utf8');
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx >= 0) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}
const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
async function rest(path) {
  const url = `${supabaseUrl}/rest/v1${path}`;
  const res = await fetch(url, { headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` } });
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}

const apps = await rest('/establishment_applications?select=id,reference,principal_email,responsible_user_id,status,responsible_account_status,establishment_id&order=created_at.desc&limit=20');
const profiles = await rest('/profiles?select=id,email,role,establishment_id,is_active,must_change_password&order=created_at.desc&limit=50');
console.log('APPLICATIONS');
console.log(JSON.stringify(apps, null, 2));
console.log('PROFILES');
console.log(JSON.stringify(profiles, null, 2));
