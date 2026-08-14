# EducPAY — Phase 3B

## What is connected

- Supabase Auth handles identity, sessions, logout, recovery, and password changes.
- The existing login, recovery, reset, and first-login pages are reused.
- Public registration is disabled; no browser flow can assign a privileged role.
- Dashboard routes require an authenticated, active `SUPER_ADMIN` profile.
- `must_change_password` redirects the first session to `/auth/first-login`.
- `supabase/migrations/20260812000000_phase_3b_profiles_rls.sql` enables RLS,
  exposes only the signed-in user's profile, and prevents client-side changes
  to `role` and `is_active`.

## Supabase setup

1. Run the SQL migration above in the Supabase SQL editor.
2. Set the variables from `.env.example` locally.
3. Create the first account once:

   ```bash
   pnpm --filter @workspace/scripts run init-super-admin
   ```

   The command stops without creating anything if a `SUPER_ADMIN` profile
   already exists. It never prints the temporary password.
4. Sign in at `/auth/login` with the email and temporary password.
5. EducPAY redirects the account to `/auth/first-login`. After the password
   is changed, `must_change_password` is cleared and the Dashboard opens.

The service-role key is used only by the one-time server-side command. It must
never be placed in the frontend or in Vercel's client-side `VITE_*` variables.