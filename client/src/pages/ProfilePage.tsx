import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, SellRequestItem, BuyRequestItem, CampusHeroItem, MessageItem, CustomItemSubmissionItem } from '../services/api';
import { 
  User as UserIcon, 
  MapPin, 
  Mail, 
  Phone, 
  Tag, 
  ShoppingBag, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  LogOut,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
  Truck,
  ChevronRight
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sellRequests, setSellRequests] = useState<SellRequestItem[]>([]);
  const [buyRequests, setBuyRequests] = useState<BuyRequestItem[]>([]);
  const [customSubmissions, setCustomSubmissions] = useState<CustomItemSubmissionItem[]>([]);
  const [heroApp, setHeroApp] = useState<CampusHeroItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [sendingTaskId, setSendingTaskId] = useState<string | null>(null);
  const [replyStatus, setReplyStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'sell' | 'buy' | 'hero' | 'messages' | 'custom' | 'empty'>('empty');

  const hasSell = sellRequests.length > 0;
  const hasBuy = buyRequests.length > 0;
  const hasCustom = customSubmissions.length > 0;
  const hasHero = Boolean(heroApp !== null || user?.role === 'CAMPUS_HERO');
  const hasMessages = messages.length > 0;

  interface AvailableTab {
    id: 'sell' | 'buy' | 'messages' | 'hero' | 'custom';
    label: string;
    icon: any;
    count?: number;
    hasAlert?: boolean;
  }

  const availableTabs: AvailableTab[] = [];
  if (hasSell) {
    availableTabs.push({ id: 'sell', label: 'My Sell Requests', icon: Tag, count: sellRequests.length });
  }
  if (hasCustom) {
    availableTabs.push({ id: 'custom', label: 'Custom Submissions', icon: Sparkles, count: customSubmissions.length });
  }
  if (hasBuy) {
    availableTabs.push({ id: 'buy', label: 'My Buy Requests', icon: ShoppingBag, count: buyRequests.length });
  }
  if (hasMessages) {
    availableTabs.push({
      id: 'messages',
      label: 'Operations Messages',
      icon: MessageSquare,
      count: messages.length,
      hasAlert: messages.some((m) => !m.is_read && !m.is_from_me),
    });
  }
  if (hasHero) {
    availableTabs.push({ id: 'hero', label: 'Campus Hero Status', icon: ShieldCheck });
  }

  useEffect(() => {
    if (!loading) {
      if (availableTabs.length > 0) {
        if (!availableTabs.some((t) => t.id === activeTab)) {
          setActiveTab(availableTabs[0].id);
        }
      } else {
        setActiveTab('empty');
      }
    }
  }, [loading, hasSell, hasBuy, hasCustom, hasHero, hasMessages]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const [sells, buys, hero, userMsgs, customSubs] = await Promise.all([
          api.getMySellRequests(),
          api.getMyBuyRequests(),
          api.getMyCampusHeroApplication(),
          api.messages.getMyMessages().catch(() => [] as MessageItem[]),
          api.getMyCustomSubmissions().catch(() => [] as CustomItemSubmissionItem[]),
        ]);
        setSellRequests(sells);
        setBuyRequests(buys);
        setHeroApp(hero);
        setMessages(userMsgs);
        setCustomSubmissions(customSubs);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate]);

  const handleSendReply = async (taskId: string) => {
    const text = replyTextMap[taskId]?.trim();
    if (!text) return;

    setSendingTaskId(taskId);
    setReplyStatus(null);
    try {
      await api.messages.sendReply({
        task_id: taskId,
        content: text,
      });
      setReplyTextMap((prev) => ({ ...prev, [taskId]: '' }));
      setReplyStatus('Message delivered to Campus Hero Operations team.');
      // Refresh messages
      const updatedMsgs = await api.messages.getMyMessages();
      setMessages(updatedMsgs);
      setTimeout(() => setReplyStatus(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSendingTaskId(null);
    }
  };

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-campus-primary to-campus-dark text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-campus-dark tracking-tight">
                {user.name}
              </h1>
              {user.role === 'ADMIN' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  Admin
                </span>
              )}
            </div>

            {/* Permanent College Display (NO edit button) */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-campus-soft border border-campus-primary/30 text-campus-dark text-xs font-bold">
                <MapPin className="w-3.5 h-3.5 text-campus-primary" />
                <span>{user.college.code} — {user.college.name}</span>
                <span title="College is permanently bound and immutable">
                  <Lock className="w-3 h-3 text-slate-400 ml-1" />
                </span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {user.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {(user.role === 'CAMPUS_HERO' || heroApp?.status === 'APPROVED' || user.role === 'ADMIN') && (
            <Link
              to="/hero-dashboard"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Hero Operations Center</span>
            </Link>
          )}

          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tabs Bar - ONLY show tabs the user has registered for */}
      {availableTabs.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 mb-6 pb-2 text-sm font-bold">
          <div className="flex flex-wrap items-center gap-2">
            {availableTabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const isSelected = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id)}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 relative ${
                    isSelected
                      ? 'bg-campus-primary text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    {tabItem.label} {tabItem.count !== undefined && `(${tabItem.count})`}
                  </span>
                  {tabItem.hasAlert && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions to register for other activities */}
          <div className="flex flex-wrap items-center gap-2">
            {!hasSell && (
              <Link
                to="/sell"
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-campus-primary/50 text-slate-600 hover:text-campus-primary text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>+ Sell Item</span>
              </Link>
            )}
            {!hasBuy && (
              <Link
                to="/buy"
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-campus-primary/50 text-slate-600 hover:text-campus-primary text-xs font-semibold transition-all flex items-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Buy Catalog</span>
              </Link>
            )}
            {!hasHero && (
              <Link
                to="/campus-heroes"
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-campus-primary/50 text-slate-600 hover:text-campus-primary text-xs font-semibold transition-all flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>+ Hero Apply</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Empty / Onboarding State when user has not registered for any requests yet */
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-subtle text-center space-y-6 mb-8">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-campus-soft text-campus-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome to Your Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              You haven't submitted any requests yet. Once you submit a buy or sell request, or apply as a Campus Hero, your personalized tracking tabs will appear here automatically!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-left">
            <Link
              to="/sell"
              className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Sell an Item</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Turn your used calculators, books, or drafters into instant cash with college pickup.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 mt-4 flex items-center gap-1">
                <span>Start Selling</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              to="/buy"
              className="p-5 rounded-2xl border border-slate-200 hover:border-purple-500/50 hover:bg-purple-50/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Buy on Campus</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Get verified college essentials at student-friendly prices with free campus handover.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700 mt-4 flex items-center gap-1">
                <span>Browse Catalog</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              to="/campus-heroes"
              className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500/50 hover:bg-blue-50/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Become a Campus Hero</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Represent CampusMart at {user.college.code}, gain leadership credentials, and earn per transaction.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 mt-4 flex items-center gap-1">
                <span>Apply as Hero</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Tab 1: My Sell Requests - ONLY if user registered sell requests */}
      {hasSell && activeTab === 'sell' && (
        <div className="space-y-4">
          {sellRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Sell Requests Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                Turn your used calculators, books, and gadgets into instant cash.
              </p>
              <Link
                to="/sell"
                className="px-5 py-2.5 bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Submit an Item to Sell
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sellRequests.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{item.product_name}</h4>
                        {(item as any).auto_matched && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Auto-Matched
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Condition: <span className="font-semibold text-slate-700">{item.condition}</span> • Submitted {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">"{item.description}"</p>
                      )}
                      {(item as any).auto_matched && (
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-campus-primary hover:text-campus-primary-hover"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Operations Messages from Campus Hero</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold block text-right">
                        Estimated Payout
                      </span>
                      <span className="text-lg font-extrabold text-campus-dark">
                        ₹{item.admin_buy_price}
                      </span>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Buy Requests - ONLY if user registered buy requests */}
      {hasBuy && activeTab === 'buy' && (
        <div className="space-y-4">
          {buyRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Buy Requests Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                You haven't requested anything yet. Check out what is available on your campus.
              </p>
              <Link
                to="/buy"
                className="px-5 py-2.5 bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Browse Campus Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {buyRequests.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-campus-soft flex items-center justify-center text-campus-primary">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{item.product_name}</h4>
                        {(item as any).auto_matched && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Auto-Matched
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Requested on {new Date(item.created_at).toLocaleDateString()} • Campus: {item.college_code}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">Note: "{item.notes}"</p>
                      )}
                      {(item as any).auto_matched && (
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-campus-primary hover:text-campus-primary-hover"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Operations Messages from Campus Hero</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold block text-right">
                        Price
                      </span>
                      <span className="text-lg font-extrabold text-campus-dark">
                        ₹{item.selling_price}
                      </span>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Custom Item Submissions */}
      {hasCustom && activeTab === 'custom' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 gap-4">
            {customSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {sub.images && sub.images.length > 0 ? (
                    <img
                      src={sub.images[0]}
                      alt={sub.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{sub.name}</h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {sub.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Condition: <span className="font-semibold text-slate-700">{sub.condition}</span> • Submitted {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-600 italic line-clamp-1">"{sub.description}"</p>
                    {sub.rejection_reason && sub.status === 'REJECTED' && (
                      <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-100 mt-1">
                        Reason: {sub.rejection_reason}
                      </p>
                    )}
                    {sub.status === 'APPROVED' && (
                      <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Published live to {sub.college_code || user?.college.code} Campus Marketplace</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                      {sub.status === 'APPROVED' ? 'Approved Payout' : 'Asking Price'}
                    </span>
                    <span className="text-lg font-extrabold text-campus-dark">
                      ₹{(sub.admin_buy_price || sub.expected_price).toLocaleString('en-IN')}
                    </span>
                    {sub.status === 'APPROVED' && sub.admin_sell_price && (
                      <span className="text-[10px] text-slate-500 block">
                        Catalog Price: ₹{sub.admin_sell_price}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(sub.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Operations & Campus Hero Messages - ONLY if user has active messages */}
      {hasMessages && activeTab === 'messages' && (
        <div className="space-y-6">
          {/* Official Operations Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700/60 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  CampusMart Operations & Hero Desk
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    Official College Ops
                  </span>
                </h3>
                <p className="text-xs text-emerald-200/90 mt-1 max-w-2xl leading-relaxed">
                  All messages sent here are coordinated by your campus designated <strong className="text-white">Operations Team — Campus Hero</strong>. Coordinate product handover, inspection, and verification directly within CampusMart.
                </p>
              </div>
            </div>
          </div>

          {replyStatus && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{replyStatus}</span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-subtle">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Operations Messages Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                When you submit a sell or buy request and your Campus Hero begins pickup or drop verification, you'll receive real-time instructions and updates right here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group messages by task or render distinct operational threads */}
              {Object.entries(
                messages.reduce((acc, msg) => {
                  const key = msg.task_id || 'general';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(msg);
                  return acc;
                }, {} as Record<string, MessageItem[]>)
              ).map(([taskId, threadMsgs]) => {
                const latestMsg = threadMsgs[threadMsgs.length - 1];
                const productName = latestMsg.product_name || 'Campus Recommerce Item';

                return (
                  <div
                    key={taskId}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden"
                  >
                    {/* Thread Header */}
                    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          <Truck className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{productName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active Task Thread
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Coordinated by <strong className="text-slate-700">Operations Team — Campus Hero</strong>
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {threadMsgs.length} {threadMsgs.length === 1 ? 'message' : 'messages'}
                      </span>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto bg-gradient-to-b from-white to-slate-50/30">
                      {threadMsgs.map((msg) => {
                        const isHeroSender = Boolean(
                          msg.sender_display_name?.includes('Hero') || 
                          msg.sender_display_name?.includes('Operations') ||
                          !msg.is_from_me
                        );
                        const isMine = Boolean(msg.is_from_me);

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isHeroSender && !isMine ? 'items-start' : isHeroSender && isMine ? 'items-start' : 'items-end'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                              {isHeroSender ? (
                                <span className="font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-xs">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Operations Team — Campus Hero</span>
                                  {isMine && <span className="text-[10px] text-emerald-600 font-semibold">(Sent by Hero)</span>}
                                </span>
                              ) : (
                                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  You (Student)
                                </span>
                              )}
                              <span className="text-slate-400">
                                • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                                isHeroSender
                                  ? 'bg-white border border-emerald-200 text-slate-800 rounded-tl-sm'
                                  : 'bg-campus-primary text-white rounded-tr-sm'
                              }`}
                            >
                              <p className="whitespace-pre-line font-medium">{msg.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Reply Form (Direct communication with Hero) */}
                    {taskId !== 'general' && (
                      <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
                        {/* Quick Reply Preset Chips */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {[
                            'Item is ready for pickup!',
                            'I am in library / canteen now',
                            'Available today after 4 PM',
                            'Please call me when near hostel',
                          ].map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setReplyTextMap((prev) => ({
                                  ...prev,
                                  [taskId]: chip,
                                }))
                              }
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-600 border border-slate-200/80 transition-colors"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendReply(taskId);
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={replyTextMap[taskId] || ''}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({
                                ...prev,
                                [taskId]: e.target.value,
                              }))
                            }
                            placeholder="Reply to Operations Team — Campus Hero..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-slate-50/50"
                          />
                          <button
                            type="submit"
                            disabled={sendingTaskId === taskId || !replyTextMap[taskId]?.trim()}
                            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                          >
                            {sendingTaskId === taskId ? (
                              <span>Sending...</span>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Send Reply</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Campus Hero Status - ONLY if user registered for Campus Hero */}
      {hasHero && activeTab === 'hero' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
          {heroApp ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-campus-dark">Campus Hero Application</h3>
                  <p className="text-xs text-slate-500">Submitted on {new Date(heroApp.created_at).toLocaleDateString()}</p>
                </div>
                <div>{getStatusBadge(heroApp.status)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Branch & Year</span>
                  <span className="font-bold text-slate-800 text-sm">{heroApp.branch} • {heroApp.year}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Phone Number</span>
                  <span className="font-bold text-slate-800 text-sm">{heroApp.phone}</span>
                </div>
                {heroApp.instagram && (
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Instagram</span>
                    <span className="font-bold text-slate-800 text-sm">{heroApp.instagram}</span>
                  </div>
                )}
                {heroApp.linkedin && (
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">LinkedIn</span>
                    <span className="font-bold text-slate-800 text-sm truncate">{heroApp.linkedin}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Reason for Joining</span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-[#F8FAF9] p-3 rounded-xl border border-slate-100">
                  {heroApp.reason}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Application Submitted Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
                Represent CampusMart at {user.college.code}, gain leadership credentials, and connect your campus.
              </p>
              <Link
                to="/campus-heroes"
                className="px-5 py-2.5 bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Apply to Become a Campus Hero
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
