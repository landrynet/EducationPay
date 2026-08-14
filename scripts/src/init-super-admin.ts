const supabaseUrl = required('SUPABASE_URL').replace(/\/+$/, '');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const email = required('SUPER_ADMIN_EMAIL').trim().toLowerCase();
const temporaryPassword = required('SUPER_ADMIN_TEMP_PASSWORD');

if (!email.includes('@')) {
  throw new Error('SUPER_ADMIN_EMAIL must be a valid email address.');
}

if (temporaryPassword.length < 12) {
  throw new Error('SUPER_ADMIN_TEMP_PASSWORD must contain at least 12 characters.');
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}.`);
  }

  return body ? JSON.parse(body) : null;
}

async function main(): Promise<void> {
  const existingProfiles = (await request(
    '/rest/v1/profiles?role=eq.SUPER_ADMIN&select=id&limit=1',
  )) as Array<{ id: string }>;

  if (existingProfiles.length > 0) {
    console.log('A SUPER_ADMIN profile already exists. No account was created.');
    return;
  }

  const createdUser = (await request('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    }),
  })) as { id?: string };

  const userId = createdUser.id;
  if (!userId) {
    throw new Error('Supabase did not return the new user id.');
  }

  try {
    await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        role: 'SUPER_ADMIN',
        must_change_password: true,
        is_active: true,
      }),
    });
  } catch {
    await request(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }).catch(() => undefined);
    throw new Error('The profile could not be created; the temporary Auth user was removed.');
  }

  console.log(`SUPER_ADMIN created for ${email}. First-login activation is required.`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Super Admin initialization failed.');
  process.exitCode = 1;
});

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set for this one-time server-side command.`);
  }
  return value;
}
