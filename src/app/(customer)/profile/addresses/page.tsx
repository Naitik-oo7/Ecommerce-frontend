'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    isDefault: false,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newAddress.fullName}
                onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={newAddress.zipCode}
                  onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={newAddress.country}
                  onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newAddress.isDefault}
                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
              />
              <Label htmlFor="isDefault">Set as default address</Label>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button>Save Address</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 ? (
        <Card className="max-w-md mx-auto text-center p-8">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No addresses saved</h2>
          <p className="text-muted-foreground mb-6">Add a shipping address for faster checkout</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address: any) => (
            <Card key={address.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {address.fullName}
                    {address.isDefault && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {address.address}<br />
                  {address.city}, {address.state} {address.zipCode}<br />
                  {address.country}<br />
                  {address.phone}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
