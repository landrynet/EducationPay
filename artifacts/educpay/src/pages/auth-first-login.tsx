import { useState } from 'react';
import { Link } from 'wouter';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Field, FormMessage, PasswordStrength, SubmitButton, useSubmit } from '@/components/auth-form';
import { simulateSuccess } from '@/lib/local-auth';

export default function FirstLoginPage() {
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState(false);
  const { loading, onSubmit } = useSubmit(async () => { setError(''); if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) { setError('Choose a password that meets all three strength checks.'); return; } if (password !== confirmation) { setError('Passwords do not match.'); return; } const result = await simulateSuccess(); if (result.ok) setSuccess(true); });
  return <AuthLayout title="Make this account yours" description="You’re signing in for the first time. Set a private password before entering the workspace." step="First sign-in · Security check" footer={<span>Need to start over? <Link href="/auth/login" className="font-bold text-primary hover:underline" data-testid="link-login">Back to sign in</Link></span>}>
    {success ? <div className="space-y-5"><FormMessage kind="success">Your temporary password was replaced successfully.</FormMessage><Link href="/auth/login" className="flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground" data-testid="link-first-login-success">Continue to sign in</Link></div> :
      <form className="space-y-5" onSubmit={onSubmit} noValidate>{error && <FormMessage kind="error">{error}</FormMessage>}<div className="flex gap-3 rounded-xl bg-secondary/65 p-3.5"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><p className="text-xs leading-5 text-secondary-foreground">Choose something only you know. Avoid your school name, birthday, or a password you use elsewhere.</p></div><Field id="password" label="New password" type="password" value={password} onChange={setPassword} placeholder="Create a secure password" autoComplete="new-password" /><PasswordStrength password={password} /><Field id="confirmation" label="Confirm password" type="password" value={confirmation} onChange={setConfirmation} placeholder="Repeat your password" autoComplete="new-password" /><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Your password stays in this local simulation.</div><SubmitButton loading={loading}>Set password and continue</SubmitButton></form>}
  </AuthLayout>;
}