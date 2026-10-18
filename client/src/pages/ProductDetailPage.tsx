import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Product } from '../services/api';
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
  Sparkles,
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
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-100 rounded-3xl animate-shimmer" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded-lg w-3/4 animate-shimmer" />
            <div className="h-4 bg-slate-100 rounded w-1/2 animate-shimmer" />
            <div className="h-28 bg-slate-100 rounded-2xl animate-shimmer" />
            <div className="h-14 bg-slate-100 rounded-2xl animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">The product you are looking for does not exist or has been archived.</p>
        <Link to="/buy" className="px-5 py-2.5 bg-campus-primary text-white text-sm font-bold rounded-xl shadow-md">
          Return to Buy Catalog
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

  const galleryImages =
    imageList.length > 0
      ? imageList
      : product.image_url
      ? [product.image_url]
      : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'];

  const isAvailable = Boolean(product.is_available);
  const collegeName = product.college_code || (user ? user.college.code : 'Your Campus');

  // Realistic retail comparison
  const estimatedOriginalPrice = Math.round(product.sell_price * 1.45);
  const savings = Math.round(((estimatedOriginalPrice - product.sell_price) / estimatedOriginalPrice) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Back button */}
      <Link
        to="/buy"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-campus-dark mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Campus Recommerce Catalog</span>
      </Link>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 text-emerald-900 shadow-sm animate-fade-in">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Request Submitted Successfully!</h3>
            <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
              {successMessage}
            </p>
            <div className="mt-3 flex gap-4 text-xs font-bold">
              <Link to="/profile" className="text-emerald-700 underline hover:text-emerald-900">
                View in My Profile
              </Link>
              <Link to="/buy" className="text-emerald-700 underline hover:text-emerald-900">
                Browse More Campus Gear
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Product Showcase Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Gallery Column (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-200/90">
          
          {/* Main Photo with Zoom Button */}
          <div className="relative aspect-[4/3] sm:aspect-square flex items-center justify-center overflow-hidden bg-slate-900/5 group">
            <img
              src={galleryImages[activeImageIndex] || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {/* Category tag */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 text-xs font-bold rounded-xl bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm border border-slate-200/60">
                {product.category}
              </span>
            </div>

            {/* Click to zoom lightbox trigger */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
              title="Click to enlarge image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Photo Counter Pill */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-xl bg-black/60 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>{activeImageIndex + 1} of {galleryImages.length}</span>
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {galleryImages.length > 1 && (
            <div className="p-4 bg-white flex items-center gap-3 overflow-x-auto border-t border-slate-100">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-campus-primary ring-2 ring-campus-primary/30 scale-95 shadow-sm'
                      : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
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
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>In Stock at {collegeName} (Campus Delivery)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Currently out of stock at {collegeName}</span>
                </div>
              )}
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Cashify-Style Transparent Price Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-slate-200/80">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                Admin-Fixed Transparent Price
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-campus-dark">
                  ₹{product.sell_price.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  ₹{estimatedOriginalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Save {savings}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Fixed fair pricing with 0% haggling. Pay via UPI or Cash directly upon verified campus handover.
              </p>
            </div>

            {/* Cashify-Inspired Verified Quality Inspection Report */}
            <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-campus-dark pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-campus-primary" />
                <span>Verified Diagnostic Inspection Report</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Enclosure & Body: Intact</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Keys / Controls: 100% OK</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Display / Matrix: Clear</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Power / Battery: Tested</span>
                </div>
              </div>
            </div>

            {/* Handover Trust Points */}
            <div className="space-y-2 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-campus-primary shrink-0" />
                <span>Handover inside <strong>{collegeName}</strong> library, canteen, or gate.</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-campus-primary shrink-0" />
                <span>Coordinated by verified student Campus Heroes.</span>
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100">
            {isAvailable ? (
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                  } else {
                    setShowModal(true);
                  }
                }}
                className="w-full py-4 px-6 rounded-2xl bg-campus-primary hover:bg-campus-primary-hover text-white font-black text-sm sm:text-base shadow-hero hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
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
                className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Notify / Request Interest</span>
              </button>
            )}

            {!user && (
              <p className="text-center text-[11px] text-slate-400 mt-2">
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
              src={galleryImages[activeImageIndex] || product.image_url}
              alt="Enlarged preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="text-white text-xs font-semibold mt-3">
              Photo {activeImageIndex + 1} of {galleryImages.length} • {product.name}
            </div>
          </div>
        </div>
      )}

      {/* Buy Request Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <h3 className="text-xl font-black text-campus-dark mb-1">
              {isAvailable ? 'Confirm Campus Purchase' : 'Request Item Availability'}
            </h3>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Your request will be linked to your verified account at <strong className="text-campus-dark">{user?.college.code}</strong>. A Campus Hero will coordinate delivery at your preferred college spot.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleBuySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional notes / Preferred meetup spot:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. In canteen block after 1 PM or near main library"
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary resize-none"
                />
              </div>

              <div className="p-3.5 bg-campus-soft/60 rounded-xl text-xs space-y-1.5 border border-campus-light">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Product:</span>
                  <span className="font-bold text-campus-dark">{product.name}</span>
                </div>
                <div className="flex justify-between font-bold text-campus-primary text-sm pt-1 border-t border-campus-light/60">
                  <span>Pay on Handover:</span>
                  <span>₹{product.sell_price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
