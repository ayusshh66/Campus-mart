import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, HeroDashboardData, DeliveryTaskItem, MessageItem } from '../services/api';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Send, 
  ArrowRight, 
  Check, 
  X, 
  Sparkles, 
  UserCheck, 
  Tag, 
  AlertCircle,
  Truck,
  RotateCcw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const CampusHeroDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<HeroDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');

  // Chat Modal State
  const [activeChatTask, setActiveChatTask] = useState<DeliveryTaskItem | null>(null);
  const [chatRecipient, setChatRecipient] = useState<{ id: string; name: string; role: 'SELLER' | 'BUYER' } | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Photo viewer modal state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.hero.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load hero dashboard:', err);
      setError(err.message || 'You must be an approved Campus Hero or Admin to access this dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, [user, navigate]);

  const handleUpdateStatus = async (taskId: string, newStatus: string, qualityVerified?: boolean) => {
    try {
      await api.hero.updateTaskStatus(taskId, {
        status: newStatus,
        quality_verified: qualityVerified,
      });
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleOpenChat = (task: DeliveryTaskItem, recipient: { id: string; name: string; role: 'SELLER' | 'BUYER' }) => {
    setActiveChatTask(task);
    setChatRecipient(recipient);
    setChatMessage('');
    setChatError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatTask || !chatRecipient || !chatMessage.trim()) return;

    setSendingMessage(true);
    setChatError(null);
    try {
      await api.hero.sendMessage(activeChatTask.id, {
        receiver_id: chatRecipient.id,
        content: chatMessage.trim(),
      });
      setChatMessage('');
      // Refresh dashboard to pull the new message
      await fetchDashboard();
      // Update local active chat task with refreshed messages
      if (data) {
        const updated = data.tasks.find((t) => t.id === activeChatTask.id);
        if (updated) setActiveChatTask(updated);
      }
    } catch (err: any) {
      setChatError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const presetMessages = [
    '📍 Can we meet near the campus library entrance today?',
    '⚡ I am on campus and ready for pickup/verification.',
    '📦 Your item is verified and ready for delivery outside cafeteria.',
    '🤝 Quick 2-minute physical inspection check.',
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-campus-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-bold text-slate-700">Loading Campus Hero Operations...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-subtle space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-campus-dark">Campus Hero Access</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'This dashboard is reserved for approved student Campus Heroes and platform administrators.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/campus-heroes"
              className="px-5 py-2.5 bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Apply to Become a Campus Hero
            </Link>
            <Link
              to="/profile"
              className="px-5 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeTasks = data.tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const completedTasks = data.tasks.filter((t) => t.status === 'COMPLETED');
  const displayedTasks = activeTab === 'active' ? activeTasks : activeTab === 'completed' ? completedTasks : data.tasks;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Hero Identity Banner */}
      <div className="bg-gradient-to-br from-campus-dark via-[#083e35] to-[#04241e] text-white rounded-3xl p-6 sm:p-8 shadow-card border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-campus-light border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Campus Operations Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {data.hero.college_code} Hero Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Managing student pickups, quality verifications, and safe handovers for {data.hero.college_name}.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1 font-medium">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-campus-light" />
              <span>Hero: <strong>{data.hero.name}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-campus-light" />
              <span>{data.hero.college_code} Campus</span>
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-campus-light" />
              <span>{data.hero.phone}</span>
            </span>
          </div>
        </div>

        {/* Messaging Identity Callout */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 max-w-sm text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-campus-light block tracking-wider">
            In-Website Student Messaging
          </span>
          <p className="text-slate-200 leading-snug">
            All messages sent through this dashboard will appear to students as:
          </p>
          <div className="inline-block px-2.5 py-1 rounded-lg bg-campus-primary text-white font-extrabold text-[11px] mt-1 shadow-sm">
            Operations Team — Campus Hero
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Active Tasks
          </span>
          <span className="text-2xl sm:text-3xl font-black text-campus-dark mt-1 block">
            {data.stats.active_tasks_count}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Pending Pickups & Drops</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Pickups Needed
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
            {data.stats.pending_pickups_count}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">From Campus Sellers</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Drops Ready
          </span>
          <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
            {data.stats.pending_drops_count}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">To Student Buyers</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Completed
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
            {data.stats.completed_tasks_count}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Successfully Handed Over</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'bg-campus-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Active Tasks ({activeTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'completed'
              ? 'bg-campus-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed ({completedTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-campus-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>All Tasks ({data.tasks.length})</span>
        </button>
      </div>

      {/* Tasks Queue */}
      <div className="space-y-6">
        {displayedTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No tasks in this view</h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'active'
                ? 'All campus pickups and drops are currently up to date!'
                : 'No completed tasks recorded yet.'}
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isPickup = task.task_type === 'PICKUP' || task.task_type === 'MATCHED_EXCHANGE';
            const isDrop = task.task_type === 'DROP' || task.task_type === 'MATCHED_EXCHANGE';

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden transition-all hover:border-campus-primary/40"
              >
                {/* Task Header Bar */}
                <div className="p-4 sm:p-5 bg-[#F8FAF9] border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      task.task_type === 'MATCHED_EXCHANGE'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : task.task_type === 'PICKUP'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {task.task_type === 'MATCHED_EXCHANGE'
                        ? '⚡ Auto-Matched Direct Exchange'
                        : task.task_type === 'PICKUP'
                        ? '📥 Pickup from Seller'
                        : '📤 Delivery to Buyer'}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : task.status === 'PICKED_UP'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Created on {new Date(task.created_at).toLocaleDateString()} at {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Task Body */}
                <div className="p-5 sm:p-6 space-y-6">
                  
                  {/* Product Strip */}
                  <div className="flex items-center gap-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <img
                      src={task.product.image_url}
                      alt={task.product.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                    />
                    <div className="flex-grow min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {task.product.category}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">
                        {task.product.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      {task.seller && (
                        <div className="text-xs">
                          <span className="text-slate-400 block text-[10px]">Pay Seller:</span>
                          <span className="font-extrabold text-amber-700">₹{task.seller.estimated_payout}</span>
                        </div>
                      )}
                      {task.buyer && (
                        <div className="text-xs mt-0.5">
                          <span className="text-slate-400 block text-[10px]">Collect from Buyer:</span>
                          <span className="font-extrabold text-emerald-700">₹{task.buyer.price_to_collect}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Persons to Contact Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Seller Details Card */}
                    {task.seller ? (
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                            Seller (Pickup)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenChat(task, { id: task.seller!.id, name: task.seller!.name, role: 'SELLER' })}
                            className="px-2.5 py-1 rounded-lg bg-campus-primary hover:bg-campus-primary-hover text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Message Seller</span>
                          </button>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-sm">{task.seller.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {task.seller.phone}</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {task.seller.email}</span>
                          </div>
                        </div>

                        {/* Condition & Assessment */}
                        <div className="text-xs space-y-1 bg-[#F8FAF9] p-2.5 rounded-xl border border-slate-100">
                          <div className="font-semibold text-slate-700">
                            Grade: <span className="font-bold text-slate-900">{task.seller.condition}</span>
                          </div>
                          {task.seller.quality_answers && Object.keys(task.seller.quality_answers).length > 0 && (
                            <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                              {Object.entries(task.seller.quality_answers).map(([k, val]) => (
                                <div key={k} className="flex items-start gap-1">
                                  <span className="text-campus-primary font-bold">•</span>
                                  <span>{val}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Photos Uploaded by Seller */}
                        {task.seller.images && task.seller.images.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Seller's Photos ({task.seller.images.length}):
                            </span>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {task.seller.images.map((img, iIdx) => (
                                <button
                                  type="button"
                                  key={iIdx}
                                  onClick={() => setPreviewPhoto(img)}
                                  className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden hover:border-campus-primary shrink-0 transition-colors"
                                >
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                        Item ready from Campus Inventory
                      </div>
                    )}

                    {/* Buyer Details Card */}
                    {task.buyer ? (
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                            Buyer (Delivery)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenChat(task, { id: task.buyer!.id, name: task.buyer!.name, role: 'BUYER' })}
                            className="px-2.5 py-1 rounded-lg bg-campus-primary hover:bg-campus-primary-hover text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Message Buyer</span>
                          </button>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-sm">{task.buyer.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {task.buyer.phone}</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {task.buyer.email}</span>
                          </div>
                        </div>

                        <div className="bg-[#F8FAF9] p-2.5 rounded-xl border border-slate-100 text-xs">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Collect On Handover</span>
                          <span className="text-base font-extrabold text-slate-900">₹{task.buyer.price_to_collect}</span>
                        </div>

                        {task.buyer.notes && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-xl">
                            "{task.buyer.notes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                        No buyer matched yet. Pick up and hold in campus inventory.
                      </div>
                    )}

                  </div>

                  {/* Operational Verification & Action Controls */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Quality Check Verification Toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={task.quality_verified}
                        onChange={(e) => handleUpdateStatus(task.id, task.status, e.target.checked)}
                        className="w-4 h-4 rounded text-campus-primary focus:ring-campus-primary"
                      />
                      <span>Item Physically Inspected & Verified by Hero</span>
                    </label>

                    {/* Status Transitions */}
                    <div className="flex items-center gap-2">
                      {task.status === 'ASSIGNED' && isPickup && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(task.id, 'PICKED_UP', true)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Picked Up from Seller</span>
                        </button>
                      )}

                      {(task.status === 'PICKED_UP' || (task.status === 'ASSIGNED' && !task.seller)) && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(task.id, 'COMPLETED', true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete & Close Handover</span>
                        </button>
                      )}

                      {task.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                          <Check className="w-3.5 h-3.5" /> Completed Handover
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Messages Preview on Task */}
                  {task.messages && task.messages.length > 0 && (
                    <div className="bg-campus-soft/40 p-3 rounded-2xl border border-campus-primary/20 text-xs space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-campus-dark block">
                        Recent Messages ({task.messages.length}):
                      </span>
                      <div className="space-y-1">
                        {task.messages.slice(-2).map((m) => (
                          <div key={m.id} className="text-slate-700 flex items-start gap-1.5 text-[11px]">
                            <span className="font-bold text-campus-primary shrink-0">
                              {m.is_hero_sender ? 'You (Operations):' : `${m.sender_name}:`}
                            </span>
                            <span className="line-clamp-1">{m.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* IN-WEBSITE MESSAGING MODAL                                     */}
      {/* ============================================================== */}
      {activeChatTask && chatRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Chat Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-campus-dark to-[#063B32] text-white flex items-center justify-between">
              <div>
                <div className="inline-block px-2 py-0.5 rounded bg-white/20 text-campus-light text-[9px] font-extrabold uppercase tracking-wider mb-1">
                  Operations Message
                </div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Chat with {chatRecipient.name} ({chatRecipient.role})
                </h3>
                <span className="text-[11px] text-slate-300 block">
                  Re: {activeChatTask.product.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveChatTask(null);
                  setChatRecipient(null);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Identity Reminder */}
            <div className="bg-emerald-50 px-4 py-2 text-[11px] text-emerald-800 font-bold border-b border-emerald-200 flex items-center justify-between">
              <span>Sending as: <strong>Operations Team — Campus Hero</strong></span>
              <span className="text-[10px] text-emerald-600 font-medium">Visible to student</span>
            </div>

            {/* Chat Thread Messages */}
            <div className="p-4 flex-grow overflow-y-auto space-y-3 bg-[#F8FAF9] min-h-[220px]">
              {activeChatTask.messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No messages yet. Send an operations message to coordinate timing and location!
                </div>
              ) : (
                activeChatTask.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.is_hero_sender ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-0.5 font-semibold px-1">
                      {m.is_hero_sender ? 'Operations Team — Campus Hero' : m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      m.is_hero_sender
                        ? 'bg-campus-primary text-white rounded-tr-none shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-subtle'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Fast Presets */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Quick:</span>
              {presetMessages.map((msg, pIdx) => (
                <button
                  type="button"
                  key={pIdx}
                  onClick={() => setChatMessage(msg)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-campus-primary hover:text-campus-primary transition-colors whitespace-nowrap text-[10px] font-medium shrink-0"
                >
                  {msg.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message as Operations Team..."
                className="flex-grow p-2.5 text-xs rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-1 focus:ring-campus-primary"
              />
              <button
                type="submit"
                disabled={sendingMessage || !chatMessage.trim()}
                className="px-4 py-2.5 bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={previewPhoto}
              alt="Item Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
