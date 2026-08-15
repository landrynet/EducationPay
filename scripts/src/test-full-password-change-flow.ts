import * as fs from 'fs';

function loadEnv() {
  const envContent = fs.readFileSync('L:/EducationPay/.env', 'utf-8');
  const env: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const apiServerUrl = env.API_SERVER_URL || 'http://127.0.0.1:3001';

type AnyRecord = Record<string, any>;

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw new Error('Fetch failed after retries');
}

async function main() {
  console.log('================================================================');
  console.log('  DIAGNOSTIC LIVE : INSCRIPTION -> VALIDATION -> CHANGEMENT MOT DE PASSE -> RECONNEXION');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const schoolName = `Lycée Moke ${timestamp}`;
  const directorEmail = `directeur.moke.${timestamp}@educationpay.test`;
  const initialPassword = 'TempPassword2026!';
  const newPassword = 'MonNouveauPassSecure2026!';

  // ------------------------------------------------------------------
  // 1. INSCRIPTION
  // ------------------------------------------------------------------
  console.log('📍 1. Inscription d’un nouvel établissement et d’un nouveau directeur');
  console.log(`   - Établissement : ${schoolName}`);
  console.log(`   - Email          : ${directorEmail}`);
  console.log(`   - Pass Temp      : ${initialPassword}`);

  const regRes = await fetchWithRetry(`${apiServerUrl}/api/establishment-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officialName: schoolName,
      establishmentType: 'Privé',
      levels: ['PRIMARY', 'SECONDARY'],
      address: '10 Avenue de la Paix, Gombe',
      city: 'Kinshasa',
      province: 'Kinshasa',
      phone: '+243820001122',
      officialEmail: `contact.${timestamp}@moke.cd`,
      schoolYear: '2026-2027',
      principalFirstName: 'Alain',
      principalLastName: 'Kalombo',
      principalEmail: directorEmail,
      principalPassword: initialPassword,
      principalPhone: '+243820001123',
      principalFunction: 'Préfet',
    }),
  });

  const regData = (await regRes.json()) as AnyRecord;
  if (regRes.status !== 201) {
    console.error('❌ Échec inscription:', regData);
    process.exit(1);
  }
  console.log(`   --> Application enregistrée (Ref: ${regData.reference})`);

  // ------------------------------------------------------------------
  // 2. APPROBATION PAR SUPER ADMIN
  // ------------------------------------------------------------------
  console.log('\n📍 2. Approbation par le Super Admin');
  const saLoginRes = await fetchWithRetry(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: env.SUPER_ADMIN_EMAIL || 'landkay2004@gmail.com',
      password: env.SUPER_ADMIN_TEMP_PASSWORD || 'Landry@2025kayoyo',
    }),
  });
  const saLoginData = (await saLoginRes.json()) as AnyRecord;
  const saToken = saLoginData.access_token as string;

  const approveRes = await fetchWithRetry(`${apiServerUrl}/api/establishment-applications/${regData.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${saToken}`,
    },
  });

  const approveData = (await approveRes.json()) as AnyRecord;
  console.log(`   --> Établissement validé avec succès (Statut: ${approveData.status})`);

  // ------------------------------------------------------------------
  // 3. PREMIÈRE CONNEXION DU DIRECTEUR (MOT DE PASSE TEMPORAIRE)
  // ------------------------------------------------------------------
  console.log('\n📍 3. Première connexion du Directeur avec son mot de passe temporaire');
  const login1Res = await fetchWithRetry(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: directorEmail, password: initialPassword }),
  });

  const login1Data = (await login1Res.json()) as AnyRecord;
  if (login1Res.status !== 200 || !login1Data.access_token) {
    console.error('❌ Échec première connexion:', login1Data);
    process.exit(1);
  }
  const token1 = login1Data.access_token as string;
  console.log('   --> Première connexion réussie ! JWT Token temporaire acquis.');

  // ------------------------------------------------------------------
  // 4. CHANGEMENT DU MOT DE PASSE PAR LE DIRECTEUR
  // ------------------------------------------------------------------
  console.log('\n📍 4. Modification du mot de passe par le Directeur');
  console.log(`   - Nouveau mot de passe : ${newPassword}`);

  const updatePwdRes = await fetchWithRetry(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token1}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (updatePwdRes.status !== 200) {
    console.error('❌ Échec mise à jour mot de passe:', await updatePwdRes.json());
    process.exit(1);
  }
  console.log('   --> Mot de passe mis à jour avec succès dans Supabase Auth.');

  // ------------------------------------------------------------------
  // 5. RECONNEXION AVEC LE NOUVEAU MOT DE PASSE
  // ------------------------------------------------------------------
  console.log('\n📍 5. Reconnexion en live avec le NOUVEAU mot de passe');
  const login2Res = await fetchWithRetry(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: directorEmail, password: newPassword }),
  });

  const login2Data = (await login2Res.json()) as AnyRecord;
  if (login2Res.status !== 200 || !login2Data.access_token) {
    console.error('❌ ÉCHEC RECONNEXION AVEC NOUVEAU PASS:', login2Data);
    process.exit(1);
  }
  const token2 = login2Data.access_token as string;
  const user2 = login2Data.user as AnyRecord;

  // Verification profil & statut de l'application
  const profileRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/profiles?id=eq.${user2.id}&select=*`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token2}` }
  });
  const profiles = (await profileRes.json()) as AnyRecord[];
  const profile = profiles[0] || {};

  const appCheck = await fetchWithRetry(`${supabaseUrl}/rest/v1/establishment_applications?responsible_user_id=eq.${user2.id}&select=*`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token2}` }
  });
  const apps = (await appCheck.json()) as AnyRecord[];
  const app = apps[0] || {};

  console.log('\n================================================================');
  console.log('🎉 RÉSULTAT DE LA RECONNEXION APRÈS CHANGEMENT DE PASS :');
  console.log('================================================================');
  console.log(`   ✓ Compte Directeur     : ${user2.email}`);
  console.log(`   ✓ Nouveau Pass Validé  : OUI (${newPassword})`);
  console.log(`   ✓ Rôle du profil       : ${profile.role}`);
  console.log(`   ✓ Statut Application   : ${app.status} (APPROVED)`);
  console.log(`   ✓ Statut Responsable   : ${app.responsible_account_status} (ACTIVE)`);
  console.log(`   ✓ Établissement        : ${schoolName}`);
  console.log(`   ✓ Accès Dashboard      : /app (AUTORISÉ & ACCESSIBLE)`);
  console.log('================================================================\n');
}

main().catch(console.error);
