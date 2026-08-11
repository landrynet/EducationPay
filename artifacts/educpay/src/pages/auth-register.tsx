import { useState } from 'react';
import { Link } from 'wouter';
import { AuthLayout } from '@/components/auth-layout';
import { Field, FormMessage, PasswordStrength, SubmitButton, useSubmit } from '@/components/auth-form';
import { simulateSuccess } from '@/lib/local-auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { loading, onSubmit } = useSubmit(async () => {
    setError('');
    if (!name.trim() || !school.trim()) { setError('Enter your name and school name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid work email address.'); return; }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) { setError('Choose a password that meets all three strength checks.'); return; }
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    const result = await simulateSuccess();
    if (result.ok) setSuccess(true);
  });
  return <AuthLayout title="Start with the essentials" description="Create a workspace request for your school. This template only simulates the next step." footer={<span>Already have access? <Link href="/auth/login" className="font-bold text-primary hover:underline" data-testid="link-login">Sign in</Link></span>}>
    {success ? <div className="space-y-5" data-testid="state-register-success"><FormMessage kind="success">Thanks, {name.split(' ')[0] || 'there'}. Your registration was simulated successfully.</FormMessage><p className="text-sm leading-6 text-muted-foreground">In a connected environment, a school administrator would receive an invitation at <strong className="text-foreground">{email}</strong>.</p><Link href="/auth/login" className="flex h-12 items-center justify-center rounded-xl border border-primary font-bold text-primary transition-colors hover:bg-primary/5" data-testid="link-success-login">Return to sign in</Link></div> :
       <form className="space-y-4" onSubmit={onSubmit} noValidate>{error && <FormMessage kind="error">{error}</FormMessage>}<Field id="name" label="Your name" value={name} onChange={setName} placeholder="Amina Okafor" autoComplete="name" /><Field id="school" label="School or organization" value={school} onChange={setSchool} placeholder="Riverside Academy" autoComplete="organization" /><Field id="email" label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@school.org" autoComplete="email" /><Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Create a secure password" autoComplete="new-password" /><PasswordStrength password={password} /><Field id="confirmation" label="Confirm password" type="password" value={confirmation} onChange={setConfirmation} placeholder="Repeat your password" autoComplete="new-password" /><SubmitButton loading={loading}>Continue registration</SubmitButton><p className="pt-1 text-center text-[11px] leading-5 text-muted-foreground">By continuing, you acknowledge this is a local product simulation.</p></form>}
  </AuthLayout>;
}