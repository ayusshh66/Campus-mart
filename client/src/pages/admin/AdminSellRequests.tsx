import React, { useEffect, useState } from 'react';
import { api, SellRequestItem } from '../../services/api';
import { CheckCircle, XCircle, MapPin, Tag, AlertCircle, Eye, Phone, Mail } from 'lucide-react';

interface Props {
  onAction?: () => void;
}

export const AdminSellRequests: React.FC<Props> = ({ onAction }) => {
  const [requests, setRequests] = useState<SellRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [pricingDrafts, setPricingDrafts] = useState<Record<string, { buy: number; sell: number }>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getSellRequests(filter === 'PENDING' ? 'PENDING' : undefined);
      setRequests(data);

      // Initialize pricing drafts with current prices
      const drafts: Record<string, { buy: number; sell: number }> = {};
      data.forEach((r) => {
        drafts[r.id] = {
          buy: r.admin_buy_price || 0,
          sell: r.admin_sell_price || 0,
        };
      });
      setPricingDrafts(drafts);
    } catch (err) {
      console.error('Failed to fetch sell requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    setMessage(null);
    try {
      const draft = pricingDrafts[id];
      const res = await api.admin.reviewSellRequest(id, status, draft?.buy, draft?.sell);
      setMessage(`Success: Request marked as ${status}. Product availability for that college updated dynamically!`);
      await fetchRequests();
      if (onAction) onAction();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePriceChange = (id: string, field: 'buy' | 'sell', val: number) => {
    setPricingDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filter and Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Review Submitted Sell Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Approving an item locks the pricing and makes the product available for that student's college.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'PENDING' ? 'bg-white text-campus-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending Only
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-white text-campus-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Submissions
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No {filter === 'PENDING' ? 'Pending' : ''} Sell Requests</h3>
          <p className="text-xs text-slate-500 mt-1">There are currently no items waiting for admin approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {requests.map((item) => {
            const draft = pricingDrafts[item.id] || { buy: item.admin_buy_price, sell: item.admin_sell_price || 0 };

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Product & Student info */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Photo preview */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={item.images?.[0] || item.product_image || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=400&q=80'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-bold">
                      {item.condition}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                        {item.product_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Student & College */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">{item.student_name}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-campus-primary">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.college_code} ({item.college_name})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {item.student_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {item.student_email}
                      </span>
                    </div>

                    {/* Student uploaded photos */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Photos ({item.images.length}):</span>
                        <div className="flex gap-1.5">
                          {item.images.map((img, iIdx) => (
                            <a
                              key={iIdx}
                              href={img}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:border-campus-primary"
                              title="Click to view full photo"
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quality Assessment Answers */}
                    {item.quality_answers && Object.keys(item.quality_answers).length > 0 && (
                      <div className="p-2.5 bg-campus-soft/50 rounded-xl border border-campus-primary/20 text-[11px] space-y-1">
                        <span className="font-bold text-campus-dark block text-[10px] uppercase tracking-wider">
                          Student Quality Assessment (Calculated: ₹{item.estimated_price || item.admin_buy_price}):
                        </span>
                        {Object.entries(item.quality_answers).map(([key, ans], aIdx) => (
                          <div key={aIdx} className="text-slate-700 flex items-center gap-1">
                            <span className="text-campus-primary font-bold">•</span>
                            <span>{ans}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.description && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
                        "{item.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Pricing Controls & Approve/Reject */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  
                  {/* Buying Price Input */}
                  <div className="bg-[#F8FAF9] p-3 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Buying Price (Pay Student)
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={draft.buy}
                        onChange={(e) => handlePriceChange(item.id, 'buy', parseFloat(e.target.value) || 0)}
                        className="w-24 text-sm font-extrabold text-campus-dark bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-campus-primary"
                      />
                    </div>
                  </div>

                  {/* Selling Price Input */}
                  <div className="bg-[#F8FAF9] p-3 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Selling Price (Buyer Pays)
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={draft.sell}
                        onChange={(e) => handlePriceChange(item.id, 'sell', parseFloat(e.target.value) || 0)}
                        className="w-24 text-sm font-extrabold text-campus-dark bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-campus-primary"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    {item.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleReview(item.id, 'APPROVED')}
                        disabled={processingId === item.id}
                        className="px-4 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    )}

                    {item.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleReview(item.id, 'REJECTED')}
                        disabled={processingId === item.id}
                        className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
