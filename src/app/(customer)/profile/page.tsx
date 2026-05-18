'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setUser } from '@/lib/redux/authSlice';
import { useUpdateProfileMutation, useGetProfileQuery } from '@/services/api/usersApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Camera, Edit2, Check, X, Loader2, Package, Heart, Star, MapPin, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { data: profileResponse } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="mb-4">Please login to view your profile.</p>
        <Link href="/login"><Button>Login</Button></Link>
      </div>
    );
  }

  const profile = (profileResponse as any)?.data || user;

  const handleEdit = () => {
    setFormData({ name: profile?.name || '', email: profile?.email || '' });
    setIsEditing(true);
    setSaveError('');
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaveError('');
    if (!formData.name.trim()) {
      setSaveError('Name is required');
      return;
    }
    try {
      const updated = await updateProfile({ name: formData.name }).unwrap();
      const updatedUser = (updated as any)?.data || updated;
      if (user && updatedUser) {
        dispatch(setUser({ ...user, name: updatedUser.name, avatar: updatedUser.avatar }));
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.data?.message || 'Failed to update profile');
    }
  };

  const quickLinks = [
    { href: '/orders', icon: Package, label: 'My Orders', desc: 'View your order history' },
    { href: '/wishlist', icon: Heart, label: 'Wishlist', desc: 'Saved products' },
    { href: '/reviews', icon: Star, label: 'My Reviews', desc: 'Reviews you have written' },
    { href: '/profile/addresses', icon: MapPin, label: 'Addresses', desc: 'Manage shipping addresses' },
    { href: '/profile/settings', icon: Settings, label: 'Settings', desc: 'Password & preferences' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updating}>
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 rounded-md text-sm">
                  <Check className="h-4 w-4" /> Profile updated successfully
                </div>
              )}
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}

              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {(profile?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{profile?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  {profile?.role === 'admin' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-1 inline-block">Admin</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="pl-10 bg-muted/30"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
