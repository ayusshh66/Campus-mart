import React, { useEffect, useState } from 'react';
import { api, Product } from '../../services/api';
import { Flame, CheckCircle, PauseCircle, PlayCircle, AlertCircle } from 'lucide-react';

export const AdminBuyingQueue: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggle = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await api.admin.updateProduct(product.id, {
        is_buying_enabled: !product.is_buying_enabled,
      });
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update buying status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-campus-primary uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4 text-emerald-500" />
          <span>Demand Control</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          WE ARE BUYING QUEUE
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Control which items CampusMart is actively accepting from students with one-click toggles.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const isBuying = product.is_buying_enabled;

            return (
              <div
                key={product.id}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  isBuying
                    ? 'bg-white border-emerald-200 shadow-card hover:shadow-card-hover'
                    : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                    />
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isBuying ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {product.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 line-clamp-1 mb-1">
                    {product.name}
                  </h3>

                  <div className="text-xs text-slate-500 mb-3">
                    We'll pay students: <strong className="text-campus-dark text-sm font-extrabold">₹{product.buy_price}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold mb-6">
                    {isBuying ? (
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        🟢 Currently accepting sell requests
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        ⚪ Paused / Not accepting items
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(product)}
                  disabled={togglingId === product.id}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isBuying
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-campus-primary hover:bg-campus-primary-hover text-white shadow-campus-primary/20'
                  }`}
                >
                  {isBuying ? (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      <span>{togglingId === product.id ? 'Updating...' : 'Stop Buying'}</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>{togglingId === product.id ? 'Updating...' : 'Start Buying'}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
