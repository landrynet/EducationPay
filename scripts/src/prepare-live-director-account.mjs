import fs from 'fs';

const envFile = 'L:/EducationPay/.env';
const env = {};
for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx >= 0) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const ts = Date.now();
const email = `directeur.browser.${ts}@excellence.cd`;
const password = 'Directeur@2026PassSecure!';
const officialEmail = `contact.${ts}@excellence.cd`;
const schoolName = `Complexe Scolaire Excellence ${ts}`;

const apiServerUrl = env.API_SERVER_URL || 'http://127.0.0.1:3001';
const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing Supabase env values: SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
}

const registrationPayload = {
  officialName: schoolName,
  establishmentType: 'Privé',
  levels: ['PRIMARY', 'SECONDARY'],
  address: '12 Avenue de l’Avenir, Gombe',
  city: 'Kinshasa',
  province: 'Kinshasa',
  phone: '+243810000123',
  officialEmail,
  schoolYear: '2026-2027',
  principalFirstName: 'Patrice',
  principalLastName: 'Lumumba',
  principalEmail: email,
  principalPassword: password,
  principalPhone: '+243810000124',
  principalFunction: 'Directeur Général',
};

const regRes = await fetch(`${apiServerUrl}/api/establishment-applications`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registrationPayload),
});
const regData = await regRes.json();
if (regRes.status !== 201) {
  console.error(JSON.stringify({ stage: 'registration', status: regRes.status, data: regData }, null, 2));
  process.exit(1);
}

const superAdminEmail = env.SUPER_ADMIN_EMAIL || 'landkay2004@gmail.com';
const superAdminPassword = env.SUPER_ADMIN_TEMP_PASSWORD || 'Landry@2025kayoyo';

const saLoginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword }),
});
const saLoginData = await saLoginRes.json();
if (saLoginRes.status !== 200 || !saLoginData.access_token) {
  console.error(JSON.stringify({ stage: 'superAdminLogin', status: saLoginRes.status, data: saLoginData }, null, 2));
  process.exit(1);
}

const approveRes = await fetch(`${apiServerUrl}/api/establishment-applications/${regData.id}/approve`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${saLoginData.access_token}`,
  },
});
const approveData = await approveRes.json();
if (approveRes.status !== 200) {
  console.error(JSON.stringify({ stage: 'approve', status: approveRes.status, data: approveData }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  email,
  password,
  reference: regData.reference,
  applicationId: regData.id,
  status: approveData.status,
}, null, 2));
