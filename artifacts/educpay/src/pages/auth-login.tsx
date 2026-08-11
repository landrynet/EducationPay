import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AuthLayout, SimulationNotice } from '@/components/auth-layout';
import { Field, FormMessage, SubmitButton, useSubmit } from '@/components/auth-form';
import { DEMO_EMAIL, DEMO_PASSWORD, simulateLogin } from '@/lib/local-auth';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loading, onSubmit } = useSubmit(async () => {
    setError('');
    if (!email.trim()) { setError('Enter your work email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid work email address.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    const result = await simulateLogin(email, password);
    if (!result.ok) { setError(result.message); return; }
    setLocation('/dashboard');
  });
  return <AuthLayout title="Welcome back" description="Sign in to continue to your school operations workspace." footer={<span>Need an account? <Link href="/auth/register" className="font-bold text-primary hover:underline" data-testid="link-register">Create an account</Link></span>}>
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <Field id="email" label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@school.org" autoComplete="email" />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="current-password" />
      <div className="-mt-1 flex justify-end"><Link href="/auth/forgot-password" className="text-xs font-bold text-primary hover:underline" data-testid="link-forgot-password">Forgot password?</Link></div>
      <SubmitButton loading={loading}>Sign in</SubmitButton>
      <SimulationNotice />
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Demo access</p>
        <p className="mt-2 font-mono text-[11px] leading-5 text-foreground/70">Email: {DEMO_EMAIL}<br />Password: {DEMO_PASSWORD} <span className="font-sans text-muted-foreground">(demo only)</span></p>
        <button type="button" className="mt-2 text-xs font-bold text-primary hover:underline" onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); }} data-testid="button-use-demo">Use demo credentials</button>
      </div>
    </form>
  </AuthLayout>;
}