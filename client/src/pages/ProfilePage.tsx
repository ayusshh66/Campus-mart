import { SmoothInput } from '../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, SellRequestItem, BuyRequestItem, CampusHeroItem, MessageItem, CustomItemSubmissionItem } from '../services/api';
import { 
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
  const { user, logout, marketplaceMode, setMarketplaceMode } = useAuth();
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C6DE41]/20 text-[#C6DE41] border border-[#C6DE41]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 bg-[#090B09] text-[#F5F7F0] min-h-screen">
      {/* Profile Header Card */}
      <div className="bg-[#12160F] rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C6DE41] text-[#090B09] flex items-center justify-center font-black text-2xl sm:text-3xl shadow-[0_0_20px_rgba(198,222,65,0.3)] shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {user.name}
              </h1>
              {user.role === 'ADMIN' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30 text-[11px] font-bold">
                  Admin
                </span>
              )}
            </div>

            {/* Permanent College Display & Marketplace Mode */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181D14] border border-white/10 text-white text-[12px] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#C6DE41]" />
                <span>{user.college.code} — {user.college.name}</span>
                <span title="College is permanently bound and immutable">
                  <Lock className="w-3 h-3 text-stone-400 ml-1" />
                </span>
              </div>

              {/* Interactive Marketplace Mode Toggle */}
              <div className="inline-flex items-center p-0.5 rounded-full bg-[#181D14] border border-[#C6DE41]/30">
                <button
                  type="button"
                  onClick={() => setMarketplaceMode('BUYER')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                    marketplaceMode === 'BUYER'
                      ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_10px_rgba(198,222,65,0.3)]'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Buyer Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMarketplaceMode('SELLER')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                    marketplaceMode === 'SELLER'
                      ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_10px_rgba(198,222,65,0.3)]'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>Seller Mode</span>
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-stone-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                {user.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(user.role === 'CAMPUS_HERO' || heroApp?.status === 'APPROVED' || user.role === 'ADMIN') && (
            <Link
              to="/hero-dashboard"
              className="px-4 py-2 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[12px] font-bold transition-all shadow-[0_0_15px_rgba(198,222,65,0.25)] flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-[#090B09]" />
              <span>Hero Operations</span>
            </Link>
          )}

          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-full bg-[#181D14] hover:bg-white/10 text-white border border-white/15 text-[12px] font-bold transition-all"
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 rounded-full border border-white/15 text-stone-300 hover:text-white hover:bg-white/5 text-[12px] font-semibold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tabs Bar */}
      {availableTabs.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-[#12160F] rounded-full border border-white/10 shadow-sm gap-1 flex-wrap">
            {availableTabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const isSelected = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id)}
                  className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all flex items-center gap-2 relative ${
                    isSelected
                      ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_12px_rgba(198,222,65,0.25)]'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!hasSell && (
              <Link
                to="/sell"
                className="px-3.5 py-1.5 rounded-full border border-white/15 bg-[#12160F] hover:bg-white/10 text-white text-[12px] font-semibold transition-all flex items-center gap-1 shadow-sm"
              >
                <Tag className="w-3.5 h-3.5 text-[#C6DE41]" />
                <span>+ Sell Item</span>
              </Link>
            )}
            {!hasBuy && (
              <Link
                to="/buy"
                className="px-3.5 py-1.5 rounded-full border border-white/15 bg-[#12160F] hover:bg-white/10 text-white text-[12px] font-semibold transition-all flex items-center gap-1 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C6DE41]" />
                <span>+ Buy Catalog</span>
              </Link>
            )}
            {!hasHero && (
              <Link
                to="/campus-heroes"
                className="px-3.5 py-1.5 rounded-full border border-white/15 bg-[#12160F] hover:bg-white/10 text-white text-[12px] font-semibold transition-all flex items-center gap-1 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C6DE41]" />
                <span>+ Hero Apply</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Empty / Onboarding State */
        <div className="bg-[#12160F] rounded-[28px] p-8 sm:p-12 border border-white/10 shadow-2xl text-center space-y-8">
          <div className="max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Welcome to Your Campus Account
            </h2>
            <p className="text-[13px] text-stone-300 mt-2 leading-relaxed">
              You haven't submitted any requests yet. Once you submit a buy or sell request, or apply as a Campus Hero, your personalized tracking tabs will appear here automatically!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <Link
              to="/sell"
              className="p-6 rounded-[24px] bg-[#181D14] border border-white/10 hover:border-[#C6DE41]/50 hover:shadow-[0_0_25px_rgba(198,222,65,0.1)] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-[#12160F] text-[#C6DE41] border border-white/10 flex items-center justify-center mb-3 group-hover:bg-[#C6DE41] group-hover:text-[#090B09] transition-colors">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-[14px] tracking-tight">Sell an Item</h3>
                <p className="text-[12px] text-stone-400 mt-1.5 leading-relaxed">
                  Turn your used calculators, books, or drafters into instant cash with college pickup.
                </p>
              </div>
              <span className="text-[12px] font-bold text-[#C6DE41] mt-4 flex items-center gap-1">
                <span>Start Selling</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              to="/buy"
              className="p-6 rounded-[24px] bg-[#181D14] border border-white/10 hover:border-[#C6DE41]/50 hover:shadow-[0_0_25px_rgba(198,222,65,0.1)] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-[#12160F] text-[#C6DE41] border border-white/10 flex items-center justify-center mb-3 group-hover:bg-[#C6DE41] group-hover:text-[#090B09] transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-[14px] tracking-tight">Buy on Campus</h3>
                <p className="text-[12px] text-stone-400 mt-1.5 leading-relaxed">
                  Get verified college essentials at student-friendly prices with free campus handover.
                </p>
              </div>
              <span className="text-[12px] font-bold text-[#C6DE41] mt-4 flex items-center gap-1">
                <span>Browse Catalog</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              to="/campus-heroes"
              className="p-6 rounded-[24px] bg-[#181D14] border border-white/10 hover:border-[#C6DE41]/50 hover:shadow-[0_0_25px_rgba(198,222,65,0.1)] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-[#12160F] text-[#C6DE41] border border-white/10 flex items-center justify-center mb-3 group-hover:bg-[#C6DE41] group-hover:text-[#090B09] transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-[14px] tracking-tight">Become a Campus Hero</h3>
                <p className="text-[12px] text-stone-400 mt-1.5 leading-relaxed">
                  Represent CampusMart at {user.college.code}, gain leadership credentials, and earn per transaction.
                </p>
              </div>
              <span className="text-[12px] font-bold text-[#C6DE41] mt-4 flex items-center gap-1">
                <span>Apply as Hero</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Tab 1: My Sell Requests */}
      {hasSell && activeTab === 'sell' && (
        <div className="space-y-4">
          {sellRequests.length === 0 ? (
            <div className="bg-[#12160F] rounded-3xl p-12 text-center border border-white/10">
              <Tag className="w-12 h-12 text-stone-500 mx-auto mb-3" />
              <h3 className="font-bold text-white text-lg">No Sell Requests Yet</h3>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 mb-6">
                Turn your used calculators, books, and gadgets into instant cash.
              </p>
              <Link
                to="/sell"
                className="px-5 py-2.5 bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-xs font-bold rounded-full shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all"
              >
                Submit an Item to Sell
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sellRequests.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#12160F] rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#181D14] flex items-center justify-center text-stone-400">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{item.product_name}</h4>
                        {(item as any).auto_matched && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30">
                            <Sparkles className="w-3 h-3 text-[#C6DE41]" />
                            Auto-Matched
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Condition: <span className="font-semibold text-white">{item.condition}</span> • Submitted {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      {item.description && (
                        <p className="text-xs text-stone-400 italic mt-1 line-clamp-1">"{item.description}"</p>
                      )}
                      {(item as any).auto_matched && (
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#C6DE41] hover:underline"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Operations Messages from Campus Hero</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 gap-2">
                    <div>
                      <span className="text-[11px] text-stone-400 uppercase font-semibold block text-right">
                        {item.status === 'APPROVED' ? 'Final Payout Quote' : 'Estimated Payout'}
                      </span>
                      <span className="text-lg font-black text-[#C6DE41]">
                        ₹{item.admin_buy_price || item.estimated_price}
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

      {/* Tab 2: My Buy Requests */}
      {hasBuy && activeTab === 'buy' && (
        <div className="space-y-4">
          {buyRequests.length === 0 ? (
            <div className="bg-[#12160F] rounded-3xl p-12 text-center border border-white/10">
              <ShoppingBag className="w-12 h-12 text-stone-500 mx-auto mb-3" />
              <h3 className="font-bold text-white text-lg">No Buy Requests Yet</h3>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 mb-6">
                You haven't requested anything yet. Check out what is available on your campus.
              </p>
              <Link
                to="/buy"
                className="px-5 py-2.5 bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-xs font-bold rounded-full shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all"
              >
                Browse Campus Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {buyRequests.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#12160F] rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#181D14] flex items-center justify-center text-[#C6DE41] border border-white/10">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{item.product_name}</h4>
                        {(item as any).auto_matched && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30">
                            <Sparkles className="w-3 h-3 text-[#C6DE41]" />
                            Auto-Matched
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Requested on {new Date(item.created_at).toLocaleDateString()} • Campus: {item.college_code}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-stone-400 italic mt-1 line-clamp-1">Note: "{item.notes}"</p>
                      )}
                      {(item as any).auto_matched && (
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#C6DE41] hover:underline"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Operations Messages from Campus Hero</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 gap-2">
                    <div>
                      <span className="text-[11px] text-stone-400 uppercase font-semibold block text-right">
                        Price
                      </span>
                      <span className="text-lg font-black text-[#C6DE41]">
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
                className="bg-[#12160F] rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {sub.images && sub.images.length > 0 ? (
                    <img
                      src={sub.images[0]}
                      alt={sub.name}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#181D14] text-[#C6DE41] border border-white/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{sub.name}</h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#181D14] text-stone-200 border border-white/10">
                        {sub.category}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Condition: <span className="font-semibold text-white">{sub.condition}</span> • Submitted {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-stone-400 italic line-clamp-1">"{sub.description}"</p>
                    {sub.rejection_reason && sub.status === 'REJECTED' && (
                      <p className="text-xs text-rose-300 font-medium bg-rose-500/10 p-2 rounded-lg border border-rose-500/30 mt-1">
                        Reason: {sub.rejection_reason}
                      </p>
                    )}
                    {sub.status === 'APPROVED' && (
                      <p className="text-xs text-[#C6DE41] font-bold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Published live to {sub.college_code || user?.college.code} Campus Marketplace</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400 uppercase font-semibold block">
                      {sub.status === 'APPROVED' ? 'Final Payout Quote' : 'Payout Valuation'}
                    </span>
                    {sub.status === 'APPROVED' && sub.admin_buy_price ? (
                      <span className="text-lg font-black text-[#C6DE41]">
                        ₹{sub.admin_buy_price.toLocaleString('en-IN')}
                      </span>
                    ) : sub.status === 'REJECTED' ? (
                      <span className="text-xs font-bold text-rose-400">Rejected</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-300">Pending Admin Valuation</span>
                    )}
                    {sub.status === 'APPROVED' && sub.admin_sell_price && (
                      <span className="text-[10px] text-stone-400 block">
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

      {/* Tab: Operations & Campus Hero Messages */}
      {hasMessages && activeTab === 'messages' && (
        <div className="space-y-6">
          {/* Official Operations Banner */}
          <div className="bg-[#12160F] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#C6DE41]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C6DE41]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#C6DE41]/15 border border-[#C6DE41]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#C6DE41]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  CampusMart Operations & Hero Desk
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30">
                    Official College Ops
                  </span>
                </h3>
                <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                  All messages sent here are coordinated by your campus designated <strong className="text-white">Operations Team — Campus Hero</strong>. Coordinate product handover, inspection, and verification directly within CampusMart.
                </p>
              </div>
            </div>
          </div>

          {replyStatus && (
            <div className="p-4 rounded-2xl bg-[#C6DE41]/15 border border-[#C6DE41]/30 text-[#C6DE41] text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#C6DE41] shrink-0" />
              <span>{replyStatus}</span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="bg-[#12160F] rounded-3xl p-12 text-center border border-white/10 shadow-lg">
              <MessageSquare className="w-12 h-12 text-stone-500 mx-auto mb-3" />
              <h3 className="font-bold text-white text-lg">No Operations Messages Yet</h3>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-md mx-auto">
                When you submit a sell or buy request and your Campus Hero begins pickup or drop verification, you'll receive real-time instructions and updates right here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
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
                    className="bg-[#12160F] rounded-3xl border border-white/10 shadow-xl overflow-hidden"
                  >
                    {/* Thread Header */}
                    <div className="bg-[#181D14] px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/25 flex items-center justify-center font-bold text-xs">
                          <Truck className="w-5 h-5 text-[#C6DE41]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{productName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30">
                              Active Task Thread
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400">
                            Coordinated by <strong className="text-white">Operations Team — Campus Hero</strong>
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-stone-400 font-medium">
                        {threadMsgs.length} {threadMsgs.length === 1 ? 'message' : 'messages'}
                      </span>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto bg-[#090B09]">
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
                                <span className="font-bold text-[#C6DE41] flex items-center gap-1 bg-[#181D14] px-2.5 py-0.5 rounded-full border border-[#C6DE41]/30 shadow-xs">
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#C6DE41]" />
                                  <span>Operations Team — Campus Hero</span>
                                  {isMine && <span className="text-[10px] text-[#C6DE41] font-semibold">(Sent by Hero)</span>}
                                </span>
                              ) : (
                                <span className="font-bold text-stone-300 bg-[#181D14] px-2 py-0.5 rounded-md border border-white/10">
                                  You (Student)
                                </span>
                              )}
                              <span className="text-stone-500">
                                • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                                isHeroSender
                                  ? 'bg-[#181D14] border border-[#C6DE41]/30 text-white rounded-tl-sm'
                                  : 'bg-[#C6DE41] text-[#090B09] font-bold rounded-tr-sm'
                              }`}
                            >
                              <p className="whitespace-pre-line">{msg.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Reply Form */}
                    {taskId !== 'general' && (
                      <div className="p-4 sm:p-5 bg-[#12160F] border-t border-white/10">
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
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#181D14] hover:bg-[#C6DE41]/10 hover:text-[#C6DE41] text-stone-300 border border-white/10 transition-colors"
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
                          <SmoothInput
                            type="text"
                            value={replyTextMap[taskId] || ''}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({
                                ...prev,
                                [taskId]: e.target.value,
                              }))
                            }
                            placeholder="Reply to Operations Team — Campus Hero..."
                            className="flex-1 px-4 py-2.5 rounded-full border border-white/15 text-xs text-white placeholder:text-stone-500 focus:border-[#C6DE41] outline-none bg-[#181D14]"
                          />
                          <button
                            type="submit"
                            disabled={sendingTaskId === taskId || !replyTextMap[taskId]?.trim()}
                            className="px-5 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] disabled:opacity-50 text-[#090B09] text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all shrink-0"
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

      {/* Tab 3: Campus Hero Status */}
      {hasHero && activeTab === 'hero' && (
        <div className="bg-[#12160F] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
          {heroApp ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white">Campus Hero Application</h3>
                  <p className="text-xs text-stone-400">Submitted on {new Date(heroApp.created_at).toLocaleDateString()}</p>
                </div>
                <div>{getStatusBadge(heroApp.status)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">Branch & Year</span>
                  <span className="font-bold text-white text-sm">{heroApp.branch} • {heroApp.year}</span>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">Phone Number</span>
                  <span className="font-bold text-white text-sm">{heroApp.phone}</span>
                </div>
                {heroApp.instagram && (
                  <div>
                    <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">Instagram</span>
                    <span className="font-bold text-white text-sm">{heroApp.instagram}</span>
                  </div>
                )}
                {heroApp.linkedin && (
                  <div>
                    <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">LinkedIn</span>
                    <span className="font-bold text-white text-sm truncate">{heroApp.linkedin}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <span className="text-stone-400 block font-semibold uppercase tracking-wider text-[10px]">Reason for Joining</span>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed bg-[#181D14] p-3 rounded-xl border border-white/10">
                  {heroApp.reason}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShieldCheck className="w-12 h-12 text-stone-500 mx-auto mb-3" />
              <h3 className="font-bold text-white text-lg">No Application Submitted Yet</h3>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 mb-6 max-w-sm mx-auto">
                Represent CampusMart at {user.college.code}, gain leadership credentials, and connect your campus.
              </p>
              <Link
                to="/campus-heroes"
                className="px-5 py-2.5 bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-xs font-bold rounded-full shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all"
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
