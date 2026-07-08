import Link from 'next/link';
import { Shield } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { LoginSessionReset } from '@/components/auth/LoginSessionReset';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 px-4 dark:from-zinc-950 dark:to-zinc-900">
      <LoginSessionReset />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 flex items-center justify-center gap-2 font-bold">
            <Shield className="h-8 w-8 text-violet-600" />
            INverge
          </Link>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
          <p className="mt-6 text-center text-sm text-zinc-500">
            No account?{' '}
            <Link href="/signup" className="font-medium text-violet-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
