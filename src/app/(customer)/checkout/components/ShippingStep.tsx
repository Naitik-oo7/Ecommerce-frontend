'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Home, Briefcase, Building, Check } from 'lucide-react';
import type { NewAddressForm } from '../hooks/useCheckout';

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

interface ShippingStepProps {
  addresses: Address[];
  selectedAddressId: number | null;
  setSelectedAddressId: (id: number) => void;
  showNewForm: boolean;
  setUseNewAddress: (val: boolean) => void;
  newAddrForm: NewAddressForm;
  setNewAddrForm: (form: NewAddressForm) => void;
}

const addressTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  work: Briefcase,
  office: Building,
};

export function ShippingStep({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  showNewForm,
  setUseNewAddress,
  newAddrForm,
  setNewAddrForm,
}: ShippingStepProps) {
  return (
    <div className="space-y-4">
      {addresses.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => {
            const Icon = addressTypeIcons[addr.label?.toLowerCase()] || MapPin;
            const isSelected = selectedAddressId === addr.id && !showNewForm;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => {
                  setSelectedAddressId(addr.id);
                  setUseNewAddress(false);
                }}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-[#C7A27C] bg-[#C7A27C]/5 ring-1 ring-[#C7A27C]'
                    : 'border-[#E5E2DD] bg-white hover:border-[#C7A27C]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#C7A27C] text-white' : 'bg-[#F6F3EE] text-[#C7A27C]'
                  }`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-[#111111] capitalize">{addr.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-[#C7A27C]" />
                      )}
                    </div>
                    <p className="text-sm text-[#6B6B6B] truncate">{addr.street}</p>
                    <p className="text-sm text-[#9B9B9B]">{addr.city}, {addr.state} {addr.pincode}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add new address */}
      <div className={`rounded-2xl border transition-all ${
        showNewForm ? 'border-[#C7A27C] bg-white' : 'border-[#E5E2DD] bg-white'
      }`}>
        <button
          type="button"
          onClick={() => setUseNewAddress(true)}
          className="w-full flex items-center gap-2 px-4 py-3.5 text-sm font-medium text-[#111111]"
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${
            showNewForm ? 'bg-[#C7A27C] text-white' : 'bg-[#F6F3EE] text-[#C7A27C]'
          }`}>
            <Plus className="h-4 w-4" />
          </span>
          {addresses.length > 0 ? 'Deliver to a new address' : 'Add a delivery address'}
        </button>

        {showNewForm && (
          <div className="space-y-4 px-4 pb-4 pt-2 border-t border-[#E5E2DD]">
            <div>
              <Label className="text-xs text-[#9B9B9B] uppercase tracking-wider mb-1 block">Address Label</Label>
              <Input
                value={newAddrForm.label}
                onChange={(e) => setNewAddrForm({ ...newAddrForm, label: e.target.value })}
                placeholder="Home, Work, etc."
              />
            </div>
            <div>
              <Label className="text-xs text-[#9B9B9B] uppercase tracking-wider mb-1 block">Street Address</Label>
              <Input
                value={newAddrForm.street}
                onChange={(e) => setNewAddrForm({ ...newAddrForm, street: e.target.value })}
                placeholder="123 Main Street, Apt 4B"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#9B9B9B] uppercase tracking-wider mb-1 block">City</Label>
                <Input
                  value={newAddrForm.city}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <Label className="text-xs text-[#9B9B9B] uppercase tracking-wider mb-1 block">State</Label>
                <Input
                  value={newAddrForm.state}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })}
                  placeholder="Maharashtra"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#9B9B9B] uppercase tracking-wider mb-1 block">Pincode</Label>
                <Input
                  value={newAddrForm.pincode}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, pincode: e.target.value })}
                  placeholder="400001"
                />
              </div>
              <div>
                <Label className="text-xs text-[#9B9B9B] uppercase tracking-wider mb-1 block">Country</Label>
                <Input
                  value={newAddrForm.country}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, country: e.target.value })}
                  placeholder="India"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
