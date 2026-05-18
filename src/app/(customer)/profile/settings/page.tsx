'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Bell, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { useChangePasswordMutation } from '@/services/api/usersApi';

export default function SettingsPage() {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();

  const handlePasswordSubmit = async () => {
    setPwError('');
    setPwSuccess(false);
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPwError('All fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      setPwSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwError(err?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pwSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm">
                <Check className="h-4 w-4" /> Password updated successfully
              </div>
            )}
            {pwError && (
              <p className="text-sm text-destructive">{pwError}</p>
            )}

            <div className="space-y-1">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPw(!showNewPw)}
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <Button onClick={handlePasswordSubmit} disabled={changingPw}>
              {changingPw ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive order updates and promotions via email' },
              { key: 'sms', label: 'SMS Notifications', desc: 'Get important order alerts via text message' },
              { key: 'push', label: 'Push Notifications', desc: 'Receive browser push notifications' },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={notifications[pref.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications({ ...notifications, [pref.key]: e.target.checked })}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${notifications[pref.key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${notifications[pref.key as keyof typeof notifications] ? 'translate-x-5.5 ml-5.5' : 'translate-x-0.5 ml-0.5'}`} style={{ marginLeft: notifications[pref.key as keyof typeof notifications] ? '22px' : '2px' }} />
                  </div>
                </label>
              </div>
            ))}
            <Button className="mt-2">Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
