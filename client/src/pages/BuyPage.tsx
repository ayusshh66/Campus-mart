import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Product, College } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { ShoppingBag, MapPin, Tag, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

export const BuyPage: React.FC = () => {
  const { user, selectedCollegeId, setSelectedCollegeId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'available'>('all');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const [collegesRes, productsRes] = await Promise.all([
          api.getColleges(),
          api.getProducts(selectedCollegeId || undefined),
        ]);
        setColleges(collegesRes);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCollegeId, user]);

  const activeCollege = user
    ? user.college
    : colleges.find((c) => c.id === selectedCollegeId) || colleges[0];

  const filteredProducts = products.filter((p) => {
    if (filter === 'available') return p.is_available;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200/80 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-soft border border-campus-primary/30 text-campus-dark text-xs font-semibold mb-2">
            <MapPin className="w-3.5 h-3.5 text-campus-primary" />
            <span>Campus Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-campus-dark tracking-tight">
            Buy Essentials on Campus
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Displaying student recommerce items verified for{' '}
            <span className="font-bold text-campus-dark">
              {activeCollege?.code || 'your college'}
            </span>
            .
          </p>
        </div>

        {/* College switcher for guest or filters */}
        <div className="flex flex-wrap items-center gap-3">
          {!user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
              <span className="text-slate-400">Campus:</span>
              <select
                value={selectedCollegeId || (colleges[0]?.id || '')}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="bg-transparent font-bold text-campus-primary focus:outline-none cursor-pointer"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Filter buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-campus-dark shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filter === 'available'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Available on Campus</span>
            </button>
          </div>
        </div>
      </div>

      {/* College Availability Banner */}
      <div className="mt-6 mb-8 p-4 rounded-2xl bg-campus-soft/50 border border-campus-light flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-campus-primary shrink-0" />
          <span className="text-slate-700">
            Current College: <strong className="text-campus-dark">{activeCollege?.name || activeCollege?.code}</strong>
          </span>
        </div>
        <span className="hidden sm:inline text-xs text-slate-500">
          Availability is dynamically updated when approved student items are listed.
        </span>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Nothing available on your campus yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Be the first student to sell this item and help your peers while earning cash.
          </p>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs shadow-md shadow-campus-primary/20 transition-all"
          >
            <Tag className="w-4 h-4" />
            <span>Sell an Item</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              userCollegeCode={activeCollege?.code}
            />
          ))}
        </div>
      )}
    </div>
  );
};
