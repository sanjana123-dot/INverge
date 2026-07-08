'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AlertTriangle, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { clearAuthSession, performLogout } from '@/lib/auth-session';
import { userService } from '@/services/user.service';
import { disconnectSocket } from '@/lib/socket';
import { getApiError } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE to confirm permanent account removal');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Enter your password to continue');
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await userService.deleteAccount(deletePassword);
      disconnectSocket();
      clearAuthSession();
      router.push('/login');
    } catch (err) {
      setDeleteError(getApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? 'default' : 'outline'}
              onClick={() => setTheme(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p><span className="text-zinc-500">Email:</span> {user?.email}</p>
          <p><span className="text-zinc-500">Role:</span> {user?.role}</p>
          <p><span className="text-zinc-500">Trust score:</span> {user?.trustScore?.toFixed(1)}</p>
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => performLogout(router.push)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-zinc-600 dark:text-zinc-400">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!showDeleteForm ? (
            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => {
                setShowDeleteForm(true);
                setDeleteError('');
                setDeletePassword('');
                setDeleteConfirm('');
              }}
            >
              Delete account permanently
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-red-200 p-4 dark:border-red-900/50">
              <div>
                <Label htmlFor="deletePassword">Password</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={deleting}
                />
              </div>
              <div>
                <Label htmlFor="deleteConfirm">Type DELETE to confirm</Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  disabled={deleting}
                />
              </div>
              {deleteError && <p className="text-red-600 dark:text-red-400">{deleteError}</p>}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Confirm deletion'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteForm(false);
                    setDeleteError('');
                    setDeletePassword('');
                    setDeleteConfirm('');
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
