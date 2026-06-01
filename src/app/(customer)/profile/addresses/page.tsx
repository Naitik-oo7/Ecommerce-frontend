'use client';

import { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Star,
  Loader2,
  X,
  Check,
  Home,
  Briefcase,
  Building,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  label: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
};

const LABEL_PRESETS = [
  { value: 'Home', icon: Home },
  { value: 'Work', icon: Briefcase },
  { value: 'Office', icon: Building },
] as const;

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

function getLabelIcon(label: string) {
  const key = label?.toLowerCase();
  if (key === 'home') return Home;
  if (key === 'work') return Briefcase;
  if (key === 'office') return Building;
  return MapPin;
}

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

function AddressFormPanel({
  editingId,
  form,
  error,
  creating,
  updating,
  updateForm,
  handleSubmit,
  onClose,
}: FormPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="bg-card rounded-2xl border border-accent/30 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 md:px-6 border-b border-border bg-muted/30">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-0.5">
              {editingId ? 'Edit address' : 'New address'}
            </p>
            <h2 className="text-base font-semibold text-foreground">
              {editingId ? 'Update delivery location' : 'Add a delivery location'}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded-full"
            aria-label="Close form"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Address type</Label>
            <div className="flex flex-wrap gap-2">
              {LABEL_PRESETS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateForm('label', value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    form.label.toLowerCase() === value.toLowerCase()
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="addr-label" className="text-xs text-muted-foreground">
                Label <span className="text-accent">*</span>
              </Label>
              <Input
                id="addr-label"
                value={form.label}
                onChange={(e) => updateForm('label', e.target.value)}
                placeholder="Home, Work…"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-country" className="text-xs text-muted-foreground">
                Country <span className="text-accent">*</span>
              </Label>
              <Input
                id="addr-country"
                value={form.country}
                onChange={(e) => updateForm('country', e.target.value)}
                placeholder="India"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addr-street" className="text-xs text-muted-foreground">
              Street address <span className="text-accent">*</span>
            </Label>
            <Input
              id="addr-street"
              value={form.street}
              onChange={(e) => updateForm('street', e.target.value)}
              placeholder="House no., building, street, landmark"
              className="h-10"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="addr-city" className="text-xs text-muted-foreground">
                City <span className="text-accent">*</span>
              </Label>
              <Input
                id="addr-city"
                value={form.city}
                onChange={(e) => updateForm('city', e.target.value)}
                placeholder="Mumbai"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-state" className="text-xs text-muted-foreground">
                State <span className="text-accent">*</span>
              </Label>
              <Input
                id="addr-state"
                value={form.state}
                onChange={(e) => updateForm('state', e.target.value)}
                placeholder="Maharashtra"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-pincode" className="text-xs text-muted-foreground">
                Pincode <span className="text-accent">*</span>
              </Label>
              <Input
                id="addr-pincode"
                value={form.pincode}
                onChange={(e) => updateForm('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="400001"
                inputMode="numeric"
                className="h-10"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                form.isDefault
                  ? 'bg-accent border-accent'
                  : 'border-border group-hover:border-accent/50'
              }`}
            >
              {form.isDefault && <Check className="h-3 w-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => updateForm('isDefault', e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm text-foreground">Use as default for checkout</span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full h-11">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={creating || updating}
              className="flex-1 rounded-full h-11"
            >
              {(creating || updating) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingId ? 'Save changes' : 'Save address'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AddressCard({
  addr,
  isDeleting,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addr: Address;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const Icon = getLabelIcon(addr.label);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border bg-card transition-all ${
        addr.isDefault
          ? 'border-accent/50 shadow-sm ring-1 ring-accent/20'
          : 'border-border hover:border-accent/30 hover:shadow-sm'
      }`}
    >
      {addr.isDefault && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />}

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                addr.isDefault ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground capitalize truncate">{addr.label}</h3>
                {addr.isDefault && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                    <Star className="h-2.5 w-2.5 fill-accent" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">PIN {addr.pincode}</p>
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onEdit}
              className="rounded-lg"
              aria-label={`Edit ${addr.label} address`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label={`Delete ${addr.label} address`}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <address className="text-sm text-muted-foreground not-italic leading-relaxed pl-[3.25rem]">
          <p className="text-foreground/90">{addr.street}</p>
          <p className="mt-0.5">
            {addr.city}, {addr.state} – {addr.pincode}
          </p>
          <p className="mt-0.5">{addr.country}</p>
        </address>

        {!addr.isDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSetDefault}
            className="mt-4 ml-[3.25rem] h-8 rounded-full text-xs text-muted-foreground hover:text-accent px-3"
          >
            <Star className="h-3 w-3" />
            Set as default
          </Button>
        )}
      </div>
    </motion.article>
  );
}

