'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['FOUNDER', 'INVESTOR']),
});

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FOUNDER' as 'FOUNDER' | 'INVESTOR',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        loginSchema.parse(form);
        const { data } = await authService.login(form.email, form.password);
        const result = data.data!;
        setAuth(result.user, result.accessToken, result.refreshToken);
      } else {
        signupSchema.parse(form);
        const { data } = await authService.signup(form);
        const result = data.data!;
        setAuth(result.user, result.accessToken, result.refreshToken);
      }
      router.replace('/dashboard');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {mode === 'signup' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>I am a</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['FOUNDER', 'INVESTOR'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                    form.role === role
                      ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {role === 'FOUNDER' ? 'Founder' : 'Investor'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {mode === 'login' && (
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-violet-600 hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  );
}
