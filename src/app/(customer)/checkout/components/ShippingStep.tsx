'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Home, Briefcase, Building } from 'lucide-react';
import type { NewAddressForm } from '../hooks/useCheckout';

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
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
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Shipping Address</h2>
          <p className="text-sm text-muted-foreground">Select where you want your order delivered</p>
        </div>
      </div>

      {addresses.length > 0 && (
        <div className="grid gap-4">
          {addresses.map((addr) => {
            const Icon = addressTypeIcons[addr.label?.toLowerCase()] || MapPin;
            const isSelected = selectedAddressId === addr.id;
            return (
              <Card
                key={addr.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-amber-500 border-amber-500' : 'hover:border-amber-300'
                }`}
                onClick={() => {
                  setSelectedAddressId(addr.id);
                  setUseNewAddress(false);
                }}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-amber-100' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-amber-700' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{addr.label}</span>
                      {isSelected && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Selected</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{addr.street}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.pincode}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {addresses.length > 0 && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>
      )}

      <Card className={showNewForm ? 'ring-2 ring-amber-500 border-amber-500' : ''}>
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 mb-4"
            onClick={() => setUseNewAddress(true)}
          >
            <Plus className="h-4 w-4" />
            Use a new address
          </Button>

          {showNewForm && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Address Label</Label>
                <Input
                  value={newAddrForm.label}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, label: e.target.value })}
                  placeholder="Home, Work, etc."
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Street Address</Label>
                <Input
                  value={newAddrForm.street}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, street: e.target.value })}
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">City</Label>
                  <Input
                    value={newAddrForm.city}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">State</Label>
                  <Input
                    value={newAddrForm.state}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })}
                    placeholder="Maharashtra"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Pincode</Label>
                  <Input
                    value={newAddrForm.pincode}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, pincode: e.target.value })}
                    placeholder="400001"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Country</Label>
                  <Input
                    value={newAddrForm.country}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, country: e.target.value })}
                    placeholder="India"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
