import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './admin-theme.css';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
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
import { AdminUserManagement } from './AdminUserManagement';
import { AdminAnalytics } from './AdminAnalytics';
import {
  Activity,
  ArrowUpRight,
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

type SidebarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  countField?: keyof AdminStats;
};

type SidebarGroup = {
  group: string;
  items: SidebarItem[];
};

const sidebarGroups: SidebarGroup[] = [
  { group: 'Overview', items: [
    { id: 'analytics', label: 'Platform Analytics', icon: Activity },
  ] },
  { group: 'Marketplace', items: [
    { id: 'products', label: 'Product Catalog', icon: Package, countField: 'activeProducts' },
    { id: 'sell-requests', label: 'Catalog Sell Requests', icon: Tag, countField: 'pendingSellRequests' },
    { id: 'custom-submissions', label: 'Custom Approvals', icon: Sparkles, countField: 'pendingCustomSubmissions' },
    { id: 'buying-queue', label: 'Buying Program Queue', icon: ShoppingBag },
    { id: 'buy-requests', label: 'Buyer Orders & Demand', icon: LayoutGrid, countField: 'pendingBuyRequests' },
  ] },
  { group: 'Operations', items: [
    { id: 'automatch', label: 'Auto-Match & Dispatch', icon: SlidersHorizontal },
    { id: 'heroes', label: 'Campus Hero Approvals', icon: ShieldCheck, countField: 'pendingHeroApplications' },
    { id: 'colleges', label: 'Colleges & Campuses', icon: Building2, countField: 'activeColleges' },
    { id: 'users', label: 'User Directory & Roles', icon: Users, countField: 'totalStudents' },
  ] },
];

const tabLabels = Object.fromEntries(
  sidebarGroups.flatMap((group) => group.items.map((item) => [item.id, item.label]))
) as Record<string, string>;

tabLabels['add-product'] = 'Add New Product';

/**
 * CampusMart admin shell based on the user's Stitch dashboard export.
 * All existing admin modules are retained. Team moderation is intentionally
 * omitted from navigation for the current buy/sell-only release.
 */
