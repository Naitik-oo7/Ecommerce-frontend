'use client';

import { useState } from 'react';
import {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '@/services/api/addressesApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2, Edit, Star, Loader2, X, Check } from 'lucide-react';
import Link from 'next/link';

type AddressForm = {
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  label: '', street: '', city: '', state: '', pincode: '', country: 'India', isDefault: false,
};

export default function AddressesPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: addressesResponse, isLoading } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Link href="/login"><Button>Login to manage addresses</Button></Link>
      </div>
    );
  }

  const addresses = (addressesResponse as any)?.data || [];

  const updateForm = (field: keyof AddressForm, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const openEditForm = (addr: any) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
      isDefault: addr.isDefault || false,
    });
    setShowForm(true);
    setError('');
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.label || !form.street || !form.city || !form.state || !form.pincode || !form.country) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    try {
      if (editingId) {
        await updateAddress({ id: editingId, ...form }).unwrap();
      } else {
        await createAddress(form).unwrap();
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteAddress(id).unwrap();
    } catch {}
    setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id).unwrap();
    } catch {}
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Addresses</h1>
          <p className="text-muted-foreground mt-1">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={openAddForm} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" /> Add Address
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{editingId ? 'Edit Address' : 'New Address'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-1">
              <Label>Label * <span className="text-muted-foreground font-normal text-xs">(e.g. Home, Work, Other)</span></Label>
              <Input value={form.label} onChange={(e) => updateForm('label', e.target.value)} placeholder="Home" />
            </div>
            <div className="space-y-1">
              <Label>Street Address *</Label>
              <Input value={form.street} onChange={(e) => updateForm('street', e.target.value)} placeholder="123 Main Street, Apt 4B" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="Mumbai" />
              </div>
              <div className="space-y-1">
                <Label>State *</Label>
                <Input value={form.state} onChange={(e) => updateForm('state', e.target.value)} placeholder="Maharashtra" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Pincode *</Label>
                <Input value={form.pincode} onChange={(e) => updateForm('pincode', e.target.value)} placeholder="400001" />
              </div>
              <div className="space-y-1">
                <Label>Country *</Label>
                <Input value={form.country} onChange={(e) => updateForm('country', e.target.value)} placeholder="India" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => updateForm('isDefault', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Set as default address</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={creating || updating} className="flex-1">
                {(creating || updating)
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><Check className="h-4 w-4 mr-1" /> {editingId ? 'Update' : 'Save'}</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      ) : addresses.length === 0 ? (
        <Card className="text-center p-10">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No saved addresses</h2>
          <p className="text-muted-foreground mb-4">Add a shipping address for faster checkout</p>
          <Button onClick={openAddForm}><Plus className="h-4 w-4 mr-2" /> Add Address</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((addr: any) => (
            <Card key={addr.id} className={addr.isDefault ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold capitalize">{addr.label}</p>
                    {addr.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(addr)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingIds.has(addr.id)}
                    >
                      {deletingIds.has(addr.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {addr.street}<br />
                  {addr.city}, {addr.state} {addr.pincode}<br />
                  {addr.country}
                </p>
                {!addr.isDefault && (
                  <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => handleSetDefault(addr.id)}>
                    <Star className="h-3 w-3 mr-1" /> Set as default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
