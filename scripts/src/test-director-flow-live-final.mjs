import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('L:/EducationPay/.env', 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx >= 0) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const ts = Date.now();
const email = `directeur.test.${ts}@excellence.cd`;
const password = 'Directeur@2026PassSecure!';
const api = env.API_SERVER_URL || 'http://127.0.0.1:3001';

const payload = {
  officialName: `Collège Test ${ts}`,
  establishmentType: 'Privé',
  levels: ['PRIMARY', 'SECONDARY'],
  address: '12 Avenue',
  city: 'Kinshasa',
  province: 'Kinshasa',
  phone: '+243810000123',
  officialEmail: `contact.${ts}@excellence.cd`,
  schoolYear: '2026-2027',
  principalFirstName: 'Jean',
  principalLastName: 'Dupont',
  principalEmail: email,
  principalPassword: password,
  principalPhone: '+243810000124',
  principalFunction: 'Directeur',
};

const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const saEmail = env.SUPER_ADMIN_EMAIL || 'landkay2004@gmail.com';
const saPass = env.SUPER_ADMIN_TEMP_PASSWORD || 'Landry@2025kayoyo';

async function main() {
  // Register
  const reg = await fetch(`${api}/api/establishment-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const regData = await reg.json();
  console.log('📝 Registration:', JSON.stringify(regData, null, 2));

  if (reg.status !== 201) {
    console.error('Registration failed');
    process.exit(1);
  }

  // Super Admin login
  const saLoginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: saEmail, password: saPass }),
  });
  const saLoginData = await saLoginRes.json();
  console.log(`🔑 Super Admin login: token=${saLoginData.access_token?.substring(0, 20)}...`);

  // Approve
  const approveRes = await fetch(`${api}/api/establishment-applications/${regData.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${saLoginData.access_token}`,
    },
  });
  const approveData = await approveRes.json();
  console.log('✅ Approval:', JSON.stringify(approveData, null, 2));

  // Verify director can login
  const dirLoginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const dirLoginData = await dirLoginRes.json();

  if (dirLoginRes.status === 200 && dirLoginData.access_token) {
    console.log(`🚀 Director login SUCCESS: ${email}`);
    console.log(`   Token: ${dirLoginData.access_token.substring(0, 20)}...`);
  } else {
    console.log(`❌ Director login FAILED: ${dirLoginRes.status}`);
    console.log(JSON.stringify(dirLoginData, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
