import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, AdminStats } from '../../services/api';
import { AdminSellRequests } from './AdminSellRequests';
import { AdminProducts } from './AdminProducts';
import { AdminBuyingQueue } from './AdminBuyingQueue';
import { AdminBuyRequests } from './AdminBuyRequests';
import { AdminCampusHeroes } from './AdminCampusHeroes';
import { AdminAutoMatching } from './AdminAutoMatching';
import { 
  Users, 
  Tag, 
  ShoppingBag, 
  Package, 
  ShieldCheck, 
  ShieldAlert, 
  PlusCircle, 
  Flame,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  Truck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Department mode: 'sell-dept' (Seller Operations), 'buy-dept' (Buyer Operations), 'catalog-dept' (Catalog & Heroes)
  const currentDept = searchParams.get('dept') || 'sell-dept';
  const tab = searchParams.get('tab') || (currentDept === 'buy-dept' ? 'buy-requests' : currentDept === 'catalog-dept' ? 'products' : 'sell-requests');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await api.admin.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate, tab]);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const setDepartment = (dept: 'sell-dept' | 'buy-dept' | 'catalog-dept' | 'automatch-dept', defaultTab: string) => {
    setSearchParams({ dept, tab: defaultTab });
  };

  const setTab = (newTab: string) => {
    setSearchParams({ dept: currentDept, tab: newTab });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>CampusMart Admin Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Separate departments for Seller Acquisitions, Buyer Fulfillment, Catalog Management, and Auto-Matching Hero Dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchParams({ dept: 'catalog-dept', tab: 'add-product' });
            }}
            className="px-4 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Catalog Product</span>
          </button>
        </div>
      </div>

      {/* TOP-LEVEL DEPARTMENT SELECTOR */}
      <div className="my-6 p-1.5 bg-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-stretch gap-1">
        
        {/* Department 1: SELLER OPERATIONS */}
        <button
          onClick={() => setDepartment('sell-dept', 'sell-requests')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            currentDept === 'sell-dept'
              ? 'bg-white text-campus-dark shadow-sm ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Tag className="w-4 h-4 text-emerald-600" />
          <span>Seller Operations</span>
          {stats && stats.pendingSellRequests > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
              {stats.pendingSellRequests} pending
            </span>
          )}
        </button>

        {/* Department 2: BUYER OPERATIONS */}
        <button
          onClick={() => setDepartment('buy-dept', 'buy-requests')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            currentDept === 'buy-dept'
              ? 'bg-white text-campus-dark shadow-sm ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-purple-600" />
          <span>Buyer Operations</span>
          {stats && stats.pendingBuyRequests > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">
              {stats.pendingBuyRequests} new
            </span>
          )}
        </button>

        {/* Department 3: CATALOG & HEROES */}
        <button
          onClick={() => setDepartment('catalog-dept', 'products')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            currentDept === 'catalog-dept'
              ? 'bg-white text-campus-dark shadow-sm ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Catalog & Heroes</span>
          {stats && stats.pendingHeroApplications > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">
              {stats.pendingHeroApplications}
            </span>
          )}
        </button>

        {/* Department 4: AUTO-MATCHING & HERO DISPATCH */}
        <button
          onClick={() => setDepartment('automatch-dept', 'automatch')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            currentDept === 'automatch-dept'
              ? 'bg-white text-campus-dark shadow-sm ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Auto-Match & Hero Ops</span>
        </button>

      </div>

      {/* DEPARTMENT-SPECIFIC METRIC CARDS & NAVIGATION */}

      {/* 1. SELLER OPERATIONS VIEW */}
      {currentDept === 'sell-dept' && (
        <div className="space-y-6">
          {/* Seller Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-800 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Total Sell Submissions</span>
                <Tag className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-950">
                {loading ? '...' : stats?.totalSellRequests || 0}
              </div>
              <span className="text-[11px] text-emerald-700">Items submitted by college students</span>
            </div>

            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between text-amber-800 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Pending Seller Reviews</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-amber-950">
                {loading ? '...' : stats?.pendingSellRequests || 0}
              </div>
              <span className="text-[11px] text-amber-700">Awaiting inspection & price lock</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Active Buying Items</span>
                <Flame className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {loading ? '...' : stats?.activeProducts || 0}
              </div>
              <span className="text-[11px] text-slate-500">Products with "We Are Buying" enabled</span>
            </div>
          </div>

          {/* Sub-tabs for Seller Operations */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setTab('sell-requests')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                tab === 'sell-requests'
                  ? 'bg-campus-dark text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending Sell Requests ({stats?.pendingSellRequests || 0})</span>
            </button>

            <button
              onClick={() => setTab('buying-queue')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                tab === 'buying-queue'
                  ? 'bg-campus-dark text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>"We Are Buying" Acquisition Queue</span>
            </button>
          </div>

          {tab === 'sell-requests' && <AdminSellRequests onAction={() => setStats(null)} />}
          {tab === 'buying-queue' && <AdminBuyingQueue />}
        </div>
      )}

      {/* 2. BUYER OPERATIONS VIEW */}
      {currentDept === 'buy-dept' && (
        <div className="space-y-6">
          {/* Buyer Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between text-purple-800 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Total Purchase Inquiries</span>
                <ShoppingBag className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold text-purple-950">
                {loading ? '...' : stats?.totalBuyRequests || 0}
              </div>
              <span className="text-[11px] text-purple-700">Total student buy requests placed</span>
            </div>

            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between text-amber-800 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Pending Orders To Fulfill</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-amber-950">
                {loading ? '...' : stats?.pendingBuyRequests || 0}
              </div>
              <span className="text-[11px] text-amber-700">Requires campus coordinator handover</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Registered Students</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {loading ? '...' : stats?.totalStudents || 0}
              </div>
              <span className="text-[11px] text-slate-500">Active campus student pool</span>
            </div>
          </div>

          {/* Sub-tabs for Buyer Operations */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setTab('buy-requests')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                tab === 'buy-requests'
                  ? 'bg-campus-dark text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buyer Purchase Orders & Demand Queue</span>
            </button>
          </div>

          <AdminBuyRequests />
        </div>
      )}

      {/* 3. CATALOG & CAMPUS HEROES VIEW */}
      {currentDept === 'catalog-dept' && (
        <div className="space-y-6">
          {/* Catalog & Hero Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between text-blue-800 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Catalog Products</span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-blue-950">
                {loading ? '...' : stats?.activeProducts || 0}
              </div>
              <span className="text-[11px] text-blue-700">Admin-controlled product catalog</span>
            </div>

            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-800 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Campus Hero Applicants</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-950 flex items-baseline gap-2">
                <span>{loading ? '...' : stats?.totalHeroApplications || 0}</span>
                {stats && stats.pendingHeroApplications > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {stats.pendingHeroApplications} new
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-700">Student ambassador applications</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
                <span>Total Students</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {loading ? '...' : stats?.totalStudents || 0}
              </div>
              <span className="text-[11px] text-slate-500">Across BPIT, MAIT, MSIT, USAR</span>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-bold">
            <button
              onClick={() => setTab('products')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                tab === 'products'
                  ? 'bg-campus-dark text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Catalog</span>
            </button>

            <button
              onClick={() => setTab('heroes')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                tab === 'heroes'
                  ? 'bg-campus-dark text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Hero Applications ({stats?.pendingHeroApplications || 0})</span>
            </button>
          </div>

          {tab === 'products' && <AdminProducts onAddClick={() => setTab('add-product')} />}
          {tab === 'add-product' && <AdminProducts onAddClick={() => {}} forceNewForm={true} onSaved={() => setTab('products')} />}
          {tab === 'heroes' && <AdminCampusHeroes />}
        </div>
      )}

      {/* 4. AUTO-MATCHING & HERO DISPATCH OPERATIONS */}
      {currentDept === 'automatch-dept' && (
        <AdminAutoMatching />
      )}

    </div>
  );
};
