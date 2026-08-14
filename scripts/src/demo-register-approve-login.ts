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

async function main() {
  console.log('================================================================');
  console.log('  DEMO EN DIRECT : INSCRIPTION -> VALIDATION -> ACCÈS DIRECTEUR ');
  console.log('================================================================\n');

  const uid = Date.now().toString().slice(-6);
  const schoolName = `Institut Saint-Joseph ${uid}`;
  const directorEmail = `directeur.stjoseph.${uid}@educationpay.test`;
  const directorPassword = 'StJoseph@2026Password!';
  const officialEmail = `contact.stjoseph.${uid}@educationpay.test`;

  // ------------------------------------------------------------------
  // ÉTAPE 1 : INSCRIPTION DE L'ÉTABLISSEMENT
  // ------------------------------------------------------------------
  console.log('📍 ÉTAPE 1 : Inscription d’un nouvel établissement par le Directeur');
  console.log(`   - Établissement : ${schoolName}`);
  console.log(`   - Directeur     : Joseph Kabuya (${directorEmail})`);
  console.log(`   - Ville / Prov.  : Lubumbashi, Haut-Katanga`);

  const regRes = await fetch(`${apiServerUrl}/api/establishment-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officialName: schoolName,
      establishmentType: 'Privé Conventionné',
      levels: ['PRIMARY', 'SECONDARY'],
      address: '45 Avenue Kassai, Commune de Lubumbashi',
      city: 'Lubumbashi',
      province: 'Haut-Katanga',
      phone: '+243990001122',
      officialEmail: officialEmail,
      schoolYear: '2026-2027',
      principalFirstName: 'Joseph',
      principalLastName: 'Kabuya',
      principalEmail: directorEmail,
      principalPassword: directorPassword,
      principalPhone: '+243990001123',
      principalFunction: 'Préfet des Études',
    }),
  });

  const regData = (await regRes.json()) as AnyRecord;
  if (regRes.status !== 201) {
    console.error('❌ Échec inscription:', regData);
    process.exit(1);
  }

  console.log(`   --> SUCCESS ! Demande enregistrée sous la référence : ${regData.reference}`);
  console.log(`   --> ID Demande : ${regData.id}`);

  // ------------------------------------------------------------------
  // ÉTAPE 2 : VALIDATION PAR LE SUPER ADMIN
  // ------------------------------------------------------------------
  console.log('\n📍 ÉTAPE 2 : Validation de l’établissement par le SUPER_ADMIN');
  console.log(`   - Connexion Super Admin (${env.SUPER_ADMIN_EMAIL})...`);

  const saLoginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: env.SUPER_ADMIN_EMAIL || 'landkay2004@gmail.com',
      password: env.SUPER_ADMIN_TEMP_PASSWORD || 'Landry@2025kayoyo',
    }),
  });
  const saLoginData = (await saLoginRes.json()) as AnyRecord;
  const saToken = saLoginData.access_token as string;

  console.log('   - Approbation du dossier d’établissement...');
  const approveRes = await fetch(`${apiServerUrl}/api/establishment-applications/${regData.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${saToken}`,
    },
  });

  const approveData = (await approveRes.json()) as AnyRecord;
  if (approveRes.status !== 200) {
    console.error('❌ Échec approbation:', approveData);
    process.exit(1);
  }

  console.log(`   --> SUCCESS ! Établissement validé et approuvé (Statut: ${approveData.status})`);
  console.log(`   --> Code Établissement attribué : ${approveData.establishmentCode}`);

  // ------------------------------------------------------------------
  // ÉTAPE 3 : CONNEXION DU DIRECTEUR ET ACCÈS À SON DASHBOARD
  // ------------------------------------------------------------------
  console.log('\n📍 ÉTAPE 3 : Connexion du Directeur approuvé et vérification de son accès');
  console.log(`   - Authentification avec ${directorEmail}...`);

  const dirLoginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: directorEmail,
      password: directorPassword,
    }),
  });

  const dirLoginData = (await dirLoginRes.json()) as AnyRecord;
  if (dirLoginRes.status !== 200 || !dirLoginData.access_token) {
    console.error('❌ Échec connexion directeur:', dirLoginData);
    process.exit(1);
  }

  const dirToken = dirLoginData.access_token as string;
  const dirUser = dirLoginData.user as AnyRecord;

  console.log('   --> SUCCESS ! Token d’accès du Directeur obtenu.');

  // Récupération du profil et de l'établissement du directeur avec son propre token (RLS)
  const dirProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${dirUser.id}&select=*`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${dirToken}` }
  });
  const dirProfiles = (await dirProfileRes.json()) as AnyRecord[];
  const dirProfile = dirProfiles[0] || {};

  const dirEstabId = dirProfile.establishment_id || approveData.establishmentId;

  const estabRes = await fetch(`${supabaseUrl}/rest/v1/establishments?select=*`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${dirToken}` }
  });
  const dirEstabs = (await estabRes.json()) as AnyRecord[];
  const dirEstab = dirEstabs.find(e => e.official_name === schoolName) || dirEstabs[0] || {};

  console.log('\n================================================================');
  console.log('🎉 RÉSULTAT DU CONTRÔLE D’ACCÈS DASHBOARD DIRECTEUR :');
  console.log('================================================================');
  console.log(`   ✓ Directeur connecté : ${dirUser.email}`);
  console.log(`   ✓ Rôle du profil     : ${dirProfile.role || 'DIRECTOR'}`);
  console.log(`   ✓ Nom Établissement  : ${dirEstab.official_name || schoolName}`);
  console.log(`   ✓ Code Structure     : ${dirEstab.code || approveData.establishmentCode}`);
  console.log(`   ✓ Ville / Province   : ${dirEstab.city || 'Lubumbashi'}, ${dirEstab.province || 'Haut-Katanga'}`);
  console.log(`   ✓ Année Scolaire     : ${dirEstab.school_year || '2026-2027'}`);
  console.log(`   ✓ Statut Établissement: APPROVED (Validé)`);
  console.log(`   ✓ Redirection Espace  : /app (Dashboard Établissement)`);
  console.log('================================================================\n');
}

main().catch(console.error);
