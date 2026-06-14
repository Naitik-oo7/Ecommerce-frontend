'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X, Heart, ShoppingBag, Star, Check, ArrowRight, Minus, Plus } from 'lucide-react';

import { useGetProductBySlugQuery } from '@/services/api/productsApi';
import { useAddToCartMutation } from '@/services/api/cartApi';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { addGuestItem } from '@/lib/redux/guestCartSlice';
import type { Product, ProductVariant } from '@/types';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isInWishlist?: boolean;
  onToggleWishlist?: (productId: number, e: React.MouseEvent) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function QuickViewModal({
  product: seed,
  isOpen,
  onClose,
  isInWishlist = false,
  onToggleWishlist,
}: QuickViewModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Fetch full product (variants + all images) lazily when opened.
  const { data: fetched, isFetching } = useGetProductBySlugQuery(seed?.slug ?? '', {
    skip: !isOpen || !seed?.slug,
  });
  const product = fetched ?? seed;

  const variants = useMemo<ProductVariant[]>(() => product?.variants ?? [], [product]);
  const hasColors = variants.some((v) => v.color);
  const colors = useMemo(
    () => (hasColors ? [...new Set(variants.filter((v) => v.color).map((v) => v.color))] : []),
    [variants, hasColors]
  );

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const [addToCart] = useAddToCartMutation();

  // Reset transient state whenever a new product is opened.
  useEffect(() => {
    if (!isOpen) return;
    setActiveImage(0);
    setQuantity(1);
    setJustAdded(false);
    const firstColor = hasColors ? variants.find((v) => v.stock > 0)?.color ?? colors[0] ?? null : null;
    setSelectedColor(firstColor);
    const firstVariant = hasColors
      ? variants.find((v) => v.color === firstColor && v.stock > 0) ?? null
      : variants.find((v) => v.stock > 0) ?? null;
    setSelectedVariant(firstVariant);
  }, [isOpen, product?.id, hasColors, colors, variants]);

  // Close on Escape + lock scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!seed) return null;

  const sizesForColor = hasColors
    ? variants.filter((v) => v.color === selectedColor)
    : variants;

  const images = product?.images?.length ? product.images : seed.images ?? [];
  const rating = Number(product?.avgRating) || 0;
  const price = selectedVariant?.price ?? product?.price ?? seed.price;
  const compare = product?.comparePrice;
  const salePercent = compare && compare > price ? Math.round((1 - price / compare) * 100) : null;

  const needsSize = sizesForColor.length > 0;
  const canAdd = !!selectedVariant && selectedVariant.stock > 0;

  const handleAddToCart = async (buyNow = false) => {
    if (!selectedVariant) return;

    if (!isAuthenticated) {
      const primaryImage = images[0] ?? null;
      dispatch(
        addGuestItem({
          variantId: selectedVariant.id,
          size: selectedVariant.size,
          quantity,
          productName: product?.name ?? seed?.name ?? '',
          productSlug: product?.slug ?? seed?.slug ?? '',
          price: Number(price),
          comparePrice: compare ? Number(compare) : null,
          imageUrl: primaryImage,
          category: (product as { category?: { name?: string } } | undefined)?.category?.name,
        })
      );
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2200);
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        variantId: selectedVariant.id,
        size: selectedVariant.size,
        quantity,
      }).unwrap();
      if (buyNow) {
        onClose();
        router.push('/checkout');
        return;
      }
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2200);
    } catch {
      // RTK Query surfaces the error; keep the modal open.
    } finally {
      setAdding(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Quick view: ${seed.name}`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-mono-charcoal/55 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '6%', scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '6%', scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quick view"
              className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-mono-charcoal shadow-md backdrop-blur-sm transition-colors hover:bg-mono-cream"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2">
              {/* Gallery */}
              <div className="relative bg-mono-cream">
                <div className="relative aspect-square w-full overflow-hidden md:aspect-auto md:h-full md:min-h-[520px]">
                  {images[activeImage] ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={images[activeImage]}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={images[activeImage]}
                          alt={seed.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#A8A199]">
                      <ShoppingBag className="h-10 w-10" strokeWidth={1.2} />
                    </div>
                  )}
                  {salePercent && (
                    <span className="absolute left-4 top-4 rounded-full bg-mono-terracotta px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm">
                      −{salePercent}%
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide md:absolute md:bottom-0 md:left-0 md:right-0">
                    {images.slice(0, 6).map((img, i) => (
                      <button
                        key={img + i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        aria-label={`View image ${i + 1}`}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all ${
                          i === activeImage ? 'border-mono-charcoal' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={img} alt={`${product?.name ?? seed.name} — view ${i + 1}`} fill sizes="56px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col gap-5 p-6 md:p-8">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mono-terracotta">
                    {product?.category?.name || 'Collection'}
                  </p>
                  <h2
                    className="text-2xl font-bold leading-tight text-mono-charcoal"
                    style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
                  >
                    {seed.name}
                  </h2>

                  {rating > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= Math.round(rating)
                                ? 'fill-mono-terracotta text-mono-terracotta'
                                : 'fill-[#E8E2DA] text-[#E8E2DA]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-mono-stone">
                        {rating.toFixed(1)}
                        {product?.reviewCount ? ` · ${product.reviewCount} reviews` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-mono-charcoal tabular-nums">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {compare && compare > price && (
                    <span className="text-base text-[#A8A199] line-through tabular-nums">
                      ₹{compare.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {product?.description && (
                  <p className="line-clamp-3 text-sm leading-relaxed text-mono-stone">{product.description}</p>
                )}

                {/* Colours */}
                {colors.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-mono-charcoal">Color</span>
                      {selectedColor && <span className="text-xs capitalize text-mono-stone">{selectedColor}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {colors.map((color) => {
                        const v = variants.find((x) => x.color === color);
                        const inStock = variants.some((x) => x.color === color && x.stock > 0);
                        const active = selectedColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            title={color}
                            aria-label={`Color ${color}`}
                            onClick={() => {
                              setSelectedColor(color);
                              setSelectedVariant(
                                variants.find((x) => x.color === color && x.stock > 0) ??
                                  variants.find((x) => x.color === color) ??
                                  null
                              );
                            }}
                            className={`relative h-8 w-8 rounded-full transition-all duration-200 ${
                              active ? 'ring-2 ring-mono-terracotta ring-offset-2' : 'ring-1 ring-black/10 hover:ring-mono-stone/50'
                            } ${!inStock ? 'opacity-40' : ''}`}
                            style={{ backgroundColor: v?.colorHex || '#CFC7BD' }}
                          >
                            {active && <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {needsSize && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-mono-charcoal">Size</span>
                      {selectedVariant?.stock !== undefined && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                        <span className="text-xs font-medium text-[#C26A2E]">Only {selectedVariant.stock} left</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizesForColor.map((v) => {
                        const active = selectedVariant?.id === v.id;
                        const out = v.stock === 0;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={out}
                            onClick={() => setSelectedVariant(v)}
                            className={`relative h-10 min-w-[48px] rounded-xl border-2 px-3 text-sm font-medium transition-all duration-200 ${
                              active
                                ? 'border-mono-charcoal bg-mono-charcoal text-white'
                                : out
                                  ? 'cursor-not-allowed border-[#EDE9E3] text-[#C8C0B8] line-through'
                                  : 'border-[#E5E2DD] text-mono-charcoal hover:border-mono-charcoal'
                            }`}
                          >
                            {v.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-mono-charcoal">Qty</span>
                  <div className="flex items-center rounded-full border border-[#E5E2DD]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-9 w-9 items-center justify-center text-mono-charcoal transition-colors hover:text-mono-terracotta disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock ?? 10, q + 1))}
                      disabled={!!selectedVariant && quantity >= selectedVariant.stock}
                      aria-label="Increase quantity"
                      className="flex h-9 w-9 items-center justify-center text-mono-charcoal transition-colors hover:text-mono-terracotta disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-3 pt-2">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(false)}
                      disabled={!canAdd || adding || isFetching}
                      className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                        justAdded ? 'bg-mono-sage text-white' : 'bg-mono-charcoal text-white hover:bg-[#2A2A26]'
                      }`}
                    >
                      {adding ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : justAdded ? (
                        <>
                          <Check className="h-4 w-4" /> Added to cart
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4" />
                          {canAdd ? 'Add to Cart' : 'Sold Out'}
                        </>
                      )}
                    </button>

                    {onToggleWishlist && (
                      <button
                        type="button"
                        onClick={(e) => onToggleWishlist(seed.id, e)}
                        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        aria-pressed={isInWishlist}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isInWishlist
                            ? 'border-[#B54A4A] bg-[#B54A4A] text-white'
                            : 'border-[#E5E2DD] text-mono-charcoal hover:border-mono-charcoal'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(true)}
                    disabled={!canAdd || adding || isFetching}
                    className="h-11 w-full rounded-full border border-mono-charcoal text-sm font-medium text-mono-charcoal transition-colors hover:bg-mono-charcoal hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Buy it now
                  </button>

                  <Link
                    href={`/products/${seed.slug}`}
                    onClick={onClose}
                    className="group flex items-center justify-center gap-1.5 pt-1 text-xs font-medium text-mono-stone transition-colors hover:text-mono-charcoal"
                  >
                    View full details
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default QuickViewModal;
