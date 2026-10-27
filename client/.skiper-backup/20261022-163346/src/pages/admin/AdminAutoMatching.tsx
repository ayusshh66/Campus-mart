import React, { useEffect, useState } from 'react';
import { api, AutoMatchRule } from '../../services/api';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Truck, 
  ShieldCheck, 
  Package, 
  MapPin, 
  Camera, 
  Layers, 
  Save, 
  Clock, 
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminAutoMatching: React.FC = () => {
  const [rules, setRules] = useState<AutoMatchRule[]>([]);
  const [deliveryTasks, setDeliveryTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'tasks'>('rules');

  // Form states per product id
  const [editedRules, setEditedRules] = useState<Record<string, Partial<AutoMatchRule>>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, tasksData] = await Promise.all([
        api.admin.getAutoMatchRules(),
        api.admin.getDeliveryTasks().catch(() => []),
      ]);
      setRules(rulesData);
      setDeliveryTasks(tasksData);

      // Pre-fill edited states
      const initialMap: Record<string, Partial<AutoMatchRule>> = {};
      rulesData.forEach((r) => {
        initialMap[r.id] = {
          auto_match_enabled: r.auto_match_enabled,
          max_campus_inventory: r.max_campus_inventory,
          auto_accept_conditions: r.auto_accept_conditions,
          require_photos_for_auto: r.require_photos_for_auto,
          min_payout_for_auto: r.min_payout_for_auto || 0,
        };
      });
      setEditedRules(initialMap);
    } catch (err: any) {
      console.error('Failed to load auto-match data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFieldChange = (productId: string, field: keyof AutoMatchRule, value: any) => {
    setEditedRules((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleConditionToggle = (productId: string, condition: string) => {
    const currentList = editedRules[productId]?.auto_accept_conditions || [];
    let updated: string[];
    if (currentList.includes(condition)) {
      updated = currentList.filter((c) => c !== condition);
    } else {
      updated = [...currentList, condition];
    }
    handleFieldChange(productId, 'auto_accept_conditions', updated);
  };

  const handleSaveRule = async (productId: string) => {
    const payload = editedRules[productId];
    if (!payload) return;

    setSavingId(productId);
    setSaveSuccessId(null);
    try {
      await api.admin.updateAutoMatchRule(productId, payload);
      setSaveSuccessId(productId);
      setTimeout(() => setSaveSuccessId(null), 3000);
      // Refresh local rule
      const updatedRules = await api.admin.getAutoMatchRules();
      setRules(updatedRules);
    } catch (err: any) {
      alert(err.message || 'Failed to save auto-match rule');
    } finally {
      setSavingId(null);
    }
  };

  const handleRunScan = async () => {
    setRunningCycle(true);
    setScanResult(null);
    try {
      const res = await api.admin.runAutoMatchScan();
      const matchCount = res.data?.matches_created || 0;
      setScanResult(`Scan complete! ${matchCount} new requests auto-matched and assigned to campus hero delivery.`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Auto-match scan failed');
    } finally {
      setRunningCycle(false);
    }
  };

  const conditionOptions = ['Like New', 'Good', 'Fair', 'Poor'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Recommerce Logic</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Auto-Matching & Hero Dispatch Control
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
              Enforce admin rules per catalog item (e.g. limit to 10 calculators per campus, strict condition grades, photo verification). When criteria are satisfied, CampusMart automatically approves the seller request and assigns pickup & drop tasks directly to the Campus Hero.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleRunScan}
              disabled={runningCycle}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-campus-primary hover:from-indigo-600 hover:to-campus-primary-hover text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${runningCycle ? 'animate-spin' : ''}`} />
              <span>{runningCycle ? 'Scanning Requests...' : 'Run Auto-Match Scan Now'}</span>
            </button>
            <Link
              to="/hero-dashboard"
              target="_blank"
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Preview Hero View</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </div>

        {scanResult && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{scanResult}</span>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-campus-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Auto-Match Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'bg-campus-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Hero Delivery Tasks ({deliveryTasks.length})</span>
        </button>
      </div>

      {/* Tab 1: Product Matching Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Inventory & Capacity Rule:</strong> If a campus already reaches the configured cap (e.g. 10 calculators), subsequent requests are held in standard pending review instead of auto-matching. Adjust limits below per item.
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs">
              Loading Auto-Match Rules...
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">No Products Found</h3>
              <p className="text-xs text-slate-500">Add products to your catalog first to configure auto-matching.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {rules.map((product) => {
                const draft = editedRules[product.id] || {};
                const isEnabled = draft.auto_match_enabled ?? product.auto_match_enabled;
                const maxInv = draft.max_campus_inventory ?? product.max_campus_inventory;
                const reqPhotos = draft.require_photos_for_auto ?? product.require_photos_for_auto;
                const selectedConditions = draft.auto_accept_conditions ?? product.auto_accept_conditions;
                const isSaving = savingId === product.id;
                const isSaved = saveSuccessId === product.id;

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-3xl p-6 border transition-all shadow-subtle ${
                      isEnabled ? 'border-indigo-200 ring-1 ring-indigo-50/50' : 'border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-100">
                      {/* Product Overview */}
                      <div className="flex items-center gap-4">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-base">{product.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {product.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                            <span>Admin Buy: <strong className="text-slate-800">₹{product.buy_price}</strong></span>
                            <span>•</span>
                            <span>Selling: <strong className="text-slate-800">₹{product.sell_price}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Master Toggle */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                          <span className="text-xs font-bold text-slate-700">
                            Auto-Match Engine:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(product.id, 'auto_match_enabled', !isEnabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
                              isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-extrabold ${isEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {isEnabled ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>

                        {/* Save Button */}
                        <button
                          type="button"
                          onClick={() => handleSaveRule(product.id)}
                          disabled={isSaving}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                            isSaved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                          }`}
                        >
                          {isSaving ? (
                            <span>Saving...</span>
                          ) : isSaved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Saved!</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Rules</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Rule Parameters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                      {/* Parameter 1: Max Campus Inventory Cap (e.g. 10 calculators) */}
                      <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-800">
                            Max Campus Inventory Limit
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">Per College</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                          Auto-match stops once college stock hits this quota (e.g. max 10 calculators).
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={maxInv}
                            onChange={(e) =>
                              handleFieldChange(
                                product.id,
                                'max_campus_inventory',
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-24 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                          />
                          <span className="text-xs font-semibold text-slate-500">units per campus</span>
                        </div>
                      </div>

                      {/* Parameter 2: Allowed Condition Grades */}
                      <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-slate-200/80">
                        <label className="text-xs font-bold text-slate-800 block mb-1.5">
                          Auto-Accept Conditions
                        </label>
                        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                          Only submissions with selected condition will trigger instant match & pickup.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {conditionOptions.map((cond) => {
                            const isChecked = selectedConditions.includes(cond);
                            return (
                              <button
                                key={cond}
                                type="button"
                                onClick={() => handleConditionToggle(product.id, cond)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                                  isChecked
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {cond}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Parameter 3: Photos Mandatory */}
                      <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1.5">
                            Mandatory Photos Check
                          </label>
                          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                            Require student to upload at least one real photo before auto-assigning hero pickup.
                          </p>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200">
                          <input
                            type="checkbox"
                            checked={reqPhotos}
                            onChange={(e) =>
                              handleFieldChange(product.id, 'require_photos_for_auto', e.target.checked)
                            }
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-700">
                            Require Uploaded Photos
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Delivery & Hero Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {deliveryTasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">No Delivery Tasks Yet</h3>
              <p className="text-xs text-slate-500">
                When auto-matching triggers or requests are accepted, pickup & drop tasks assigned to campus heroes appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {deliveryTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                          {task.task_type.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {task.product?.name || 'Recommerce Item'}
                        </h4>
                        <span className="text-xs text-slate-400 font-bold">
                          📍 {task.college?.code || 'Campus'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span>
                          Campus Hero:{' '}
                          <strong className="text-slate-800">
                            {task.campus_hero?.name || 'Assigned Hero'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Status:{' '}
                          <strong className="text-indigo-600 font-bold">
                            {task.status}
                          </strong>
                        </span>
                        {task.quality_verified && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" /> Quality Verified
                            </span>
                          </>
                        )}
                      </div>

                      {/* Seller & Buyer details */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {task.seller && (
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Seller</span>
                            <span className="font-bold">{task.seller.name}</span> ({task.seller.phone})
                          </div>
                        )}
                        {task.buyer && (
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Buyer</span>
                            <span className="font-bold">{task.buyer.name}</span> ({task.buyer.phone})
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">In-Website Chat</span>
                          <span className="font-bold text-indigo-600 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {task.messages?.length || 0} messages sent as Operations Team
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to="/hero-dashboard"
                      target="_blank"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
                    >
                      <span>Hero Dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
