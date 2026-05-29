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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2, Edit, Star, Loader2, X, Check } from 'lucide-react';

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

type FormPanelProps = {
  editingId: number | null;
  form: AddressForm;
  error: string;
  creating: boolean;
  updating: boolean;
  updateForm: (field: keyof AddressForm, value: string | boolean) => void;
  handleSubmit: () => void;
  onClose: () => void;
};

function AddressFormPanel({ editingId, form, error, creating, updating, updateForm, handleSubmit, onClose }: FormPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#C7A27C]/30 shadow-sm mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE8] bg-[#FAFAF8]">
        <div>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] block mb-0.5">
            {editingId ? 'Edit' : 'New'}
          </span>
          <h3 className="text-base font-semibold text-[#111111]">
            {editingId ? 'Update Address' : 'Add New Address'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EDE8] transition-colors"
        >
          <X className="h-4 w-4 text-[#6B6B6B]" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Label <span className="text-[#C7A27C]">*</span></Label>
            <Input value={form.label} onChange={(e) => updateForm('label', e.target.value)} placeholder="Home, Work…" className="h-10 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Country <span className="text-[#C7A27C]">*</span></Label>
            <Input value={form.country} onChange={(e) => updateForm('country', e.target.value)} placeholder="India" className="h-10 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Street Address <span className="text-[#C7A27C]">*</span></Label>
          <Input value={form.street} onChange={(e) => updateForm('street', e.target.value)} placeholder="123 Main Street, Apt 4B" className="h-10 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">City <span className="text-[#C7A27C]">*</span></Label>
            <Input value={form.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="Mumbai" className="h-10 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">State <span className="text-[#C7A27C]">*</span></Label>
            <Input value={form.state} onChange={(e) => updateForm('state', e.target.value)} placeholder="Maharashtra" className="h-10 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Pincode <span className="text-[#C7A27C]">*</span></Label>
            <Input value={form.pincode} onChange={(e) => updateForm('pincode', e.target.value)} placeholder="400001" className="h-10 border-[#E5E2DD] focus:border-[#C7A27C] focus:ring-[#C7A27C]/20" />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            form.isDefault ? 'bg-[#C7A27C] border-[#C7A27C]' : 'border-[#D4D0CA] group-hover:border-[#C7A27C]'
          }`}>
            {form.isDefault && <Check className="h-3 w-3 text-white" />}
          </div>
          <input type="checkbox" checked={form.isDefault} onChange={(e) => updateForm('isDefault', e.target.checked)} className="sr-only" />
          <span className="text-sm text-[#4A4A4A]">Set as default address</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 h-11 border border-[#E5E2DD] rounded-xl text-sm font-medium text-[#6B6B6B] hover:border-[#C7A27C] hover:text-[#111111] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={creating || updating} className="flex-1 h-11 bg-[#111111] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {(creating || updating) ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> {editingId ? 'Update Address' : 'Save Address'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

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
        <a href="/login" className="px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors">
          Login to manage addresses
        </a>
      </div>
    );
  }

  interface Address {
    id: number;
    label: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
  }

  const addresses = (addressesResponse as Address[] | undefined) || [];

  const updateForm = (field: keyof AddressForm, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const openEditForm = (addr: Address) => {
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
    } catch (err) {
      const errorWithData = err as { data?: { message?: string } };
      setError(errorWithData?.data?.message || 'Failed to save address');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C7A27C] block mb-1">Saved</span>
          <h1 className="text-2xl font-bold text-[#111111]">My Addresses</h1>
          <p className="text-sm text-[#9B9B9B] mt-0.5">
            {addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Address
          </button>
        )}
      </div>

      {/* Form panel */}
      {showForm && (
        <AddressFormPanel
          editingId={editingId}
          form={form}
          error={error}
          creating={creating}
          updating={updating}
          updateForm={updateForm}
          handleSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-[#F6F3EE] animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E2DD] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F6F3EE] flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-[#C7A27C]" />
          </div>
          <h2 className="text-lg font-semibold text-[#111111] mb-1">No saved addresses</h2>
          <p className="text-sm text-[#9B9B9B] mb-6">Add a shipping address for faster checkout</p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(addresses as Address[]).map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${
                addr.isDefault
                  ? 'border-[#C7A27C] shadow-sm'
                  : 'border-[#E5E2DD] hover:border-[#C7A27C]/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    addr.isDefault ? 'bg-[#C7A27C]/10' : 'bg-[#F6F3EE]'
                  }`}>
                    <MapPin className={`h-4 w-4 ${addr.isDefault ? 'text-[#C7A27C]' : 'text-[#9B9B9B]'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#111111] capitalize">{addr.label}</p>
                    {addr.isDefault && (
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-[#C7A27C]/10 text-[#C7A27C] rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditForm(addr)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9B9B9B] hover:bg-[#F6F3EE] hover:text-[#111111] transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingIds.has(addr.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9B9B9B] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    {deletingIds.has(addr.id)
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#6B6B6B] leading-relaxed pl-10">
                {addr.street}<br />
                {addr.city}, {addr.state} – {addr.pincode}<br />
                {addr.country}
              </p>

              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="mt-3 ml-10 flex items-center gap-1.5 text-xs text-[#9B9B9B] hover:text-[#C7A27C] transition-colors font-medium"
                >
                  <Star className="h-3 w-3" /> Set as default
                </button>
              )}
            </div>
          ))}

          {/* Add more tile */}
          {!showForm && (
            <button
              onClick={openAddForm}
              className="border-2 border-dashed border-[#E5E2DD] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-[#9B9B9B] hover:border-[#C7A27C] hover:text-[#C7A27C] transition-colors min-h-[160px]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add new address</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
