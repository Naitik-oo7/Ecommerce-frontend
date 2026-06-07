'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetAllSettingsQuery, useUpdateSettingMutation } from '@/services/api/settingsApi';
import { useUploadImageMutation } from '@/services/api/uploadApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Save, Settings, BookOpen, Award, Globe, Sparkles,
  CheckCircle2, Plus, Trash2, Image as ImageIcon, Type,
  Megaphone, ShieldCheck, Link as LinkIcon, Mail,
  AlertCircle, GripVertical, ExternalLink,
  Gem, Leaf, Heart, Star, Shield, Truck, RefreshCw, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HeroSettings {
  eyebrow: string;
  headline: [string, string];
  subtext: string;
  backgroundImage: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string };
  stats: { value: string; label: string }[];
}

interface TrustItem { icon: string; text: string }

interface BrandStory {
  eyebrow: string;
  headline: string;
  subheadline: string;
  body1: string;
  body2: string;
  image1: string;
  image2: string;
  stat: { value: string; label: string };
  materials: { label: string; desc: string }[];
}

interface Value { icon: string; title: string; desc: string }

interface GeneralSettings {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  instagram: string;
  twitter: string;
  facebook: string;
  newsletterHeadline: string;
  newsletterSubtext: string;
  footerTagline: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultHero: HeroSettings = {
  eyebrow: 'New Collection 2026',
  headline: ['Crafted For', 'Modern Living'],
  subtext: 'Timeless essentials designed with precision, comfort, and sustainable craftsmanship for the contemporary wardrobe.',
  backgroundImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  ctaPrimary: { label: 'Explore Collection', href: '/products' },
  ctaSecondary: { label: 'Watch Lookbook' },
  stats: [
    { value: '50K+', label: 'Happy Customers' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24h', label: 'Fast Shipping' },
  ],
};

const defaultTrustItems: TrustItem[] = [
  { icon: 'Truck', text: 'Free Shipping Worldwide' },
  { icon: 'RefreshCw', text: '30-Day Returns' },
  { icon: 'Gem', text: 'Premium Materials' },
  { icon: 'Leaf', text: 'Carbon Neutral Delivery' },
];

const defaultBrandStory: BrandStory = {
  eyebrow: 'Our Philosophy',
  headline: 'Designed with intention.',
  subheadline: 'Built to last.',
  body1: 'Every piece in our collection is thoughtfully designed and meticulously crafted.',
  body2: 'From fabric selection to final stitching, we maintain the highest standards.',
  image1: 'https://images.unsplash.com/photo-1558618047-f4b5110f757d?w=800&q=80',
  image2: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80',
  stat: { value: '12+', label: 'Years of Excellence' },
  materials: [
    { label: 'Organic Cotton', desc: 'Sustainably sourced' },
    { label: 'Linen Blend', desc: 'Breathable comfort' },
    { label: 'Recycled Wool', desc: 'Eco-conscious warmth' },
    { label: 'Silk Touch', desc: 'Luxurious feel' },
  ],
};

const defaultValues: Value[] = [
  { icon: 'Gem',   title: 'Uncompromising Quality',  desc: 'We work only with premium materials.' },
  { icon: 'Leaf',  title: 'Sustainable Practices',   desc: 'From organic fabrics to carbon-neutral shipping.' },
  { icon: 'Heart', title: 'Made With Care',           desc: 'Each piece is crafted with intention.' },
  { icon: 'Globe', title: 'Responsible Sourcing',    desc: 'We partner with certified ethical suppliers.' },
];

const defaultGeneral: GeneralSettings = {
  contactEmail: 'hello@mono.com',
  contactPhone: '+91 98765 43210',
  contactAddress: '12, Pali Hill, Bandra West, Mumbai 400050',
  instagram: 'https://instagram.com/mono',
  twitter: 'https://twitter.com/mono',
  facebook: 'https://facebook.com/mono',
  newsletterHeadline: "Stay close to what's next.",
  newsletterSubtext: 'Be the first to know about new collections, exclusive offers, and style inspiration.',
  footerTagline: 'Curated essentials for the modern wardrobe. Timeless pieces, sustainable quality.',
};

const iconOptions = ['Gem', 'Leaf', 'Heart', 'Globe', 'Award', 'Sparkles', 'Users', 'BookOpen', 'Star', 'Shield', 'Truck', 'RefreshCw'];
const trustIconOptions = ['Truck', 'RefreshCw', 'Gem', 'Leaf', 'Star', 'Shield', 'Heart', 'Award', 'Globe', 'Sparkles'];

// ─── Icon map for visual picker ───────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Gem, Leaf, Heart, Globe, Award, Sparkles, Users, BookOpen, Star, Shield, Truck, RefreshCw,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CharCount({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length;
  return (
    <span className={cn('text-xs tabular-nums', remaining < 20 ? 'text-amber-500' : 'text-muted-foreground/50')}>
      {value.length}/{max}
    </span>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full border-2 border-dashed border-muted-foreground/20 rounded-lg py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
    >
      <Plus className="h-6 w-6" />
      <span className="text-sm">{label}</span>
    </button>
  );
}

// ─── Icon Picker ──────────────────────────────────────────────────────────────

function IconPicker({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const Icon = ICON_MAP[opt];
        return (
          <button
            key={opt}
            type="button"
            title={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'p-2 rounded-md border transition-all',
              value === opt
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : <span className="text-xs">{opt}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Image Upload Sub-component ──────────────────────────────────────────────

function ImageUploadBox({
  label, value, uploading, onChange, onRemove,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 hover:border-primary/50 transition-colors">
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="w-full h-36 object-cover rounded-md" />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={onChange} />
                <div className="bg-white/90 hover:bg-white text-foreground px-2.5 py-1 rounded text-xs font-medium shadow">
                  {uploading ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Uploading…</span> : 'Change'}
                </div>
              </label>
              <button onClick={onRemove} className="bg-white/90 hover:bg-white text-destructive px-2.5 py-1 rounded text-xs font-medium shadow">Remove</button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-36 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onChange} />
            {uploading ? (
              <><Loader2 className="h-7 w-7 animate-spin text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Uploading…</span></>
            ) : (
              <><ImageIcon className="h-8 w-8 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Click to upload</span><span className="text-xs text-muted-foreground/60 mt-0.5">JPG, PNG up to 10MB</span></>
            )}
          </label>
        )}
      </div>
    </div>
  );
}

// ─── Save Bar ─────────────────────────────────────────────────────────────────

function SaveBar({
  dirty, saving, onSave, label,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  label: string;
}) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="sticky bottom-4 z-10"
        >
          <div className="flex items-center justify-between bg-background/95 backdrop-blur border border-amber-300 dark:border-amber-700 shadow-lg rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>You have unsaved changes in <strong>{label}</strong></span>
            </div>
            <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5 shrink-0">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      className="fixed top-4 right-4 z-50 pointer-events-none"
    >
      {type === 'success' ? (
        <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 shadow-lg rounded-xl px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive border border-destructive/20 shadow-lg rounded-xl px-4 py-3 text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetAllSettingsQuery();
  const [updateSetting, { isLoading: isSaving }] = useUpdateSettingMutation();
  const [uploadImage] = useUploadImageMutation();

  const [activeTab, setActiveTab] = useState('hero');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // State per section
  const [hero, setHero] = useState<HeroSettings>(defaultHero);
  const [trustItems, setTrustItems] = useState<TrustItem[]>(defaultTrustItems);
  const [brandStory, setBrandStory] = useState<BrandStory>(defaultBrandStory);
  const [ourValues, setOurValues] = useState<Value[]>(defaultValues);
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);

  // Dirty tracking — saved snapshots
  const [savedHero, setSavedHero] = useState<HeroSettings>(defaultHero);
  const [savedTrust, setSavedTrust] = useState<TrustItem[]>(defaultTrustItems);
  const [savedBrand, setSavedBrand] = useState<BrandStory>(defaultBrandStory);
  const [savedValues, setSavedValues] = useState<Value[]>(defaultValues);
  const [savedGeneral, setSavedGeneral] = useState<GeneralSettings>(defaultGeneral);

  const isDirtyHero    = JSON.stringify(hero)       !== JSON.stringify(savedHero);
  const isDirtyTrust   = JSON.stringify(trustItems) !== JSON.stringify(savedTrust);
  const isDirtyBrand   = JSON.stringify(brandStory) !== JSON.stringify(savedBrand);
  const isDirtyValues  = JSON.stringify(ourValues)  !== JSON.stringify(savedValues);
  const isDirtyGeneral = JSON.stringify(general)    !== JSON.stringify(savedGeneral);

  // Hydrate from DB
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    if (!settings || hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    if (settings.hero) {
      const v = { ...defaultHero, ...settings.hero };
      setHero(v); setSavedHero(v);
    }
    if (settings.trust_items && Array.isArray(settings.trust_items)) {
      setTrustItems(settings.trust_items); setSavedTrust(settings.trust_items);
    }
    if (settings.brand_story) {
      const v = { ...defaultBrandStory, ...settings.brand_story };
      setBrandStory(v); setSavedBrand(v);
    }
    if (settings.our_values && Array.isArray(settings.our_values)) {
      setOurValues(settings.our_values); setSavedValues(settings.our_values);
    }
    if (settings.general) {
      const v = { ...defaultGeneral, ...settings.general };
      setGeneral(v); setSavedGeneral(v);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const t = setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3500);
    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

  // Generic save helper
  const save = async (key: string, value: unknown, label: string, onSaved: () => void) => {
    try {
      await updateSetting({ key, value }).unwrap();
      setSuccessMessage(`${label} saved!`);
      onSaved();
    } catch {
      setErrorMessage(`Failed to save ${label}.`);
    }
  };

  // Image upload helper
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    onSuccess: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMessage('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setErrorMessage('File size must be less than 10MB.'); return; }
    setUploadingField(field);
    try {
      const result = await uploadImage(file).unwrap();
      onSuccess(result.url);
      setSuccessMessage('Image uploaded!');
    } catch {
      setErrorMessage('Image upload failed.');
    } finally {
      setUploadingField(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <AnimatePresence>
        {successMessage && <Toast message={successMessage} type="success" />}
        {errorMessage && <Toast message={errorMessage} type="error" />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CMS Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage all dynamic content across your website.</p>
        </div>
        <div className="flex items-center gap-2">
          {(isDirtyHero || isDirtyTrust || isDirtyBrand || isDirtyValues || isDirtyGeneral) && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 gap-1 text-xs">
              <AlertCircle className="h-3 w-3" /> Unsaved changes
            </Badge>
          )}
          <Badge variant="secondary" className="text-sm">
            <Settings className="h-3 w-3 mr-1" /> CMS
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start p-1">
          <TabsTrigger value="hero" className="gap-1.5 relative">
            <Megaphone className="h-3.5 w-3.5" />Homepage Hero
            {isDirtyHero && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="trust" className="gap-1.5 relative">
            <ShieldCheck className="h-3.5 w-3.5" />Trust Bar
            {isDirtyTrust && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="brand-story" className="gap-1.5 relative">
            <BookOpen className="h-3.5 w-3.5" />Brand Story
            {isDirtyBrand && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="values" className="gap-1.5 relative">
            <Award className="h-3.5 w-3.5" />Our Values
            {isDirtyValues && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5 relative">
            <Globe className="h-3.5 w-3.5" />General
            {isDirtyGeneral && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />Preview
          </TabsTrigger>
        </TabsList>

        {/* ── HERO TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />Homepage Hero Section</CardTitle>
              <CardDescription>Controls the full-screen split hero on the homepage (CinematicHero component).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="space-y-4">
                <SectionDivider label="Copy" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Eyebrow Label</Label>
                    <Input value={hero.eyebrow} onChange={(e) => setHero((prev) => ({ ...prev, eyebrow: e.target.value }))} placeholder="e.g., New Collection 2026" maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label>Headline Line 1</Label>
                    <Input value={hero.headline[0]} onChange={(e) => setHero((prev) => ({ ...prev, headline: [e.target.value, prev.headline[1]] }))} placeholder="e.g., Crafted For" maxLength={40} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Headline Line 2 <span className="text-muted-foreground text-xs font-normal">(muted)</span></Label>
                    </div>
                    <Input value={hero.headline[1]} onChange={(e) => setHero((prev) => ({ ...prev, headline: [prev.headline[0], e.target.value] }))} placeholder="e.g., Modern Living" maxLength={40} />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary CTA Label</Label>
                    <Input value={hero.ctaPrimary.label} onChange={(e) => setHero((prev) => ({ ...prev, ctaPrimary: { ...prev.ctaPrimary, label: e.target.value } }))} placeholder="Explore Collection" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary CTA URL</Label>
                    <Input value={hero.ctaPrimary.href} onChange={(e) => setHero((prev) => ({ ...prev, ctaPrimary: { ...prev.ctaPrimary, href: e.target.value } }))} placeholder="/products" />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary CTA Label</Label>
                    <Input value={hero.ctaSecondary.label} onChange={(e) => setHero((prev) => ({ ...prev, ctaSecondary: { label: e.target.value } }))} placeholder="Watch Lookbook" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Subtext</Label>
                    <CharCount value={hero.subtext} max={200} />
                  </div>
                  <Textarea value={hero.subtext} onChange={(e) => setHero((prev) => ({ ...prev, subtext: e.target.value }))} rows={2} placeholder="Short description below the headline…" maxLength={200} />
                </div>
              </div>

              <div className="space-y-4">
                <SectionDivider label="Background Image" />
                <ImageUploadBox
                  label="Hero Background"
                  value={hero.backgroundImage}
                  uploading={uploadingField === 'hero-bg'}
                  onChange={(e) => handleImageUpload(e, 'hero-bg', (url) => setHero((prev) => ({ ...prev, backgroundImage: url })))}
                  onRemove={() => setHero((prev) => ({ ...prev, backgroundImage: '' }))}
                />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Or paste a URL directly</Label>
                  <Input value={hero.backgroundImage} onChange={(e) => setHero((prev) => ({ ...prev, backgroundImage: e.target.value }))} placeholder="https://…" />
                </div>
              </div>

              <div className="space-y-4">
                <SectionDivider label="Floating Stats" />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setHero((prev) => ({ ...prev, stats: [...prev.stats, { value: '', label: '' }] }))} className="gap-1">
                    <Plus className="h-4 w-4" /> Add Stat
                  </Button>
                </div>
                {hero.stats.length === 0 ? (
                  <EmptyState label="Add your first stat" onAdd={() => setHero((prev) => ({ ...prev, stats: [{ value: '', label: '' }] }))} />
                ) : (
                  <div className="space-y-2">
                    {hero.stats.map((stat, i) => (
                      <div key={i} className="flex gap-2 items-center p-3 bg-muted/40 rounded-lg group">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        <div className="space-y-1 w-5 shrink-0 text-center">
                          <span className="text-xs text-muted-foreground/50">{i + 1}</span>
                        </div>
                        <Input className="w-24" value={stat.value} onChange={(e) => { const s = [...hero.stats]; s[i] = { ...s[i], value: e.target.value }; setHero((prev) => ({ ...prev, stats: s })); }} placeholder="50K+" />
                        <Input className="flex-1" value={stat.label} onChange={(e) => { const s = [...hero.stats]; s[i] = { ...s[i], label: e.target.value }; setHero((prev) => ({ ...prev, stats: s })); }} placeholder="Happy Customers" />
                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setHero((prev) => ({ ...prev, stats: prev.stats.filter((_, idx) => idx !== i) }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <SaveBar
            dirty={isDirtyHero}
            saving={isSaving}
            onSave={() => save('hero', hero, 'Hero', () => setSavedHero(hero))}
            label="Hero"
          />
        </TabsContent>

        {/* ── TRUST BAR TAB ────────────────────────────────────────────────── */}
        <TabsContent value="trust" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Trust Marquee Bar</CardTitle>
              <CardDescription>The animated dark ticker bar below the hero. Controls text and icons in the scrolling marquee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setTrustItems([...trustItems, { icon: 'Gem', text: '' }])} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>

              {trustItems.length === 0 ? (
                <EmptyState label="Add your first trust item" onAdd={() => setTrustItems([{ icon: 'Gem', text: '' }])} />
              ) : (
                <div className="space-y-3">
                  {trustItems.map((item, i) => (
                    <div key={i} className="p-4 bg-muted/40 rounded-lg space-y-3 group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setTrustItems(trustItems.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Icon</Label>
                        <IconPicker value={item.icon} options={trustIconOptions} onChange={(v) => { const t = [...trustItems]; t[i] = { ...t[i], icon: v }; setTrustItems(t); }} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Text</Label>
                        <Input
                          value={item.text}
                          onChange={(e) => { const t = [...trustItems]; t[i] = { ...t[i], text: e.target.value }; setTrustItems(t); }}
                          placeholder="Trust message…"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Live preview strip */}
              <div className="space-y-2">
                <SectionDivider label="Live Preview" />
                <div className="bg-[#111111] rounded-lg px-6 py-4 overflow-hidden">
                  <div className="flex gap-8 flex-wrap">
                    {trustItems.map((item, i) => {
                      const Icon = ICON_MAP[item.icon];
                      return (
                        <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                          {Icon ? <Icon className="h-4 w-4 text-[#C7A27C]" /> : <span className="text-[#C7A27C]">•</span>}
                          <span>{item.text || <span className="italic text-white/30">empty</span>}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <SaveBar
            dirty={isDirtyTrust}
            saving={isSaving}
            onSave={() => save('trust_items', trustItems, 'Trust bar', () => setSavedTrust(trustItems))}
            label="Trust Bar"
          />
        </TabsContent>

        {/* ── BRAND STORY TAB ──────────────────────────────────────────────── */}
        <TabsContent value="brand-story" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Brand Story</CardTitle>
              <CardDescription>Controls the About page hero + the brand story section on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="space-y-4">
                <SectionDivider label="Copy" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Eyebrow</Label><Input value={brandStory.eyebrow} onChange={(e) => setBrandStory({ ...brandStory, eyebrow: e.target.value })} placeholder="Our Philosophy" /></div>
                  <div className="space-y-2"><Label>Headline</Label><Input value={brandStory.headline} onChange={(e) => setBrandStory({ ...brandStory, headline: e.target.value })} placeholder="Designed with intention." /></div>
                  <div className="space-y-2"><Label>Subheadline</Label><Input value={brandStory.subheadline} onChange={(e) => setBrandStory({ ...brandStory, subheadline: e.target.value })} placeholder="Built to last." /></div>
                  <div className="space-y-2">
                    <Label>Stat</Label>
                    <div className="flex gap-2">
                      <Input className="w-24" value={brandStory.stat.value} onChange={(e) => setBrandStory({ ...brandStory, stat: { ...brandStory.stat, value: e.target.value } })} placeholder="12+" />
                      <Input className="flex-1" value={brandStory.stat.label} onChange={(e) => setBrandStory({ ...brandStory, stat: { ...brandStory.stat, label: e.target.value } })} placeholder="Years of Excellence" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Body Paragraph 1</Label>
                    <CharCount value={brandStory.body1} max={300} />
                  </div>
                  <Textarea value={brandStory.body1} onChange={(e) => setBrandStory({ ...brandStory, body1: e.target.value })} rows={3} maxLength={300} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Body Paragraph 2</Label>
                    <CharCount value={brandStory.body2} max={300} />
                  </div>
                  <Textarea value={brandStory.body2} onChange={(e) => setBrandStory({ ...brandStory, body2: e.target.value })} rows={3} maxLength={300} />
                </div>
              </div>

              <div className="space-y-4">
                <SectionDivider label="Images" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <ImageUploadBox label="Main Image" value={brandStory.image1} uploading={uploadingField === 'bs-img1'} onChange={(e) => handleImageUpload(e, 'bs-img1', (url) => setBrandStory({ ...brandStory, image1: url }))} onRemove={() => setBrandStory({ ...brandStory, image1: '' })} />
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Or paste URL</Label><Input value={brandStory.image1} onChange={(e) => setBrandStory({ ...brandStory, image1: e.target.value })} placeholder="https://…" /></div>
                  </div>
                  <div className="space-y-3">
                    <ImageUploadBox label="Secondary Image" value={brandStory.image2} uploading={uploadingField === 'bs-img2'} onChange={(e) => handleImageUpload(e, 'bs-img2', (url) => setBrandStory({ ...brandStory, image2: url }))} onRemove={() => setBrandStory({ ...brandStory, image2: '' })} />
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Or paste URL</Label><Input value={brandStory.image2} onChange={(e) => setBrandStory({ ...brandStory, image2: e.target.value })} placeholder="https://…" /></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionDivider label="Materials" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setBrandStory({ ...brandStory, materials: [...brandStory.materials, { label: '', desc: '' }] })} className="gap-1 shrink-0 ml-4"><Plus className="h-4 w-4" /> Add</Button>
                </div>
                {brandStory.materials.length === 0 ? (
                  <EmptyState label="Add a material" onAdd={() => setBrandStory({ ...brandStory, materials: [{ label: '', desc: '' }] })} />
                ) : (
                  <div className="space-y-2">
                    {brandStory.materials.map((mat, i) => (
                      <div key={i} className="flex gap-2 items-center p-2.5 bg-muted/40 rounded-lg group">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        <Input className="flex-1" value={mat.label} onChange={(e) => { const m = [...brandStory.materials]; m[i] = { ...m[i], label: e.target.value }; setBrandStory({ ...brandStory, materials: m }); }} placeholder="Material name" />
                        <Input className="flex-1" value={mat.desc} onChange={(e) => { const m = [...brandStory.materials]; m[i] = { ...m[i], desc: e.target.value }; setBrandStory({ ...brandStory, materials: m }); }} placeholder="Description" />
                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setBrandStory({ ...brandStory, materials: brandStory.materials.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <SaveBar
            dirty={isDirtyBrand}
            saving={isSaving}
            onSave={() => save('brand_story', brandStory, 'Brand story', () => setSavedBrand(brandStory))}
            label="Brand Story"
          />
        </TabsContent>

        {/* ── VALUES TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="values" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Our Values</CardTitle>
              <CardDescription>Value cards shown on the About page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setOurValues([...ourValues, { icon: 'Sparkles', title: '', desc: '' }])} className="gap-1"><Plus className="h-4 w-4" /> Add Value</Button>
              </div>

              {ourValues.length === 0 ? (
                <EmptyState label="Add your first value" onAdd={() => setOurValues([{ icon: 'Sparkles', title: '', desc: '' }])} />
              ) : (
                <div className="space-y-4">
                  {ourValues.map((value, i) => (
                    <div key={i} className="p-4 border rounded-xl space-y-4 group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value {i + 1}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setOurValues(ourValues.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Icon</Label>
                        <IconPicker value={value.icon} options={iconOptions} onChange={(v) => { const vals = [...ourValues]; vals[i] = { ...vals[i], icon: v }; setOurValues(vals); }} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                          <Label>Title</Label>
                          <Input value={value.title} onChange={(e) => { const v = [...ourValues]; v[i] = { ...v[i], title: e.target.value }; setOurValues(v); }} placeholder="Value title" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label>Description</Label>
                            <CharCount value={value.desc} max={120} />
                          </div>
                          <Textarea value={value.desc} onChange={(e) => { const v = [...ourValues]; v[i] = { ...v[i], desc: e.target.value }; setOurValues(v); }} rows={2} placeholder="Describe this value…" maxLength={120} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <SaveBar
            dirty={isDirtyValues}
            saving={isSaving}
            onSave={() => save('our_values', ourValues, 'Values', () => setSavedValues(ourValues))}
            label="Values"
          />
        </TabsContent>

        {/* ── GENERAL TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-6">

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Contact Information</CardTitle>
              <CardDescription>Displayed on the /contact page info cards and footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" value={general.contactEmail} onChange={(e) => setGeneral({ ...general, contactEmail: e.target.value })} placeholder="hello@mono.com" /></div>
                <div className="space-y-2"><Label>Phone Number</Label><Input value={general.contactPhone} onChange={(e) => setGeneral({ ...general, contactPhone: e.target.value })} placeholder="+91 98765 43210" /></div>
              </div>
              <div className="space-y-2"><Label>Office Address</Label><Textarea value={general.contactAddress} onChange={(e) => setGeneral({ ...general, contactAddress: e.target.value })} rows={2} placeholder="Full address…" /></div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" />Social Media Links</CardTitle>
              <CardDescription>Footer social icons will link to these URLs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Instagram</Label><Input value={general.instagram} onChange={(e) => setGeneral({ ...general, instagram: e.target.value })} placeholder="https://instagram.com/…" /></div>
                <div className="space-y-2"><Label>Twitter / X</Label><Input value={general.twitter} onChange={(e) => setGeneral({ ...general, twitter: e.target.value })} placeholder="https://twitter.com/…" /></div>
                <div className="space-y-2"><Label>Facebook</Label><Input value={general.facebook} onChange={(e) => setGeneral({ ...general, facebook: e.target.value })} placeholder="https://facebook.com/…" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Newsletter copy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Newsletter Section</CardTitle>
              <CardDescription>Text shown in the newsletter sign-up section at the bottom of the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Headline</Label>
                  <CharCount value={general.newsletterHeadline} max={80} />
                </div>
                <Input value={general.newsletterHeadline} onChange={(e) => setGeneral({ ...general, newsletterHeadline: e.target.value })} placeholder="Stay close to what's next." maxLength={80} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Subtext</Label>
                  <CharCount value={general.newsletterSubtext} max={160} />
                </div>
                <Textarea value={general.newsletterSubtext} onChange={(e) => setGeneral({ ...general, newsletterSubtext: e.target.value })} rows={2} maxLength={160} />
              </div>
            </CardContent>
          </Card>

          {/* Footer tagline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Footer</CardTitle>
              <CardDescription>Short brand tagline shown under the logo in the footer.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Footer Tagline</Label>
                  <CharCount value={general.footerTagline} max={140} />
                </div>
                <Textarea value={general.footerTagline} onChange={(e) => setGeneral({ ...general, footerTagline: e.target.value })} rows={2} maxLength={140} />
              </div>
            </CardContent>
          </Card>

          <SaveBar
            dirty={isDirtyGeneral}
            saving={isSaving}
            onSave={() => save('general', general, 'General settings', () => setSavedGeneral(general))}
            label="General"
          />
        </TabsContent>

        {/* ── PREVIEW TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Live Preview</CardTitle>
                  <CardDescription>A quick glance at current content before saving.</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open('/', '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5" /> Homepage
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open('/about', '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5" /> About
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open('/contact', '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5" /> Contact
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* Hero preview */}
              <div className="space-y-3">
                <SectionDivider label="Homepage Hero" />
                <div className="relative h-52 rounded-xl overflow-hidden bg-muted border">
                  {hero.backgroundImage && <img src={hero.backgroundImage} alt="" className="w-full h-full object-cover opacity-40" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent dark:from-black/80 dark:via-black/40" />
                  <div className="absolute inset-0 flex flex-col justify-center pl-8">
                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-2">{hero.eyebrow || '—'}</span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{hero.headline[0] || '—'}</p>
                    <p className="text-2xl font-bold text-gray-400 leading-tight">{hero.headline[1] || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs line-clamp-2">{hero.subtext}</p>
                    <div className="flex gap-6 mt-4">
                      {hero.stats.slice(0, 3).map((s) => (
                        <div key={s.label}>
                          <p className="text-base font-bold text-gray-800 dark:text-gray-100">{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust bar preview */}
              <div className="space-y-3">
                <SectionDivider label="Trust Bar" />
                <div className="bg-[#111111] rounded-lg px-4 py-3 flex gap-6 flex-wrap">
                  {trustItems.map((t, i) => {
                    const Icon = ICON_MAP[t.icon];
                    return (
                      <span key={i} className="text-sm text-white/80 flex items-center gap-2">
                        {Icon ? <Icon className="h-3.5 w-3.5 text-amber-500" /> : <span className="text-amber-500">•</span>}
                        {t.text}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Brand story preview */}
              <div className="space-y-3">
                <SectionDivider label="Brand Story" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold tracking-wider uppercase text-amber-600">{brandStory.eyebrow}</span>
                    <p className="text-xl font-bold">{brandStory.headline}</p>
                    <p className="text-base text-muted-foreground">{brandStory.subheadline}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{brandStory.body1}</p>
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-lg font-bold text-amber-600">{brandStory.stat.value}</span>
                      <span className="text-xs text-muted-foreground">{brandStory.stat.label}</span>
                    </div>
                  </div>
                  <div className="grid grid-rows-2 gap-2 h-48">
                    <div className="rounded-lg overflow-hidden bg-muted">
                      {brandStory.image1 ? <img src={brandStory.image1} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/30" /></div>}
                    </div>
                    <div className="rounded-lg overflow-hidden bg-muted">
                      {brandStory.image2 ? <img src={brandStory.image2} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/30" /></div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Values preview */}
              <div className="space-y-3">
                <SectionDivider label="Our Values" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ourValues.map((v, i) => {
                    const Icon = ICON_MAP[v.icon];
                    return (
                      <div key={i} className="p-3 bg-muted rounded-xl space-y-1.5">
                        {Icon && <Icon className="h-4 w-4 text-amber-600" />}
                        <p className="font-semibold text-sm">{v.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{v.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
