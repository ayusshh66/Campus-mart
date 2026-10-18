import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, AdminStats } from '../../services/api';
import { AdminSellRequests } from './AdminSellRequests';
import { AdminProducts } from './AdminProducts';
import { AdminBuyingQueue } from './AdminBuyingQueue';
import { AdminBuyRequests } from './AdminBuyRequests';
import { AdminCampusHeroes } from './AdminCampusHeroes';
import { AdminAutoMatching } from './AdminAutoMatching';
import { AdminColleges } from './AdminColleges';
import { AdminCustomSubmissions } from './AdminCustomSubmissions';
import { AdminTeamModeration } from './AdminTeamModeration';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminAnalytics } from './AdminAnalytics';
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
  Layers,
  Sparkles,
  Truck,
  Building2,
  Activity,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Sliders,
  Award,
  UserCog
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: Support legacy dept query param or modern tab query param
  const currentTab = searchParams.get('tab') || (
    searchParams.get('dept') === 'buy-dept' ? 'buy-requests' :
    searchParams.get('dept') === 'catalog-dept' ? 'products' :
    searchParams.get('dept') === 'automatch-dept' ? 'automatch' :
    'analytics'
  );

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [user, navigate, currentTab]);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const setTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation Items
  const navGroups = [
    {
      group: 'INSIGHTS & OVERVIEW',
      items: [
        {
          id: 'analytics',
          label: 'Platform Analytics',
          icon: Activity,
          badge: null,
          color: 'text-emerald-600',
        },
      ],
    },
    {
      group: 'ACQUISITIONS & INVENTORY',
      items: [
        {
          id: 'sell-requests',
          label: 'Catalog Sell Requests',
          icon: Tag,
          badge: stats && stats.pendingSellRequests > 0 ? `${stats.pendingSellRequests} new` : null,
          badgeColor: 'bg-emerald-100 text-emerald-800',
          color: 'text-emerald-600',
        },
        {
          id: 'custom-submissions',
          label: 'Custom Item Approvals',
          icon: Sparkles,
          badge: stats && (stats.pendingCustomSubmissions ?? 0) > 0 ? `${stats.pendingCustomSubmissions} new` : null,
          badgeColor: 'bg-purple-100 text-purple-800',
          color: 'text-purple-600',
        },
        {
          id: 'buying-queue',
          label: 'Buying Program Queue',
          icon: Flame,
          badge: null,
          color: 'text-amber-600',
        },
        {
          id: 'products',
          label: 'Product Catalog',
          icon: Package,
          badge: stats ? `${stats.activeProducts}` : null,
          badgeColor: 'bg-slate-100 text-slate-700',
          color: 'text-blue-600',
        },
      ],
    },
    {
      group: 'ORDERS & DISPATCH',
      items: [
        {
          id: 'buy-requests',
          label: 'Buyer Orders & Demand',
          icon: ShoppingBag,
          badge: stats && stats.pendingBuyRequests > 0 ? `${stats.pendingBuyRequests} new` : null,
          badgeColor: 'bg-purple-100 text-purple-800',
          color: 'text-purple-600',
        },
        {
          id: 'automatch',
          label: 'Auto-Matching & Dispatch',
          icon: Sliders,
          badge: null,
          color: 'text-indigo-600',
        },
      ],
    },
    {
      group: 'CAMPUSES & COMMUNITY',
      items: [
        {
          id: 'colleges',
          label: 'Campuses & Colleges',
          icon: Building2,
          badge: stats ? `${stats.activeColleges || stats.totalColleges}` : null,
          badgeColor: 'bg-blue-100 text-blue-800',
          color: 'text-blue-600',
        },
        {
          id: 'heroes',
          label: 'Campus Hero Approvals',
          icon: ShieldCheck,
          badge: stats && stats.pendingHeroApplications > 0 ? `${stats.pendingHeroApplications} new` : null,
          badgeColor: 'bg-amber-100 text-amber-800',
          color: 'text-amber-600',
        },
        {
          id: 'teams',
          label: 'Hackathon Teams',
          icon: Award,
          badge: null,
          color: 'text-teal-600',
        },
        {
          id: 'users',
          label: 'User Directory & Roles',
          icon: Users,
          badge: stats ? `${stats.totalStudents}` : null,
          badgeColor: 'bg-slate-100 text-slate-700',
          color: 'text-slate-700',
        },
      ],
    },
  ];

  const totalPendingBadges = (stats?.pendingSellRequests || 0) +
    (stats?.pendingCustomSubmissions || 0) +
    (stats?.pendingBuyRequests || 0) +
    (stats?.pendingHeroApplications || 0);

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      {/* Top Admin Sub-bar */}
      <div className="bg-campus-dark text-white border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-xs tracking-wider uppercase text-emerald-400">
                Admin Console
              </span>
            </div>
            <span className="hidden sm:inline-block text-white/40">•</span>
            <span className="hidden sm:inline-block text-xs text-slate-300 font-medium">
              Signed in as <strong className="text-white font-bold">{user.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {totalPendingBadges > 0 && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" />
                <span>{totalPendingBadges} Items Awaiting Review</span>
              </span>
            )}

            <button
              onClick={() => setTab('add-product')}
              className="px-3.5 py-1.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container: Persistent Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* ======================================================== */}
          {/* SIDEBAR NAVIGATION (Desktop persistent, Mobile drawer)   */}
          {/* ======================================================== */}
          
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs"
            />
          )}

          <aside
            className={`
              fixed lg:static top-14 left-0 bottom-0 z-30 lg:z-auto
              w-72 bg-white rounded-r-3xl lg:rounded-3xl border border-slate-200/90 shadow-sm
              p-5 overflow-y-auto transition-transform duration-200 ease-in-out
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
            style={{ maxHeight: 'calc(100vh - 5rem)' }}
          >
            {/* Sidebar Header */}
            <div className="pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Navigation</h3>
                  <p className="text-[11px] text-slate-500">CampusMart Control Center</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Groups */}
            <div className="space-y-6">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">
                    {group.group}
                  </div>
                  <nav className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id || (item.id === 'products' && currentTab === 'add-product');

                      return (
                        <button
                          key={item.id}
                          onClick={() => setTab(item.id)}
                          className={`
                            w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left
                            ${
                              isActive
                                ? 'bg-campus-dark text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-campus-primary' : item.color}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`
                                text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1.5 flex-shrink-0
                                ${isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-700'}
                              `}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {/* Platform Quick Links */}
            <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">
                Live Platform
              </div>
              <Link
                to="/find-teammates"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span>Find Teammates</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/hero/dashboard"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span>Campus Hero Ops</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/profile"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span>Admin Profile</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* MAIN WORKSPACE CONTENT AREA                              */}
          {/* ======================================================== */}
          <main className="flex-1 w-full min-w-0">
            {/* Top Overview KPI Cards (Rendered across tabs for quick context) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div
                onClick={() => setTab('sell-requests')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Sell Requests
                  </span>
                  <Tag className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {loadingStats ? '...' : stats?.totalSellRequests || 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  <span className="font-bold text-emerald-700">{stats?.pendingSellRequests || 0}</span> pending review
                </div>
              </div>

              <div
                onClick={() => setTab('custom-submissions')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-purple-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                    Custom Queue
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {loadingStats ? '...' : stats?.totalCustomSubmissions || 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  <span className="font-bold text-purple-700">{stats?.pendingCustomSubmissions || 0}</span> unlisted items
                </div>
              </div>

              <div
                onClick={() => setTab('buy-requests')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                    Buyer Demand
                  </span>
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {loadingStats ? '...' : stats?.totalBuyRequests || 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  <span className="font-bold text-indigo-700">{stats?.pendingBuyRequests || 0}</span> to fulfill
                </div>
              </div>

              <div
                onClick={() => setTab('colleges')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                    Campuses
                  </span>
                  <Building2 className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {loadingStats ? '...' : stats?.totalColleges || 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  <span className="font-bold text-blue-700">{stats?.activeColleges || stats?.totalColleges || 0}</span> active hubs
                </div>
              </div>
            </div>

            {/* DYNAMIC TAB COMPONENT RENDERING */}
            <div className="transition-all duration-150">
              {currentTab === 'analytics' && <AdminAnalytics />}

              {currentTab === 'sell-requests' && (
                <AdminSellRequests onAction={fetchStats} />
              )}

              {currentTab === 'custom-submissions' && (
                <AdminCustomSubmissions onAction={fetchStats} />
              )}

              {currentTab === 'buying-queue' && (
                <AdminBuyingQueue />
              )}

              {currentTab === 'products' && (
                <AdminProducts onAddClick={() => setTab('add-product')} />
              )}

              {currentTab === 'add-product' && (
                <AdminProducts
                  onAddClick={() => {}}
                  forceNewForm={true}
                  onSaved={() => setTab('products')}
                />
              )}

              {currentTab === 'buy-requests' && (
                <AdminBuyRequests />
              )}

              {currentTab === 'automatch' && (
                <AdminAutoMatching />
              )}

              {currentTab === 'colleges' && (
                <AdminColleges onAction={fetchStats} />
              )}

              {currentTab === 'heroes' && (
                <AdminCampusHeroes />
              )}

              {currentTab === 'teams' && (
                <AdminTeamModeration />
              )}

              {currentTab === 'users' && (
                <AdminUserManagement />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
