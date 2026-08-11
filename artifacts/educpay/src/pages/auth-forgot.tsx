import { useState } from 'react';
import { Link } from 'wouter';
import { AuthLayout } from '@/components/auth-layout';
import { Field, FormMessage, SubmitButton, useSubmit } from '@/components/auth-form';
import { simulateSuccess } from '@/lib/local-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState(false);
  const { loading, onSubmit } = useSubmit(async () => { setError(''); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; } const result = await simulateSuccess(); if (result.ok) setSuccess(true); });
  return <AuthLayout title="Reset your password" description="Enter your work email and we’ll show you what the reset flow looks like." footer={<span>Remembered it? <Link href="/auth/login" className="font-bold text-primary hover:underline" data-testid="link-login">Back to sign in</Link></span>}>
    {success ? <div className="space-y-5"><FormMessage kind="success">Reset instructions simulated. In production, a secure email would be sent to {email}.</FormMessage><p className="text-sm leading-6 text-muted-foreground">For this local test, continue to the reset screen directly.</p><Link href="/auth/reset-password" className="flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground" data-testid="link-reset-password">Continue to reset password</Link></div> :
      <form className="space-y-5" onSubmit={onSubmit} noValidate>{error && <FormMessage kind="error">{error}</FormMessage>}<Field id="email" label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@school.org" autoComplete="email" /><SubmitButton loading={loading}>Send reset instructions</SubmitButton></form>}
  </AuthLayout>;
}