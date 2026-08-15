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

async function adminUsers() {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
  });
  const data = await res.json();
  return data.users || [];
}

async function profilesFor(ids) {
  if (!ids.length) return [];
  const idList = ids.map((id) => `id.eq.${id}`).join('&');
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,role,establishment_id,is_active,must_change_password&${idList}`, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
  });
  return await res.json();
}

const users = await adminUsers();
const directorUsers = users.filter((u) => u.email && /directeur\.browser\.|directeur\.live\./.test(u.email));
console.log('DIRECTOR USERS', JSON.stringify(directorUsers.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at })), null, 2));
const profileRows = await profilesFor(directorUsers.map((u) => u.id));
console.log('PROFILE ROWS', JSON.stringify(profileRows, null, 2));
