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
  Check
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
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-24 bg-slate-200 rounded-lg" />
            <div className="h-12 bg-slate-200 rounded-xl" />
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
        <Link to="/buy" className="px-5 py-2.5 bg-campus-primary text-white text-sm font-bold rounded-xl">
          Return to Buy Page
        </Link>
      </div>
    );
  }

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const galleryImages = product
    ? (product.images && product.images.length > 0 ? product.images : [product.image_url])
    : [];

  const isAvailable = Boolean(product?.is_available);
  const collegeName = product?.college_code || (user ? user.college.code : 'Your Campus');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <Link
        to="/buy"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-campus-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campus Catalog</span>
      </Link>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 text-emerald-900 shadow-sm animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Request Submitted Successfully!</h3>
            <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
              {successMessage}
            </p>
            <div className="mt-3 flex gap-3">
              <Link to="/profile" className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900">
                View in My Profile
              </Link>
              <Link to="/buy" className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900">
                Explore More Products
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Product Showcase Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
        
        {/* Product Gallery Showcase */}
        <div className="flex flex-col bg-slate-100 border-b md:border-b-0 md:border-r border-slate-200/80">
          <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-slate-900/5">
            <img
              src={galleryImages[activeImageIndex] || product?.image_url}
              alt={product?.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/95 text-campus-dark shadow-sm border border-slate-200/50">
                {product?.category}
              </span>
            </div>

            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">
                {activeImageIndex + 1} / {galleryImages.length} Photos
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {galleryImages.length > 1 && (
            <div className="p-3 bg-white flex items-center gap-2 overflow-x-auto border-t border-slate-200">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-campus-primary ring-2 ring-campus-primary/30 scale-95'
                      : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="p-6 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Campus Availability Badge */}
            <div>
              {isAvailable ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>✓ Available at {collegeName}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Currently unavailable at {collegeName}</span>
                </div>
              )}
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-xs">
                Inspected Good Condition
              </span>
            </div>

            {/* Selling Price */}
            <div className="py-4 px-5 rounded-2xl bg-[#F8FAF9] border border-slate-200/60 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                  Campus Verified Price
                </span>
                <span className="text-3xl font-extrabold text-campus-dark">
                  ₹{product.sell_price.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Admin-fixed • No haggling
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-campus-primary shrink-0" />
                <span>Handover location: Inside {collegeName} campus premises.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-campus-primary shrink-0" />
                <span>Zero online prepayment required for requests.</span>
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div className="pt-8">
            {isAvailable ? (
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                  } else {
                    setShowModal(true);
                  }
                }}
                className="w-full py-4 px-6 rounded-2xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-base shadow-hero hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
                className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Notify / Request Interest</span>
              </button>
            )}

            {!user && (
              <p className="text-center text-xs text-slate-400 mt-2">
                You will be asked to log in to associate your verified college account.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Buy Request Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <h3 className="text-xl font-bold text-campus-dark mb-2">
              {isAvailable ? 'Confirm Purchase Request' : 'Request Item Availability'}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              Your request will be bound to your verified college (<strong className="text-campus-dark">{user?.college.code}</strong>). Our campus coordinators will contact you via WhatsApp / phone to schedule campus handover.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleBuySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional note / Preferred time or campus building:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Can collect near Library between 2 PM and 4 PM"
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary resize-none"
                />
              </div>

              <div className="p-3 bg-campus-soft/50 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="flex justify-between font-semibold text-campus-dark">
                  <span>Product:</span>
                  <span>{product.name}</span>
                </div>
                <div className="flex justify-between font-bold text-campus-primary text-sm">
                  <span>Pay on Pickup:</span>
                  <span>₹{product.sell_price}</span>
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
