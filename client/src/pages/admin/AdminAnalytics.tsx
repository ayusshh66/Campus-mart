import React, { useEffect, useState } from 'react';
import { api, AdminAnalyticsData } from '../../services/api';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Tag,
  Package,
  Building2,
  Truck,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  Banknote,
  Activity
} from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compute real-time platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="h-8 w-60 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 space-y-3">
        <p className="font-bold text-sm">{error || 'Could not load analytics.'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow hover:bg-rose-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, financials, categoryBreakdown, collegeBreakdown } = data;

  return (
    <div className="space-y-8">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real Database Metrics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform Analytics & Financials
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics across peer-to-peer trades, campus coordinator deliveries, and category demand.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* TOP 4 KEY PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV Volume */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3 text-emerald-100 text-xs font-bold uppercase tracking-wider">
            <span>Platform Trade Volume</span>
            <Banknote className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-3xl font-black tracking-tight">
            ₹{financials.totalEstimatedVolume.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-100 mt-2 flex items-center gap-2">
            <span>Approved: ₹{financials.approvedSellValue.toLocaleString('en-IN')}</span>
            <span>•</span>
            <span>Sales: ₹{financials.completedBuyValue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Student Community */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Community Members</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalUsers}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <span className="text-blue-600 font-bold">{summary.studentUsers} Students</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{summary.heroUsers} Heroes</span>
            <span>•</span>
            <span className="text-purple-600 font-bold">{summary.adminUsers} Admins</span>
          </div>
        </div>

        {/* Catalog & Inventory */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Catalog Items</span>
            <Package className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalProducts}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <span className="text-emerald-600 font-bold">{summary.activeProducts} Active in Buying</span>
            <span>•</span>
            <span>{summary.totalColleges} Campuses</span>
          </div>
        </div>

        {/* Deliveries & Fulfillment */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Campus Deliveries</span>
            <Truck className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalDeliveryTasks}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <span className="text-emerald-600 font-bold">{summary.deliveredTasks} Completed</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">{summary.claimedTasks + summary.pickedUpTasks} In-Transit</span>
          </div>
        </div>
      </div>

      {/* OPERATIONAL QUEUE STATUS STRIP */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Pending Operations Awaiting Action
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="text-2xl font-black text-slate-900">{summary.pendingSellRequests}</div>
            <div className="text-xs font-bold text-emerald-800 mt-0.5">Catalog Sell Requests</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Awaiting price lock</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="text-2xl font-black text-slate-900">{summary.pendingCustomSubmissions}</div>
            <div className="text-xs font-bold text-purple-800 mt-0.5">Custom Item Queue</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Unlisted gear approval</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="text-2xl font-black text-slate-900">{summary.pendingBuyRequests}</div>
            <div className="text-xs font-bold text-indigo-800 mt-0.5">Buyer Inquiries</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Orders to match & assign</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="text-2xl font-black text-slate-900">{summary.pendingHeroApps}</div>
            <div className="text-xs font-bold text-amber-800 mt-0.5">Hero Applications</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Student ambassadors</div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN BREAKDOWNS: COLLEGES & CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* College Distribution Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-campus-primary" />
              <h3 className="font-extrabold text-sm text-slate-900">Campus Activity Distribution</h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">{collegeBreakdown.length} Campuses</span>
          </div>

          <div className="space-y-3">
            {collegeBreakdown.map((c) => {
              const maxUsers = Math.max(...collegeBreakdown.map((col) => col.users), 1);
              const percentage = Math.round((c.users / maxUsers) * 100);

              return (
                <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{c.code}</span>
                      <span className="text-slate-500 font-medium truncate max-w-[180px]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-bold text-slate-600 text-[11px]">
                      <span>{c.users} users</span>
                      <span className="text-emerald-600">{c.sellRequests} sells</span>
                      <span className="text-purple-600">{c.buyRequests} buys</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-campus-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Top Categories by Demand</h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.map((cat) => {
              const totalTrades = cat.sellCount + cat.buyCount;
              return (
                <div key={cat.category} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">{cat.category}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {cat.productCount} products in catalog ({cat.activeProductCount} active)
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">{totalTrades} Total Trades</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      <span className="text-emerald-600 font-bold">{cat.sellCount} submitted</span> • <span className="text-purple-600 font-bold">{cat.buyCount} requested</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
