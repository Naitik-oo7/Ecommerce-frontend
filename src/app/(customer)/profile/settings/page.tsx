'use client';

import { useState } from 'react';
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

  const notifPrefs = [
    { key: 'email', label: 'Email Notifications', desc: 'Order updates and promotions via email' },
    { key: 'sms', label: 'SMS Notifications', desc: 'Important order alerts via text message' },
    { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] block mb-1">Preferences</span>
        <h1 className="text-2xl font-bold text-[#111111]">Account Settings</h1>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-[#E5E2DD] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0EDE8]">
          <div className="w-9 h-9 rounded-xl bg-[#F6F3EE] flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-[#C7A27C]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#111111]">Change Password</h2>
            <p className="text-xs text-[#9B9B9B]">Keep your account secure with a strong password</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {pwSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              <Check className="h-4 w-4 shrink-0" /> Password updated successfully
            </div>
          )}
          {pwError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{pwError}</p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrentPw ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="pr-10 h-11 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#111111] transition-colors"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">New Password</Label>
            <div className="relative">
              <Input
                type={showNewPw ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="pr-10 h-11 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#111111] transition-colors"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[#9B9B9B]">Minimum 8 characters</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Confirm New Password</Label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="h-11 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20"
            />
          </div>

          <button
            onClick={handlePasswordSubmit}
            disabled={changingPw}
            className="h-11 px-6 bg-[#111111] text-white text-sm font-medium rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {changingPw ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-[#E5E2DD] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0EDE8]">
          <div className="w-9 h-9 rounded-xl bg-[#F6F3EE] flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-[#C7A27C]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#111111]">Notification Preferences</h2>
            <p className="text-xs text-[#9B9B9B]">Control how we reach you</p>
          </div>
        </div>
        <div className="divide-y divide-[#F0EDE8]">
          {notifPrefs.map((pref) => {
            const isOn = notifications[pref.key as keyof typeof notifications];
            return (
              <div key={pref.key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-[#111111]">{pref.label}</p>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">{pref.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  onClick={() => setNotifications({ ...notifications, [pref.key]: !isOn })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isOn ? 'bg-[#C7A27C]' : 'bg-[#D4D0CA]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isOn ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0EDE8]">
          <button className="h-10 px-5 bg-[#111111] text-white text-sm font-medium rounded-xl hover:bg-[#333] transition-colors">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
