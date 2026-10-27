import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Product } from '../services/api';
import { resolveProductImageUrl, handleImageError, DEFAULT_FALLBACK_IMAGE } from '../utils/imageUtils';
import { 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  ArrowLeft, 
  ShoppingBag, 
  ShieldCheck, 
  Clock, 
  Check,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Banknote,
  Truck
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, selectedCollegeId } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const data = await api.getProductById(productId, selectedCollegeId || undefined);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, selectedCollegeId, user]);

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitBuyRequest({
        product_id: product.id,
        notes,
        college_id: product.college_id || undefined,
      });
      setSuccessMessage(res.message);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit buy request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-white rounded-[28px] border border-slate-200 animate-shimmer" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 bg-white rounded-full w-3/4 animate-shimmer" />
            <div className="h-4 bg-white rounded-full w-1/2 animate-shimmer" />
            <div className="h-28 bg-white rounded-[28px] animate-shimmer" />
            <div className="h-14 bg-white rounded-full animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#12160F] text-stone-400 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Product Not Found</h2>
        <p className="text-stone-400 text-[13px] mt-1 mb-6">The product you are looking for does not exist or has been archived.</p>
        <Link to="/buy" className="px-5 py-2.5 bg-[#C6DE41] text-[#090B09] text-[13px] font-bold rounded-full shadow-[0_0_15px_rgba(198,222,65,0.25)] hover:bg-[#D7EF59] transition-all">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const rawImages = product.images;
  const imageList: string[] = Array.isArray(rawImages)
    ? rawImages
    : typeof rawImages === 'string'
    ? (() => {
        try {
          return JSON.parse(rawImages);
        } catch {
          return [];
        }
      })()
    : [];

  const rawGallery =
    imageList.length > 0
      ? imageList
      : product.image_url
      ? [product.image_url]
      : [];

  const galleryImages = rawGallery.length > 0
    ? rawGallery.map((img) => resolveProductImageUrl(img))
    : [DEFAULT_FALLBACK_IMAGE];

  const isAvailable = Boolean(product.is_available);
  const collegeName = product.college_code || (user ? user.college.code : 'Your Campus');

  // Retail comparison
  const estimatedOriginalPrice = Math.round(product.sell_price * 1.45);
  const savings = Math.round(((estimatedOriginalPrice - product.sell_price) / estimatedOriginalPrice) * 100);

  return (
    <div className="min-h-screen bg-[#090B09] text-white py-8 sm:py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6">
      
      {/* Back button */}
      <div>
        <Link
          to="/buy"
          className="inline-flex items-center gap-2 text-[12px] font-medium text-zinc-400 hover:text-[#C6DE41] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-5 bg-[#12160F] border border-[#C6DE41]/40 rounded-[28px] flex items-start gap-4 text-white shadow-lg animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-[#C6DE41] text-[#090B09] flex items-center justify-center shrink-0 font-bold">
            <Check className="w-4 h-4 text-[#090B09]" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] tracking-tight text-white">Request Submitted Successfully!</h3>
            <p className="text-[13px] text-zinc-300 mt-0.5 leading-relaxed">
              {successMessage}
            </p>
            <div className="mt-3 flex gap-4 text-[12px] font-medium">
              <Link to="/profile" className="text-[#C6DE41] underline hover:text-[#D7EF59]">
                View in My Profile
              </Link>
              <Link to="/buy" className="text-[#C6DE41] underline hover:text-[#D7EF59]">
                Browse More Gear
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Product Showcase Card */}
      <div className="bg-[#12160F] rounded-[28px] border border-[#C6DE41]/25 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Gallery Column (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col bg-[#181D14] border-b lg:border-b-0 lg:border-r border-white/10 p-4 sm:p-6 justify-between">
          
          {/* Main Photo with 20px radius */}
          <div className="relative aspect-square w-full rounded-[20px] overflow-hidden bg-[#090B09] shadow-sm flex items-center justify-center group border border-white/10">
            <img
              src={galleryImages[activeImageIndex] || DEFAULT_FALLBACK_IMAGE}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              onError={handleImageError}
            />

            {/* Category tag */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 text-[11px] font-semibold tracking-tight rounded-full bg-[#090B09]/90 text-white shadow-sm backdrop-blur-sm border border-[#C6DE41]/30">
                {product.category}
              </span>
            </div>

            {/* Click to zoom lightbox trigger */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#12160F]/90 hover:bg-[#181D14] text-white shadow-sm backdrop-blur-sm transition-all border border-white/20 hover:border-[#C6DE41]"
              title="Click to enlarge image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Photo Counter Pill */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/75 text-white text-[11px] font-medium backdrop-blur-sm flex items-center gap-1.5 border border-white/15">
                <Layers className="w-3.5 h-3.5" />
                <span>{activeImageIndex + 1} of {galleryImages.length}</span>
              </div>
            )}
          </div>

          {/* Mini Thumbnail Strip (Shop Style) */}
          {galleryImages.length > 1 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pt-2">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-[12px] overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#C6DE41] ring-2 ring-[#C6DE41]/30 scale-95 shadow-sm'
                      : 'border-white/15 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" onError={handleImageError} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions Column (5 cols on lg) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            
            {/* Campus Availability Status Ribbon */}
            <div>
              {isAvailable ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6DE41]/15 border border-[#C6DE41]/30 text-[#C6DE41] text-[12px] font-semibold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#C6DE41] animate-pulse shadow-[0_0_6px_#C6DE41]" />
                  <span>In Stock at {collegeName}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/30 border border-amber-500/40 text-amber-300 text-[12px] font-medium shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Waitlist at {collegeName}</span>
                </div>
              )}
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                {product.name}
              </h1>
              <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed tracking-tight">
                {product.description}
              </p>
            </div>

            {/* Transparent Valuation Card */}
            <div className="p-5 rounded-[20px] bg-[#181D14] border border-[#C6DE41]/20">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block mb-1">
                Admin Fixed Fair Price
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  ₹{product.sell_price.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-zinc-500 line-through">
                  ₹{estimatedOriginalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-[#C6DE41] bg-[#C6DE41]/15 border border-[#C6DE41]/30 px-2 py-0.5 rounded-full">
                  Save {savings}%
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 mt-2 font-normal leading-relaxed">
                Zero haggling. Pay via UPI or cash directly upon inspection on campus.
              </p>
            </div>

            {/* Inspection Checklist Card */}
            <div className="p-4 rounded-[20px] border border-white/10 bg-[#181D14] space-y-2.5">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-white pb-2 border-b border-white/10">
                <ShieldCheck className="w-4 h-4 text-[#C6DE41]" />
                <span>Verified Diagnostic Inspection</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C6DE41] shrink-0" />
                  <span>Enclosure: Intact</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C6DE41] shrink-0" />
                  <span>Buttons: 100% Tested</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C6DE41] shrink-0" />
                  <span>Display: Clear</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C6DE41] shrink-0" />
                  <span>Power: Operational</span>
                </div>
              </div>
            </div>

            {/* Handover Details */}
            <div className="space-y-2 text-[12px] text-zinc-400 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C6DE41] shrink-0" />
                <span>Handover inside <strong className="text-white">{collegeName}</strong> library or canteen.</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C6DE41] shrink-0" />
                <span>Supervised by student Campus Heroes.</span>
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-white/10">
            {isAvailable ? (
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                  } else {
                    setShowModal(true);
                  }
                }}
                className="w-full py-4 px-6 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[14px] shadow-[0_0_15px_rgba(198,222,65,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#090B09]" />
                <span>Request to Buy (₹{product.sell_price})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                  } else {
                    setShowModal(true);
                  }
                }}
                className="w-full py-4 px-6 rounded-full bg-[#181D14] hover:bg-[#222A1C] text-white border border-white/20 font-semibold text-[14px] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Notify / Request Item</span>
              </button>
            )}

            {!user && (
              <p className="text-center text-[11px] text-zinc-400 mt-2">
                Student login required to coordinate verified on-campus delivery.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                className="absolute left-4 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={galleryImages[activeImageIndex] || DEFAULT_FALLBACK_IMAGE}
              alt="Enlarged preview"
              className="max-w-full max-h-[80vh] object-contain rounded-[20px]"
              onError={handleImageError}
            />
            <div className="text-white text-[12px] font-medium mt-3">
              Photo {activeImageIndex + 1} of {galleryImages.length} • {product.name}
            </div>
          </div>
        </div>
      )}

      {/* Buy Request Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12160F] rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#C6DE41]/30 relative text-white">
            <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
              {isAvailable ? 'Confirm Campus Purchase' : 'Request Item Availability'}
            </h3>
            
            <p className="text-[12px] text-zinc-400 mb-4 leading-relaxed tracking-tight">
              Your request will be linked to your verified account at <strong className="text-white">{user?.college.code}</strong>. A Campus Hero will coordinate delivery at your preferred spot.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-[16px] bg-rose-900/30 border border-rose-500/40 text-rose-300 text-[12px] font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleBuySubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-white mb-1">
                  Optional notes / Preferred meetup spot:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. In canteen block after 1 PM or near main library"
                  className="w-full p-3 text-[13px] rounded-[16px] border border-white/20 bg-[#090B09] text-white focus:outline-none focus:border-[#C6DE41] resize-none"
                />
              </div>

              <div className="p-3.5 bg-[#181D14] rounded-[16px] text-[12px] space-y-1.5 border border-white/10">
                <div className="flex justify-between font-medium text-white">
                  <span>Product:</span>
                  <span className="font-semibold text-white truncate max-w-[200px]">{product.name}</span>
                </div>
                <div className="flex justify-between font-bold text-[#C6DE41] text-[13px] pt-1 border-t border-white/10">
                  <span>Pay on Handover:</span>
                  <span>₹{product.sell_price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-full border border-white/20 text-zinc-400 hover:text-white font-medium text-[12px] transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[12px] shadow-[0_0_12px_rgba(198,222,65,0.3)] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
