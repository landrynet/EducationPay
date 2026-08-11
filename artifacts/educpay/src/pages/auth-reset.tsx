import { useState } from 'react';
import { Link } from 'wouter';
import { AuthLayout } from '@/components/auth-layout';
import { Field, FormMessage, PasswordStrength, SubmitButton, useSubmit } from '@/components/auth-form';
import { simulateSuccess } from '@/lib/local-auth';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState(false);
  const { loading, onSubmit } = useSubmit(async () => { setError(''); if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) { setError('Choose a password that meets all three strength checks.'); return; } if (password !== confirmation) { setError('Passwords do not match.'); return; } const result = await simulateSuccess(); if (result.ok) setSuccess(true); });
  return <AuthLayout title="Choose a new password" description="Make it memorable for you and difficult for anyone else." footer={<span><Link href="/auth/login" className="font-bold text-primary hover:underline" data-testid="link-login">Return to sign in</Link></span>}>
    {success ? <div className="space-y-5"><FormMessage kind="success">Your new password was simulated successfully.</FormMessage><p className="text-sm leading-6 text-muted-foreground">Your updated credentials are ready for the next sign-in test.</p><Link href="/auth/login" className="flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground" data-testid="link-reset-success">Go to sign in</Link></div> :
      <form className="space-y-5" onSubmit={onSubmit} noValidate>{error && <FormMessage kind="error">{error}</FormMessage>}<Field id="password" label="New password" type="password" value={password} onChange={setPassword} placeholder="Create a secure password" autoComplete="new-password" /><PasswordStrength password={password} /><Field id="confirmation" label="Confirm new password" type="password" value={confirmation} onChange={setConfirmation} placeholder="Repeat your password" autoComplete="new-password" /><SubmitButton loading={loading}>Update password</SubmitButton></form>}
  </AuthLayout>;
}