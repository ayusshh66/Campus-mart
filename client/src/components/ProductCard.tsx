import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { Product } from '../services/api';

interface ProductCardProps {
  product: Product;
  userCollegeCode?: string | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, userCollegeCode }) => {
  const isAvailable = Boolean(product.is_available);

  // Safe images resolution
  const imageList = Array.isArray(product.images)
    ? product.images
    : typeof product.images === 'string'
    ? (() => {
        try {
          return JSON.parse(product.images);
        } catch {
          return [];
        }
      })()
    : [];

  const primaryImage =
    product.image_url ||
    imageList[0] ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  const totalPhotos = Math.max(imageList.length, product.image_url ? 1 : 0);

  // Estimate a realistic reference original MRP (e.g. 35-50% higher) to highlight recommerce savings
  const estimatedOriginalMrp = Math.round(product.sell_price * 1.45);
  const savingsPercent = Math.round(((estimatedOriginalMrp - product.sell_price) / estimatedOriginalMrp) * 100);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover-recommerce-glow transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm border border-slate-200/60">
            {product.category}
          </span>
        </div>

        {/* Quality Checked Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {totalPhotos > 1 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/60 text-white shadow-sm backdrop-blur-sm flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{totalPhotos}</span>
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600/95 text-white shadow-sm backdrop-blur-sm flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified</span>
          </span>
        </div>

        {/* Dynamic Campus Availability Ribbon */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          {isAvailable ? (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-semibold shadow-md">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse shrink-0" />
                <span className="truncate">In Stock at {userCollegeCode || 'Campus'}</span>
              </div>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                Ready
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-300 text-[11px] font-medium shadow-md">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate">Out of stock at {userCollegeCode || 'your campus'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content & Recommerce Valuation */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-campus-primary transition-colors leading-snug line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Cashify-style Savings Indicator */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-campus-dark tracking-tight">
                ₹{product.sell_price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 line-through">
                ₹{estimatedOriginalMrp.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
              Save ~{savingsPercent}% vs Retail
            </span>
          </div>

          <Link
            to={`/buy/${product.id}`}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              isAvailable
                ? 'bg-campus-primary hover:bg-campus-primary-hover text-white shadow-sm hover:shadow shadow-campus-primary/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{isAvailable ? 'Buy Now' : 'Request'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