export const AdminDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const legacyTab = searchParams.get('dept') === 'buy-dept'
    ? 'buy-requests'
    : searchParams.get('dept') === 'catalog-dept'
      ? 'products'
      : searchParams.get('dept') === 'automatch-dept'
        ? 'automatch'
        : null;
  const requestedTab = searchParams.get('tab') || legacyTab || 'products';
  const currentTab = Object.prototype.hasOwnProperty.call(tabLabels, requestedTab) ? requestedTab : 'products';

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (error) {
      console.error('Unable to load admin dashboard metrics:', error);
    }
  }, []);

  useEffect(() => { if (user?.role === 'ADMIN') void fetchStats(); }, [user?.role, currentTab, fetchStats]);

  const totalPending = useMemo(() =>
    (stats?.pendingSellRequests || 0) +
    (stats?.pendingCustomSubmissions || 0) +
    (stats?.pendingBuyRequests || 0) +
    (stats?.pendingHeroApplications || 0), [stats]);

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-[#090B09] text-sm text-[#C6DE41]">Loading Admin Console…</div>;
  }
  if (!user || user.role !== 'ADMIN') return <Navigate to="/login" replace />;

  const setTab = (tab: string) => {
    setSearchParams({ tab });
    setMobileSidebarOpen(false);
    setAccountMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCatalog = currentTab === 'products' || currentTab === 'add-product';

  const renderModule = () => {
    switch (currentTab) {
      case 'products':
      case 'add-product':
        return <AdminProducts
          key={currentTab}
          forceNewForm={currentTab === 'add-product'}
          onSaved={() => { void fetchStats(); if (currentTab === 'add-product') setTab('products'); }}
          onCloseForm={() => setTab('products')}
        />;
      case 'analytics': return <AdminAnalytics />;
      case 'sell-requests': return <AdminSellRequests onAction={fetchStats} />;
      case 'custom-submissions': return <AdminCustomSubmissions onAction={fetchStats} />;
      case 'buying-queue': return <AdminBuyingQueue />;
      case 'buy-requests': return <AdminBuyRequests />;
      case 'automatch': return <AdminAutoMatching />;
      case 'colleges': return <AdminColleges onAction={fetchStats} />;
      case 'heroes': return <AdminCampusHeroes />;
      case 'users': return <AdminUserManagement />;
      default: return null;
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#181C18] text-[#E4E8DE]">
      <div className="flex h-[72px] shrink-0 items-center justify-between gap-2 border-b border-white/5 px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C6DE41] text-[#10180A]"><Boxes className="h-5 w-5" /></div>
          {!sidebarCollapsed && <div className="min-w-0"><div className="whitespace-nowrap text-[16px] font-extrabold tracking-tight text-white">CampusMart</div><div className="text-[10px] leading-3 text-[#AAB3A3]">Operations Console</div></div>}
        </div>
        <button type="button" onClick={() => {setSidebarCollapsed((value) => !value);setMobileSidebarOpen(false);}} aria-label="Collapse sidebar" className="hidden rounded-md p-1.5 text-[#9FA899] hover:bg-white/5 hover:text-white lg:block">
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => setMobileSidebarOpen(false)} aria-label="Close navigation" className="rounded-md p-2 lg:hidden"><X className="h-5 w-5" /></button>
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {sidebarGroups.map((group) => <div key={group.group}>
          {!sidebarCollapsed && <h3 className="mb-2 px-2 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#AEB6A5]">{group.group}</h3>}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.id === currentTab || (item.id === 'products' && isCatalog);
              const count = item.countField && stats ? Number(stats[item.countField] || 0) : null;
              return <button key={item.id} type="button" title={sidebarCollapsed ? item.label : undefined} onClick={() => setTab(item.id)} className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] font-semibold transition-colors ${active ? 'bg-[#C6DE41] text-[#202A12]' : 'text-[#B4BCAE] hover:bg-[#2B312A] hover:text-white'} ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <Icon className="h-[17px] w-[17px] shrink-0" />
                {!sidebarCollapsed && <><span className="min-w-0 flex-1 truncate">{item.label}</span>{count !== null && count > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${active ? 'bg-[#232D18] text-white' : 'bg-[#353B33] text-[#DADED4]'}`}>{count}</span>}</>}
              </button>;
            })}
          </div>
        </div>)}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/10 bg-[#111510] p-4">
        {!sidebarCollapsed && <div className="flex items-center justify-between text-[11px] text-[#C4CCBD]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C6DE41]" /> CampusMart Admin</span></div>}
        <Link to="/settings" className={`flex items-center gap-2 text-xs font-semibold text-[#ADB5A7] transition hover:text-[#C6DE41] ${sidebarCollapsed ? 'justify-center' : ''}`} title="Account settings"><Settings className="h-4 w-4" />{!sidebarCollapsed && 'Account Settings'}</Link>
      </div>
    </div>
  );

  return (
    <div className="cm-admin min-h-screen bg-[#090B09] text-[#F5F7F0]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      {mobileSidebarOpen && <div className="fixed inset-0 z-[70] bg-black/70 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-[80] w-[260px] border-r border-white/5 transition-transform duration-200 lg:fixed lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-[78px]' : 'lg:w-[260px]'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </aside>

      <div className={`min-w-0 ${sidebarCollapsed ? 'lg:ml-[78px]' : 'lg:ml-[260px]'}`}>
        <header className="sticky top-0 z-40 flex min-h-[70px] flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#181C18] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Open admin navigation" className="rounded-lg border border-white/10 p-2 lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#B6BEAF]"><span>Admin</span><ChevronRight className="h-3.5 w-3.5" /><span>{isCatalog ? 'Marketplace' : 'Operations'}</span><ChevronRight className="h-3.5 w-3.5" /><span className="text-[#F5F7F0]">{tabLabels[currentTab] || 'Dashboard'}</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link to="/buy" className="inline-flex items-center gap-2 rounded-full bg-[#242A23] px-3.5 py-2 text-[11px] font-bold transition hover:bg-[#30392C]"><span className="h-1.5 w-1.5 rounded-full bg-[#C6DE41]" />View Storefront<ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <button type="button" onClick={() => setTab('sell-requests')} className="inline-flex items-center gap-2 rounded-xl bg-[#292E28] px-3.5 py-2 text-[11px] font-semibold text-[#CED4C8] hover:bg-[#343B30]" title="View pending sell requests"><Bell className="h-3.5 w-3.5 text-[#C6DE41]" /><strong className="text-white">{totalPending}</strong><span className="hidden sm:inline">pending reviews</span></button>
            <div className="relative">
              <button type="button" onClick={() => setAccountMenuOpen((open) => !open)} aria-expanded={accountMenuOpen} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-[#2A3128]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C6DE41]/30 bg-[#C6DE41]/10 text-xs font-bold text-[#C6DE41]">{user.name.charAt(0).toUpperCase()}</span>
                <span className="hidden max-w-[150px] text-left md:block"><span className="block truncate text-xs font-bold">{user.name}</span><span className="block text-[10px] text-[#A9B4A3]">{user.college?.code || 'Admin'}</span></span>
                <ChevronDown className="h-3.5 w-3.5 text-[#A9B4A3]" />
              </button>
              {accountMenuOpen && <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#222A20] p-2 shadow-2xl"><Link to="/profile" onClick={() => setAccountMenuOpen(false)} className="block rounded-lg px-3 py-2 text-xs hover:bg-white/10">View Profile</Link><Link to="/settings" onClick={() => setAccountMenuOpen(false)} className="block rounded-lg px-3 py-2 text-xs hover:bg-white/10">Account Settings</Link></div>}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-7">
          {isCatalog ? renderModule() : <div className="cm-admin-module rounded-2xl border border-white/[0.06] bg-[#12160F] p-4 text-[#F5F7F0] sm:p-6">{renderModule()}</div>}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