export default function AddressesPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: addressesResponse, isLoading } = useGetAddressesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const addresses = isAuthenticated
    ? (addressesResponse as Address[] | undefined) || []
    : [];

  const sortedAddresses = useMemo(
    () => [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [addresses]
  );

  const defaultAddress = addresses.find((a) => a.isDefault);
  const hasDefault = Boolean(defaultAddress);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <p className="text-muted-foreground mb-4">Sign in to manage your delivery addresses.</p>
        <Link href="/login?redirect=/profile/addresses">
          <Button className="rounded-full">Sign in</Button>
        </Link>
      </div>
    );
  }

  const updateForm = (field: keyof AddressForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
    setForm({
      ...emptyForm,
      isDefault: addresses.length === 0,
    });
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.label || !form.street || !form.city || !form.state || !form.pincode || !form.country) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.pincode.length !== 6) {
      setError('Pincode must be 6 digits');
      return;
    }
    setError('');
    try {
      if (editingId) {
        await updateAddress({ id: editingId, ...form }).unwrap();
      } else {
        await createAddress(form).unwrap();
      }
      closeForm();
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
      if (editingId === id) closeForm();
    } catch {
      /* list refetches on success */
    }
    setDeletingIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleSetDefault = async (id: number) => {
    setSettingDefaultId(id);
    try {
      await setDefaultAddress(id).unwrap();
    } catch {
      /* silent */
    }
    setSettingDefaultId(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-1">Delivery</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My addresses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {addresses.length} saved location{addresses.length !== 1 ? 's' : ''} for faster checkout
          </p>
        </div>
        {!showForm && addresses.length > 0 && (
          <Button onClick={openAddForm} className="rounded-full shrink-0 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add address
          </Button>
        )}
      </header>

      {/* Summary */}
      {addresses.length > 0 && (
        <section
          aria-label="Address summary"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums text-foreground">{addresses.length}</p>
            <p className="text-sm font-medium text-foreground mt-1">Saved</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Delivery locations</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 col-span-1 sm:col-span-2">
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-2">
              {hasDefault ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Default set
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-amber-600" />
                  No default yet
                </>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
              {hasDefault
                ? `${defaultAddress!.label} · ${defaultAddress!.city}, ${defaultAddress!.pincode}`
                : 'Choose a default address to pre-select at checkout'}
            </p>
          </div>
        </section>
      )}

      {/* Tip */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
        <Truck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your default address is pre-selected during checkout. You can save multiple locations and
          switch anytime.
        </p>
      </div>

      {/* Form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <AddressFormPanel
            key={editingId ?? 'new'}
            editingId={editingId}
            form={form}
            error={error}
            creating={creating}
            updating={updating}
            updateForm={updateForm}
            handleSubmit={handleSubmit}
            onClose={closeForm}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted/50 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-border bg-card px-6 py-14 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">No saved addresses</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Add where you want orders delivered. Your first address can be set as default
            automatically.
          </p>
          <Button onClick={openAddForm} className="rounded-full">
            <Plus className="h-4 w-4" />
            Add your first address
          </Button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sortedAddresses.map((addr) => (
            <AddressCard
              key={addr.id}
              addr={addr}
              isDeleting={deletingIds.has(addr.id)}
              onEdit={() => openEditForm(addr)}
              onDelete={() => handleDelete(addr.id)}
              onSetDefault={() => handleSetDefault(addr.id)}
            />
          ))}

          {!showForm && (
            <button
              type="button"
              onClick={openAddForm}
              className="group min-h-[11rem] rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-all hover:border-accent/50 hover:text-accent hover:bg-accent/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted group-hover:bg-accent/10 transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Add another address</span>
            </button>
          )}
        </div>
      )}

      {settingDefaultId !== null && (
        <p className="sr-only" aria-live="polite">
          Updating default address…
        </p>
      )}
    </div>
  );
}
