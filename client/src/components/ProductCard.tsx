import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { Product } from '../services/api';
import { resolveProductImageUrl, handleImageError } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  userCollegeCode?: string | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, userCollegeCode }) => {
  const isAvailable = Boolean(product.is_available);

  const primaryImage = resolveProductImageUrl(product.image_url, product.images);

  // Safe images count resolution
  const imageList = Array.isArray(product.images)
    ? product.  images
    : typeof product.images === 'string'
    ? (() => {
        try {
          return JSON.parse(product.images);
        } catch {
          return [];
        }
      })()
    : [];

  const totalPhotos = Math.max(imageList.length, product.image_url ? 1 : 0);

  // Estimate a realistic reference original MRP to highlight recommerce savings
  const estimatedOriginalMrp = Math.round(product.sell_price * 1.45);
  const savingsPercent = Math.round(((estimatedOriginalMrp - product.sell_price) / estimatedOriginalMrp) * 100);

  return (
    <div className="group bg-[#12160F] border border-[#C6DE41]/20 rounded-[28px] p-3 shadow-shop-card hover:shadow-shop-card-hover transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:border-[#C6DE41]/50">
      {/* Product Image Area with 20px radius */}
      <div className="relative aspect-square w-full rounded-[20px] overflow-hidden bg-[#181D14]">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={handleImageError}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 text-[11px] font-semibold tracking-tight rounded-full bg-[#090B09]/90 text-white shadow-shop-pill backdrop-blur-sm border border-[#C6DE41]/30">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            {totalPhotos > 1 && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/75 text-white backdrop-blur-sm flex items-center gap-1 border border-white/15">
                <Layers className="w-3 h-3" />
                <span>{totalPhotos}</span>
              </span>
            )}
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#C6DE41]/20 text-[#C6DE41] shadow-shop-pill backdrop-blur-sm flex items-center gap-0.5 border border-[#C6DE41]/40">
              <ShieldCheck className="w-3 h-3 text-[#C6DE41]" />
              <span>Verified</span>
            </span>
          </div>
        </div>

        {/* Availability tag at bottom inside image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none">
          {isAvailable ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#090B09]/90 backdrop-blur-md text-white text-[11px] font-medium shadow-shop-pill border border-[#C6DE41]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6DE41] animate-pulse shadow-[0_0_6px_#C6DE41]" />
              <span className="truncate">Ready at {userCollegeCode || 'Campus'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-zinc-300 text-[11px] font-normal border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="truncate">Waitlist at {userCollegeCode || 'Campus'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="pt-3 px-1 pb-1 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white text-[15px] group-hover:text-[#C6DE41] transition-colors leading-snug line-clamp-1 tracking-tight">
            {product.name}
          </h3>
          <p className="text-[12px] text-zinc-400 line-clamp-1 mt-0.5 leading-relaxed tracking-tight">
            {product.description}
          </p>
        </div>

        {/* Pricing & Recommerce Savings Indicator */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-bold text-white tracking-tight">
                ₹{product.sell_price.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-zinc-500 line-through">
                ₹{estimatedOriginalMrp.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#C6DE41] bg-[#C6DE41]/15 px-1.5 py-0.2 rounded-full inline-block border border-[#C6DE41]/25">
              Save {savingsPercent}%
            </span>
          </div>

          <Link
            to={`/buy/${product.id}`}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1 shrink-0 ${
              isAvailable
                ? 'bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] shadow-shop-pill shadow-[0_0_12px_rgba(198,222,65,0.25)] hover:scale-105 active:scale-95'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <span>{isAvailable ? 'Buy' : 'View'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

