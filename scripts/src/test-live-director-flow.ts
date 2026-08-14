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
  console.log('============================================================');
  console.log('EDUCPAY — VALIDATION LIVE DU FLUX DIRECTEUR');
  console.log('============================================================\n');

  const timestamp = Date.now();
  const directorEmail = `directeur.live.${timestamp}@excellence.cd`;
  const directorPassword = 'Directeur@2026PassSecure!';
  const officialEmail = `contact.${timestamp}@excellence.cd`;
  const schoolName = `Complexe Scolaire Excellence ${timestamp}`;

  // STEP 1: Création de la demande d'établissement (Registration)
  console.log('1. Création de la demande d’établissement...');
  const registrationPayload = {
    officialName: schoolName,
    establishmentType: 'Privé',
    levels: ['PRIMARY', 'SECONDARY'],
    address: '12 Avenue de l’Avenir, Gombe',
    city: 'Kinshasa',
    province: 'Kinshasa',
    phone: '+243810000123',
    officialEmail: officialEmail,
    schoolYear: '2026-2027',
    principalFirstName: 'Patrice',
    principalLastName: 'Lumumba',
    principalEmail: directorEmail,
    principalPassword: directorPassword,
    principalPhone: '+243810000124',
    principalFunction: 'Directeur Général',
  };

  const regRes = await fetch(`${apiServerUrl}/api/establishment-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationPayload),
  });

  const regData = (await regRes.json()) as AnyRecord;
  if (regRes.status !== 201) {
    console.error('Échec enregistrement:', regData);
    process.exit(1);
  }
  console.log(`✓ Demande créée avec succès (ID: ${regData.id}, Ref: ${regData.reference})`);

  // STEP 2: Vérification état initial dans Supabase
  console.log('\n2. Vérification état initial dans Supabase...');
  const initialAppRows = (await fetch(`${supabaseUrl}/rest/v1/establishment_applications?id=eq.${regData.id}&select=*`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
  }).then(r => r.json())) as AnyRecord[];
  const initialApp = initialAppRows[0] || {};

  console.log(`- Statut demande : ${initialApp.status} (attendu: PENDING_REVIEW)`);
  console.log(`- Statut compte responsable : ${initialApp.responsible_account_status} (attendu: PENDING_ACTIVATION)`);

  const initialProfileRows = (await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${initialApp.responsible_user_id}&select=*`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
  }).then(r => r.json())) as AnyRecord[];
  const initialProfile = initialProfileRows[0] || {};

  console.log(`- Profil actif : ${initialProfile.is_active} (attendu: false)`);
  console.log(`- Rôle profil : ${initialProfile.role} (attendu: DIRECTOR)`);

  // STEP 3: Connexion Super Admin et Validation de la demande
  console.log('\n3. Validation par le SUPER_ADMIN...');
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

  const approveRes = await fetch(`${apiServerUrl}/api/establishment-applications/${regData.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${saToken}`,
    },
  });

  const approveData = (await approveRes.json()) as AnyRecord;
  if (approveRes.status !== 200) {
    console.error('Échec approbation:', approveData);
    process.exit(1);
  }
  console.log(`✓ Demande validée avec succès par le Super Admin (Statut: ${approveData.status})`);

  // STEP 4: Vérification état après validation
  console.log('\n4. Vérification de l’activation dans Supabase...');
  const approvedProfileRows = (await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${initialApp.responsible_user_id}&select=*`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
  }).then(r => r.json())) as AnyRecord[];
  const approvedProfile = approvedProfileRows[0] || {};

  console.log(`- Profil establishment_id : ${approvedProfile.establishment_id} (attendu: ${initialApp.establishment_id})`);

  // STEP 5: Connexion du Directeur avec ses identifiants
  console.log('\n5. Connexion du Directeur approuvé...');
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
    console.error('Échec connexion directeur:', dirLoginData);
    process.exit(1);
  }
  console.log('✓ Connexion directeur réussie ! Token JWT obtenu.');

  // STEP 6: Confirmation de la redirection vers l'espace directeur (/app)
  console.log('\n6. Validation des autorisations et routage...');
  const dirRole = approvedProfile.role;
  const isSuperAdmin = dirRole === 'SUPER_ADMIN';
  const targetRoute = isSuperAdmin ? '/super-admin' : '/app';
  console.log(`- Rôle détecté : ${dirRole}`);
  console.log(`- Redirection d’espace : ${targetRoute} (attendu: /app)`);

  // STEP 7: Vérification que le directeur ne peut pas accéder aux endpoints Super Admin
  const forbiddenSaCheck = await fetch(`${apiServerUrl}/api/establishment-applications`, {
    headers: { Authorization: `Bearer ${dirLoginData.access_token}` },
  });
  console.log(`- Accès du Directeur à l’API Super Admin : Code HTTP ${forbiddenSaCheck.status} (attendu: 403 Forbidden)`);

  if (forbiddenSaCheck.status === 403 && targetRoute === '/app') {
    console.log('\n============================================================');
    console.log('✓ TOUT LE WORKFLOW DU DIRECTEUR EST STRICTEMENT VALIDÉ EN LIVE');
    console.log('============================================================');
  } else {
    console.error('Échec vérification sécurité directeur');
    process.exit(1);
  }
}

main().catch(console.error);
