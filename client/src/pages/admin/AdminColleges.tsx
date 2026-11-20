import { SmoothInput } from '../../components/motion/SmoothInput';
import React, { useEffect, useState, useMemo } from 'react';
import { api, College } from '../../services/api';
import { 
  Building2, 
  PlusCircle, 
  Search, 
  Check, 
  X, 
  Edit3, 
  Power, 
  Users, 
  Tag, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface Props {
  onAction?: () => void;
}

export const AdminColleges: React.FC<Props> = ({ onAction }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  
  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Feedback messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getColleges();
      setColleges(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load colleges.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const clearFeedbackAfterDelay = () => {
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const openAddModal = () => {
    setCode('');
    setName('');
    setIsActive(true);
    setShowAddModal(true);
  };

  const openEditModal = (college: College) => {
    setEditingCollege(college);
    setCode(college.code);
    setName(college.name);
    setIsActive(college.is_active);
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFeedback({ type: 'error', message: 'Both college code and full name are required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.admin.createCollege({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        is_active: isActive,
      });

      setFeedback({ type: 'success', message: res.message || 'College added successfully!' });
      setShowAddModal(false);
      setCode('');
      setName('');
      await fetchColleges();
      if (onAction) onAction();
      clearFeedbackAfterDelay();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add college.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollege) return;
    if (!code.trim() || !name.trim()) {
      setFeedback({ type: 'error', message: 'Both college code and full name are required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.admin.updateCollege(editingCollege.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        is_active: isActive,
      });

      setFeedback({ type: 'success', message: res.message || 'College updated successfully!' });
      setEditingCollege(null);
      await fetchColleges();
      if (onAction) onAction();
      clearFeedbackAfterDelay();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update college.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (college: College) => {
    setTogglingId(college.id);
    setFeedback(null);
    try {
      const res = await api.admin.toggleCollegeStatus(college.id);
      setFeedback({
        type: 'success',
        message: res.message || `College ${college.code} status updated.`,
      });
      await fetchColleges();
      if (onAction) onAction();
      clearFeedbackAfterDelay();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle status.' });
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered colleges list
  const filteredColleges = useMemo(() => {
    return colleges.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && c.is_active) ||
        (filterStatus === 'INACTIVE' && !c.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [colleges, searchQuery, filterStatus]);

  // High-level metrics
  const totalCount = colleges.length;
  const activeCount = colleges.filter((c) => c.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const totalStudents = colleges.reduce((sum, c) => sum + (c._count?.users || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Campus Network Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F7F0] tracking-tight">
            Colleges & Campuses
          </h2>
          <p className="text-xs text-[#A6B09F] mt-0.5">
            Manage supported university branches. Active colleges appear dynamically in registration and student browsing.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New College</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#181D14] border border-white/10/80 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C6DE41]/10 text-[#C6DE41] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#F5F7F0]">{totalCount}</div>
            <div className="text-[11px] font-semibold text-[#A6B09F] uppercase">Total Campuses</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181D14] border border-white/10/80 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C6DE41]/10 text-[#C6DE41] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#C6DE41]">{activeCount}</div>
            <div className="text-[11px] font-semibold text-[#A6B09F] uppercase">Active Campuses</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181D14] border border-white/10/80 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#242C20] text-[#B7C1B0] flex items-center justify-center shrink-0">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#D3DACD]">{inactiveCount}</div>
            <div className="text-[11px] font-semibold text-[#A6B09F] uppercase">Inactive Campuses</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181D14] border border-white/10/80 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C6DE41]/15 text-[#181D14] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#181D14]">{totalStudents}</div>
            <div className="text-[11px] font-semibold text-[#A6B09F] uppercase">Enrolled Students</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-[#C6DE41]/10 border border-[#C6DE41]/20 text-[#D9EBA8]'
              : 'bg-rose-500/10 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#C6DE41] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#181D14] p-4 rounded-2xl border border-white/10/80 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8F9A89] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <SmoothInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or college name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-2 focus:ring-campus-primary/30"
          />
        </div>

        {/* Status Filters */}
        <div className="inline-flex rounded-xl bg-[#242C20] p-1 border border-white/10/80 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all ${
              filterStatus === 'ALL'
                ? 'bg-[#181D14] text-[#F5F7F0] shadow-sm'
                : 'text-[#A6B09F] hover:text-[#E8EDE2]'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              filterStatus === 'ACTIVE'
                ? 'bg-[#181D14] text-[#C6DE41] shadow-sm'
                : 'text-[#A6B09F] hover:text-[#E8EDE2]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#C6DE41]/100" />
            <span>Active ({activeCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('INACTIVE')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              filterStatus === 'INACTIVE'
                ? 'bg-[#181D14] text-[#E8EDE2] shadow-sm'
                : 'text-[#A6B09F] hover:text-[#E8EDE2]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Inactive ({inactiveCount})</span>
          </button>
        </div>
      </div>

      {/* Colleges Table */}
      <div className="bg-[#181D14] rounded-3xl border border-white/10/80 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-[#242C20] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredColleges.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-[#E8EDE2] text-sm">No Colleges Found</h3>
            <p className="text-xs text-[#A6B09F] mt-1">
              {searchQuery ? `No colleges matching "${searchQuery}"` : 'No colleges in this status category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#12160F]/75 text-[11px] font-extrabold uppercase tracking-wider text-[#A6B09F]">
                  <th className="py-3.5 px-4 sm:px-6">Code</th>
                  <th className="py-3.5 px-4">College Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Students</th>
                  <th className="py-3.5 px-4 text-center">Sell Inquiries</th>
                  <th className="py-3.5 px-4 text-center">Buy Requests</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {filteredColleges.map((col) => (
                  <tr key={col.id} className="hover:bg-[#283225]/60 transition-colors">
                    {/* Code Badge */}
                    <td className="py-3.5 px-4 sm:px-6 font-bold">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-campus-soft border border-campus-primary/30 text-[#F5F7F0] font-extrabold text-xs">
                        {col.code}
                      </div>
                    </td>

                    {/* Full Name */}
                    <td className="py-3.5 px-4 font-semibold text-[#E8EDE2]">
                      <div>{col.name}</div>
                      <div className="text-[10px] text-[#8F9A89] font-mono mt-0.5">ID: {col.id.slice(0, 8)}...</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {col.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C6DE41]/10 border border-[#C6DE41]/20 text-[#D9EBA8] text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C6DE41]/100 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#242C20] border border-white/10 text-[#B7C1B0] text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>

                    {/* Students Count */}
                    <td className="py-3.5 px-4 text-center font-bold text-[#D3DACD]">
                      {col._count?.users || 0}
                    </td>

                    {/* Sell Requests Count */}
                    <td className="py-3.5 px-4 text-center font-semibold text-[#C6DE41]">
                      {col._count?.sell_requests || 0}
                    </td>

                    {/* Buy Requests Count */}
                    <td className="py-3.5 px-4 text-center font-bold text-[#181D14]">
                      {col._count?.buy_requests || 0}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 sm:px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(col)}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/15 bg-[#181D14] text-[#D3DACD] hover:text-[#F5F7F0] font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                        title="Edit College Details"
                      >
                        <Edit3 className="w-3 h-3 text-[#A6B09F]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(col)}
                        disabled={togglingId === col.id}
                        className={`px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition-colors inline-flex items-center gap-1 ${
                          col.is_active
                            ? 'border-amber-200 bg-amber-500/10 text-amber-800 hover:bg-amber-100'
                            : 'border-[#C6DE41]/20 bg-[#C6DE41]/10 text-[#D9EBA8] hover:bg-[#C6DE41]/15'
                        }`}
                        title={col.is_active ? 'Deactivate College' : 'Activate College'}
                      >
                        <Power className="w-3 h-3" />
                        <span>{togglingId === col.id ? 'Saving...' : col.is_active ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD COLLEGE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181D14] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/10 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-campus-soft text-campus-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#F5F7F0] text-base">Add New College</h3>
                  <p className="text-[11px] text-[#8F9A89]">Expand CampusMart to a new campus</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#8F9A89] hover:text-[#B7C1B0] hover:bg-[#30392A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollege} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D3DACD] mb-1.5">
                  College Code <span className="text-rose-500">*</span>
                </label>
                <SmoothInput
                  type="text"
                  required
                  placeholder="e.g. DTU, NSUT, IITD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-3 text-xs sm:text-sm font-bold tracking-wider rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 uppercase"
                />
                <span className="text-[10px] text-[#8F9A89] mt-1 block">Short abbreviation (2-20 characters, e.g. BPIT).</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D3DACD] mb-1.5">
                  Full College Name <span className="text-rose-500">*</span>
                </label>
                <SmoothInput
                  type="text"
                  required
                  placeholder="e.g. Delhi Technological University"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-2 focus:ring-campus-primary/30"
                />
                <span className="text-[10px] text-[#8F9A89] mt-1 block">Official university or institute name.</span>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <SmoothInput
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-campus-primary focus:ring-campus-primary"
                  />
                  <span className="text-xs font-semibold text-[#D3DACD]">
                    Enable college immediately for student registration and browsing
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-[#B7C1B0] hover:bg-[#283225] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create College'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COLLEGE MODAL */}
      {editingCollege && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181D14] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/10 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-campus-soft text-campus-primary flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#F5F7F0] text-base">Edit College</h3>
                  <p className="text-[11px] text-[#8F9A89]">Update code, name, and operational status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCollege(null)}
                className="p-1 rounded-lg text-[#8F9A89] hover:text-[#B7C1B0] hover:bg-[#30392A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCollege} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D3DACD] mb-1.5">
                  College Code <span className="text-rose-500">*</span>
                </label>
                <SmoothInput
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-3 text-xs sm:text-sm font-bold tracking-wider rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D3DACD] mb-1.5">
                  Full College Name <span className="text-rose-500">*</span>
                </label>
                <SmoothInput
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-2 focus:ring-campus-primary/30"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <SmoothInput
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-campus-primary focus:ring-campus-primary"
                  />
                  <span className="text-xs font-semibold text-[#D3DACD]">
                    College is Active (unchecking will deactivate this campus)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingCollege(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-[#B7C1B0] hover:bg-[#283225] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminColleges;
