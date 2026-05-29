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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetAllSettingsQuery();
  const [updateSetting, { isLoading: isSaving }] = useUpdateSettingMutation();
  const [uploadImage] = useUploadImageMutation();

  const [activeTab, setActiveTab] = useState('hero');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // State per section - with lazy initialization from settings
  const [hero, setHero] = useState<HeroSettings>(defaultHero);
  const [trustItems, setTrustItems] = useState<TrustItem[]>(defaultTrustItems);
  const [brandStory, setBrandStory] = useState<BrandStory>(defaultBrandStory);
  const [ourValues, setOurValues] = useState<Value[]>(defaultValues);
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);

  // Hydrate from DB - use a ref flag to prevent cascading updates
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    if (!settings || hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    if (settings.hero)        setHero({ ...defaultHero, ...settings.hero });
    if (settings.trust_items && Array.isArray(settings.trust_items)) setTrustItems(settings.trust_items);
    if (settings.brand_story) setBrandStory({ ...defaultBrandStory, ...settings.brand_story });
    if (settings.our_values && Array.isArray(settings.our_values)) setOurValues(settings.our_values);
    if (settings.general)     setGeneral({ ...defaultGeneral, ...settings.general });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const t = setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3500);
    return () => clearTimeout(t);
  }, [successMessage, errorMessage]);

  // Generic save helper
  const save = async (key: string, value: unknown, label: string) => {
    try {
      await updateSetting({ key, value }).unwrap();
      setSuccessMessage(`${label} saved successfully!`);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CMS Settings</h1>
          <p className="text-muted-foreground mt-1">Manage all dynamic content across your website.</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Settings className="h-3 w-3 mr-1" /> CMS Management
        </Badge>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start p-1">
          <TabsTrigger value="hero"        className="gap-1.5"><Megaphone className="h-3.5 w-3.5" />Homepage Hero</TabsTrigger>
          <TabsTrigger value="trust"       className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Trust Bar</TabsTrigger>
          <TabsTrigger value="brand-story" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Brand Story</TabsTrigger>
          <TabsTrigger value="values"      className="gap-1.5"><Award className="h-3.5 w-3.5" />Our Values</TabsTrigger>
          <TabsTrigger value="general"     className="gap-1.5"><Globe className="h-3.5 w-3.5" />General</TabsTrigger>
          <TabsTrigger value="preview"     className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />Preview</TabsTrigger>
        </TabsList>

        {/* ── HERO TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />Homepage Hero Section</CardTitle>
              <CardDescription>Controls the full-screen split hero on the homepage (CinematicHero component).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Text content */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Type className="h-4 w-4" />Copy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Eyebrow Label</Label>
                    <Input value={hero.eyebrow} onChange={(e) => setHero((prev) => ({ ...prev, eyebrow: e.target.value }))} placeholder="e.g., New Collection 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label>Headline Line 1</Label>
                    <Input value={hero.headline[0]} onChange={(e) => setHero((prev) => ({ ...prev, headline: [e.target.value, prev.headline[1]] }))} placeholder="e.g., Crafted For" />
                  </div>
                  <div className="space-y-2">
                    <Label>Headline Line 2 <span className="text-muted-foreground text-xs">(muted)</span></Label>
                    <Input value={hero.headline[1]} onChange={(e) => setHero((prev) => ({ ...prev, headline: [prev.headline[0], e.target.value] }))} placeholder="e.g., Modern Living" />
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
                  <Label>Subtext</Label>
                  <Textarea value={hero.subtext} onChange={(e) => setHero((prev) => ({ ...prev, subtext: e.target.value }))} rows={2} placeholder="Short description below the headline…" />
                </div>
              </div>

              {/* Background image */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4" />Background Image</h3>
                <ImageUploadBox
                  label="Hero Background"
                  value={hero.backgroundImage}
                  uploading={uploadingField === 'hero-bg'}
                  onChange={(e) => handleImageUpload(e, 'hero-bg', (url) => setHero((prev) => ({ ...prev, backgroundImage: url })))}
                  onRemove={() => setHero((prev) => ({ ...prev, backgroundImage: '' }))}
                />
                <p className="text-xs text-muted-foreground">Or paste a URL directly:</p>
                <Input value={hero.backgroundImage} onChange={(e) => setHero((prev) => ({ ...prev, backgroundImage: e.target.value }))} placeholder="https://…" />
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Floating Stats</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => setHero((prev) => ({ ...prev, stats: [...prev.stats, { value: '', label: '' }] }))} className="gap-1">
                    <Plus className="h-4 w-4" /> Add Stat
                  </Button>
                </div>
                <div className="space-y-2">
                  {hero.stats.map((stat, i) => (
                    <div key={i} className="flex gap-2 items-center p-3 bg-muted/40 rounded-lg">
                      <Input className="w-24" value={stat.value} onChange={(e) => { const s = [...hero.stats]; s[i] = { ...s[i], value: e.target.value }; setHero((prev) => ({ ...prev, stats: s })); }} placeholder="50K+" />
                      <Input className="flex-1" value={stat.label} onChange={(e) => { const s = [...hero.stats]; s[i] = { ...s[i], label: e.target.value }; setHero((prev) => ({ ...prev, stats: s })); }} placeholder="Happy Customers" />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => setHero((prev) => ({ ...prev, stats: prev.stats.filter((_, idx) => idx !== i) }))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => save('hero', hero, 'Hero')} disabled={isSaving} className="w-full gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Hero Settings
              </Button>
            </CardContent>
          </Card>
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

              <div className="space-y-3">
                {trustItems.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center p-3 bg-muted/40 rounded-lg">
                    <select
                      value={item.icon}
                      onChange={(e) => { const t = [...trustItems]; t[i] = { ...t[i], icon: e.target.value }; setTrustItems(t); }}
                      className="h-9 px-2 rounded-md border bg-background text-sm w-36 shrink-0"
                    >
                      {trustIconOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <Input
                      className="flex-1"
                      value={item.text}
                      onChange={(e) => { const t = [...trustItems]; t[i] = { ...t[i], text: e.target.value }; setTrustItems(t); }}
                      placeholder="Trust message…"
                    />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => setTrustItems(trustItems.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Live preview strip */}
              <div className="bg-[#111111] rounded-lg px-6 py-4 overflow-hidden">
                <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">Preview</p>
                <div className="flex gap-8 flex-wrap">
                  {trustItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                      <span className="text-[#C7A27C]">•</span>
                      <span>{item.text || '(empty)'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => save('trust_items', trustItems, 'Trust bar')} disabled={isSaving} className="w-full gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Trust Bar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BRAND STORY TAB ──────────────────────────────────────────────── */}
        <TabsContent value="brand-story" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Brand Story</CardTitle>
              <CardDescription>Controls the About page hero + the brand story section on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Type className="h-4 w-4" />Copy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Eyebrow</Label><Input value={brandStory.eyebrow} onChange={(e) => setBrandStory({ ...brandStory, eyebrow: e.target.value })} placeholder="Our Philosophy" /></div>
                  <div className="space-y-2"><Label>Stat Value</Label><Input value={brandStory.stat.value} onChange={(e) => setBrandStory({ ...brandStory, stat: { ...brandStory.stat, value: e.target.value } })} placeholder="12+" /></div>
                  <div className="space-y-2"><Label>Headline</Label><Input value={brandStory.headline} onChange={(e) => setBrandStory({ ...brandStory, headline: e.target.value })} placeholder="Designed with intention." /></div>
                  <div className="space-y-2"><Label>Subheadline</Label><Input value={brandStory.subheadline} onChange={(e) => setBrandStory({ ...brandStory, subheadline: e.target.value })} placeholder="Built to last." /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Stat Label</Label><Input value={brandStory.stat.label} onChange={(e) => setBrandStory({ ...brandStory, stat: { ...brandStory.stat, label: e.target.value } })} placeholder="Years of Excellence" /></div>
                </div>
                <div className="space-y-2"><Label>Body Paragraph 1</Label><Textarea value={brandStory.body1} onChange={(e) => setBrandStory({ ...brandStory, body1: e.target.value })} rows={3} /></div>
                <div className="space-y-2"><Label>Body Paragraph 2</Label><Textarea value={brandStory.body2} onChange={(e) => setBrandStory({ ...brandStory, body2: e.target.value })} rows={3} /></div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4" />Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadBox label="Main Image" value={brandStory.image1} uploading={uploadingField === 'bs-img1'} onChange={(e) => handleImageUpload(e, 'bs-img1', (url) => setBrandStory({ ...brandStory, image1: url }))} onRemove={() => setBrandStory({ ...brandStory, image1: '' })} />
                  <ImageUploadBox label="Secondary Image" value={brandStory.image2} uploading={uploadingField === 'bs-img2'} onChange={(e) => handleImageUpload(e, 'bs-img2', (url) => setBrandStory({ ...brandStory, image2: url }))} onRemove={() => setBrandStory({ ...brandStory, image2: '' })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Or paste Main Image URL</Label><Input value={brandStory.image1} onChange={(e) => setBrandStory({ ...brandStory, image1: e.target.value })} placeholder="https://…" /></div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Or paste Secondary Image URL</Label><Input value={brandStory.image2} onChange={(e) => setBrandStory({ ...brandStory, image2: e.target.value })} placeholder="https://…" /></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Materials</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => setBrandStory({ ...brandStory, materials: [...brandStory.materials, { label: '', desc: '' }] })} className="gap-1"><Plus className="h-4 w-4" /> Add</Button>
                </div>
                <div className="space-y-2">
                  {brandStory.materials.map((mat, i) => (
                    <div key={i} className="flex gap-2 items-center p-2.5 bg-muted/40 rounded-lg">
                      <Input className="flex-1" value={mat.label} onChange={(e) => { const m = [...brandStory.materials]; m[i] = { ...m[i], label: e.target.value }; setBrandStory({ ...brandStory, materials: m }); }} placeholder="Material name" />
                      <Input className="flex-1" value={mat.desc} onChange={(e) => { const m = [...brandStory.materials]; m[i] = { ...m[i], desc: e.target.value }; setBrandStory({ ...brandStory, materials: m }); }} placeholder="Description" />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => setBrandStory({ ...brandStory, materials: brandStory.materials.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => save('brand_story', brandStory, 'Brand story')} disabled={isSaving} className="w-full gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Brand Story
              </Button>
            </CardContent>
          </Card>
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

              <div className="space-y-4">
                {ourValues.map((value, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Value #{i + 1}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setOurValues(ourValues.filter((_, idx) => idx !== i))} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>Icon</Label>
                        <select value={value.icon} onChange={(e) => { const v = [...ourValues]; v[i] = { ...v[i], icon: e.target.value }; setOurValues(v); }} className="w-full h-9 px-3 rounded-md border bg-background text-sm">
                          {iconOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Title</Label>
                        <Input value={value.title} onChange={(e) => { const v = [...ourValues]; v[i] = { ...v[i], title: e.target.value }; setOurValues(v); }} placeholder="Value title" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea value={value.desc} onChange={(e) => { const v = [...ourValues]; v[i] = { ...v[i], desc: e.target.value }; setOurValues(v); }} rows={2} placeholder="Describe this value…" />
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => save('our_values', ourValues, 'Values')} disabled={isSaving} className="w-full gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Values
              </Button>
            </CardContent>
          </Card>
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
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Newsletter Section Copy</CardTitle>
              <CardDescription>Text shown in the newsletter sign-up section at the bottom of the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Headline</Label><Input value={general.newsletterHeadline} onChange={(e) => setGeneral({ ...general, newsletterHeadline: e.target.value })} placeholder="Stay close to what's next." /></div>
              <div className="space-y-2"><Label>Subtext</Label><Textarea value={general.newsletterSubtext} onChange={(e) => setGeneral({ ...general, newsletterSubtext: e.target.value })} rows={2} /></div>
            </CardContent>
          </Card>

          {/* Footer tagline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Footer</CardTitle>
              <CardDescription>Short brand tagline shown under the logo in the footer.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2"><Label>Footer Tagline</Label><Textarea value={general.footerTagline} onChange={(e) => setGeneral({ ...general, footerTagline: e.target.value })} rows={2} /></div>
            </CardContent>
          </Card>

          <Button onClick={() => save('general', general, 'General settings')} disabled={isSaving} className="w-full gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save General Settings
          </Button>
        </TabsContent>

        {/* ── PREVIEW TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Live Preview</CardTitle>
              <CardDescription>A quick glance at current content before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* Hero preview */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Homepage Hero</h3>
                <div className="relative h-52 rounded-xl overflow-hidden bg-muted">
                  {hero.backgroundImage && <img src={hero.backgroundImage} alt="" className="w-full h-full object-cover opacity-40" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-center pl-8">
                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-2">{hero.eyebrow}</span>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{hero.headline[0]}</p>
                    <p className="text-2xl font-bold text-gray-400 leading-tight">{hero.headline[1]}</p>
                    <p className="text-xs text-gray-500 mt-2 max-w-xs">{hero.subtext.substring(0, 80)}…</p>
                    <div className="flex gap-6 mt-4">
                      {hero.stats.slice(0, 3).map((s) => (
                        <div key={s.label}><p className="text-base font-bold text-gray-800">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust bar preview */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Trust Bar</h3>
                <div className="bg-[#111111] rounded-lg px-4 py-3 flex gap-6 flex-wrap">
                  {trustItems.map((t, i) => (
                    <span key={i} className="text-sm text-white/80 flex items-center gap-2">
                      <span className="text-amber-500">•</span>{t.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Brand story preview */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Brand Story</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold tracking-wider uppercase text-amber-600">{brandStory.eyebrow}</span>
                    <p className="text-xl font-bold">{brandStory.headline}</p>
                    <p className="text-lg text-muted-foreground">{brandStory.subheadline}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{brandStory.body1.substring(0, 100)}…</p>
                  </div>
                  <div className="rounded-xl overflow-hidden h-36 bg-muted">
                    {brandStory.image1 && <img src={brandStory.image1} alt="" className="w-full h-full object-cover" />}
                  </div>
                </div>
              </div>

              {/* Values preview */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Our Values</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ourValues.map((v, i) => (
                    <div key={i} className="p-3 bg-muted rounded-xl">
                      <p className="font-semibold text-sm">{v.title || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{v.desc.substring(0, 40)}{v.desc.length > 40 ? '…' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Page links */}
              <div className="flex flex-wrap gap-3 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>View Homepage</Button>
                <Button variant="outline" size="sm" onClick={() => window.open('/about', '_blank')}>View About Page</Button>
                <Button variant="outline" size="sm" onClick={() => window.open('/contact', '_blank')}>View Contact Page</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
