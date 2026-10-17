import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Product } from '../services/api';

interface ProductCardProps {
  product: Product;
  userCollegeCode?: string | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, userCollegeCode }) => {
  const isAvailable = Boolean(product.is_available);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm border border-slate-200/50">
            {product.category}
          </span>
        </div>

        {/* Dynamic Campus Availability Indicator Badge */}
        <div className="absolute bottom-3 left-3 right-3">
          {isAvailable ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/90 backdrop-blur-md text-white font-medium text-xs shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />
              <span className="font-semibold truncate">
                Available on your campus {userCollegeCode ? `(${userCollegeCode})` : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md text-slate-200 font-medium text-xs shadow-md">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate">
                Unavailable at {userCollegeCode || 'your college'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg group-hover:text-campus-primary transition-colors leading-snug line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Fixed Price</span>
            <span className="text-xl font-extrabold text-campus-dark">
              ₹{product.sell_price.toLocaleString('en-IN')}
            </span>
          </div>

          <Link
            to={`/buy/${product.id}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              isAvailable
                ? 'bg-campus-primary hover:bg-campus-primary-hover text-white shadow-campus-primary/25 hover:shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{isAvailable ? 'View Product' : 'Request Interest'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
