'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Upload, Loader2, ImageOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateReviewMutation } from '@/services/api/reviewsApi';
import { useUploadReviewImageMutation } from '@/services/api/uploadApi';

interface OrderOption {
  id: number;
  label: string;
}

interface WriteReviewModalProps {
  productId: number;
  productName: string;
  /** Provide a fixed orderId (from order page) OR orderOptions (from product page) */
  orderId?: number;
  orderOptions?: OrderOption[];
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_IMAGES = 5;

export function WriteReviewModal({ productId, productName, orderId: fixedOrderId, orderOptions, onClose, onSuccess }: WriteReviewModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number>(fixedOrderId ?? orderOptions?.[0]?.id ?? 0);
  const orderId = fixedOrderId ?? selectedOrderId;
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<Set<number>>(new Set());
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();
  const [uploadReviewImage] = useUploadReviewImageMutation();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (!toAdd.length) return;

    const newEntries = toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    const startIdx = imageFiles.length;
    setImageFiles((prev) => [...prev, ...newEntries]);

    // Upload each file immediately
    const newUrls = [...uploadedUrls];
    for (let i = 0; i < newEntries.length; i++) {
      const idx = startIdx + i;
      setUploadingIdx((prev) => new Set(prev).add(idx));
      try {
        const res = await uploadReviewImage(newEntries[i].file).unwrap();
        newUrls[idx] = (res as { data?: { url: string }; url?: string })?.data?.url || (res as { url?: string })?.url || '';
        setUploadedUrls([...newUrls]);
      } catch {
        setError('Failed to upload one or more images. Please try again.');
      } finally {
        setUploadingIdx((prev) => { const n = new Set(prev); n.delete(idx); return n; });
      }
    }
  }, [imageFiles, uploadedUrls, uploadReviewImage]);

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imageFiles[idx].preview);
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setUploadedUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a rating.'); return; }
    if (uploadingIdx.size > 0) { setError('Please wait for images to finish uploading.'); return; }

    setError('');
    try {
      const validUrls = uploadedUrls.filter(Boolean);
      await createReview({ productId, orderId, rating, comment: comment.trim() || undefined, images: validUrls }).unwrap();
      setSubmitted(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setError(msg || 'Failed to submit review. Please try again.');
    }
  };

  const displayRating = hoverRating || rating;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl border border-border shadow-xl p-8 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-mono-charcoal mb-1">Review submitted!</h3>
          <p className="text-sm text-mono-stone">Thank you for sharing your experience.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-white rounded-2xl border border-border shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-mono-charcoal">Write a review</h3>
            <p className="text-xs text-mono-stone mt-0.5 truncate max-w-[280px]">{productName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-mono-sand/40 transition-colors">
            <X className="h-4 w-4 text-mono-stone" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Order selector — shown only when coming from the product page */}
          {orderOptions && orderOptions.length > 1 && (
            <div>
              <label className="text-sm font-medium text-mono-charcoal mb-2 block">Select order</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-mono-cream/40 px-4 py-2.5 text-sm text-mono-charcoal focus:outline-none focus:ring-2 focus:ring-mono-terracotta/30"
              >
                {orderOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Star rating */}
          <div>
            <p className="text-sm font-medium text-mono-charcoal mb-2">Your rating <span className="text-mono-terracotta">*</span></p>
            <div className="flex gap-1.5" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  className="focus:outline-none"
                  aria-label={`${s} star${s !== 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      s <= displayRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-mono-sand text-mono-sand hover:fill-amber-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-xs text-mono-stone mt-1.5">
                {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][displayRating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-mono-charcoal mb-2 block">
              Your review <span className="text-mono-stone font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Share your experience with this product — fit, quality, comfort…"
              className="w-full rounded-xl border border-border bg-mono-cream/40 px-4 py-3 text-sm text-mono-charcoal placeholder:text-mono-stone/60 resize-none focus:outline-none focus:ring-2 focus:ring-mono-terracotta/30 focus:border-mono-terracotta/40"
            />
            <p className="text-xs text-mono-stone/60 text-right mt-1">{comment.length}/1000</p>
          </div>

          {/* Image upload */}
          <div>
            <p className="text-sm font-medium text-mono-charcoal mb-2">
              Photos <span className="text-mono-stone font-normal">(optional, up to {MAX_IMAGES})</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <AnimatePresence>
                {imageFiles.map((entry, idx) => (
                  <motion.div
                    key={entry.preview}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative w-20 h-20 rounded-xl border border-border overflow-hidden shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.preview} alt="" className="w-full h-full object-cover" />
                    {uploadingIdx.has(idx) && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}
                    {!uploadingIdx.has(idx) && (
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    )}
                    {!uploadingIdx.has(idx) && !uploadedUrls[idx] && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 flex items-center justify-center py-0.5">
                        <ImageOff className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {imageFiles.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-mono-terracotta/50 hover:bg-mono-cream/60 transition-colors flex flex-col items-center justify-center gap-1 shrink-0"
                >
                  <Upload className="h-5 w-5 text-mono-stone" />
                  <span className="text-[10px] text-mono-stone">Add photo</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-mono-stone/60 mt-2">JPEG, PNG, WebP · max 5 MB each</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border bg-mono-cream/30">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-full bg-mono-charcoal hover:bg-mono-charcoal/90 text-white"
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || uploadingIdx.size > 0}
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : 'Submit review'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
