import { SmoothInput } from '../../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { api, CustomItemSubmissionItem } from '../../services/api';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MapPin, 
  Tag, 
  Eye, 
  Phone, 
  Mail, 
  ExternalLink, 
  Check, 
  X, 
  Clock,
  Layers,
  Banknote,
  Search
} from 'lucide-react';

interface Props {
  onAction?: () => void;
}

export const AdminCustomSubmissions: React.FC<Props> = ({ onAction }) => {
  const [submissions, setSubmissions] = useState<CustomItemSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Review pricing drafts: [id] -> { buyPrice: number, sellPrice: number, reason: string }
  const [drafts, setDrafts] = useState<Record<string, { buy: number; sell: number; reason: string }>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Image preview modal
  const [inspectingImages, setInspectingImages] = useState<{ title: string; images: string[] } | null>(null);

  // Review Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    id: string;
    name: string;
    studentName: string;
    collegeCode: string;
    action: 'APPROVE' | 'REJECT';
    buy: number;
    sell: number;
    reason: string;
  } | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getCustomSubmissions(statusFilter === 'ALL' ? undefined : statusFilter);
      setSubmissions(data);

      // Initialize drafts
      const initialDrafts: Record<string, { buy: number; sell: number; reason: string }> = {};
      data.forEach((sub) => {
        initialDrafts[sub.id] = {
          buy: sub.admin_buy_price || sub.expected_price || 0,
          sell: sub.admin_sell_price || Math.round((sub.expected_price || 100) * 1.3),
          reason: sub.rejection_reason || '',
        };
      });
      setDrafts(initialDrafts);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load custom submissions.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handlePriceChange = (id: string, field: 'buy' | 'sell' | 'reason', val: any) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val,
      },
    }));
  };

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const draft = drafts[id];
    if (action === 'APPROVE') {
      if (!draft || draft.buy <= 0 || draft.sell <= 0) {
        alert('Please specify valid positive buying and selling prices.');
        return;
      }
    }

    setProcessingId(id);
    setFeedback(null);
    try {
      const res = await api.admin.reviewCustomSubmission(id, {
        action,
        admin_buy_price: draft?.buy,
        admin_sell_price: draft?.sell,
        rejection_reason: draft?.reason,
      });

      setFeedback({
        type: 'success',
        message: res.message || `Submission marked as ${action.toLowerCase()}d.`,
      });
      await fetchSubmissions();
      if (onAction) onAction();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.student_name && sub.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.college_code && sub.college_code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#D9EBA8] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C6DE41]" />
            <span>Custom Second-Hand Item Queue</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F7F0] tracking-tight">
            Review Custom Item Submissions
          </h2>
          <p className="text-xs text-[#A6B09F] mt-0.5">
            Students can submit any unlisted item. Approving assigns valuation, creates a catalog product, and makes it live on the student's campus.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-xl bg-[#242C20] p-1 border border-white/10 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'PENDING' ? 'bg-[#181D14] text-[#F5F7F0] shadow-sm' : 'text-[#A6B09F] hover:text-[#E8EDE2]'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'APPROVED' ? 'bg-[#181D14] text-[#C6DE41] shadow-sm' : 'text-[#A6B09F] hover:text-[#E8EDE2]'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'REJECTED' ? 'bg-[#181D14] text-rose-700 shadow-sm' : 'text-[#A6B09F] hover:text-[#E8EDE2]'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ALL' ? 'bg-[#181D14] text-[#F5F7F0] shadow-sm' : 'text-[#A6B09F] hover:text-[#E8EDE2]'
            }`}
          >
            All Submissions
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm ${
            feedback.type === 'success'
              ? 'bg-[#C6DE41]/10 border border-[#C6DE41]/20 text-[#D9EBA8]'
              : 'bg-rose-500/10 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#C6DE41] shrink-0" />
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

      {/* Search Bar */}
      <div className="bg-[#181D14] p-3.5 rounded-2xl border border-white/10/80 shadow-subtle flex items-center gap-3">
        <Search className="w-4 h-4 text-[#8F9A89] shrink-0" />
        <SmoothInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by item name, student, or campus code..."
          className="w-full text-xs bg-transparent focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-[#8F9A89] hover:text-[#B7C1B0]">
            Clear
          </button>
        )}
      </div>

      {/* List of Submissions */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-[#242C20] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-[#181D14] rounded-3xl p-12 text-center border border-white/10">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#E8EDE2] text-base">
            No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} Custom Submissions
          </h3>
          <p className="text-xs text-[#A6B09F] mt-1">
            {statusFilter === 'PENDING'
              ? 'All custom second-hand items have been reviewed! New student submissions will appear here.'
              : 'No items match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const draft = drafts[sub.id] || {
              buy: sub.admin_buy_price || sub.expected_price || 0,
              sell: sub.admin_sell_price || Math.round((sub.expected_price || 100) * 1.3),
              reason: sub.rejection_reason || '',
            };
            const images = sub.images || [];

            return (
              <div
                key={sub.id}
                className="bg-[#181D14] rounded-3xl p-6 border border-white/10/90 shadow-subtle hover:border-campus-primary/30 transition-all flex flex-col lg:flex-row items-start justify-between gap-6"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 flex-grow">
                  {/* Photo thumbnail */}
                  <div
                    onClick={() => {
                      if (images.length > 0) {
                        setInspectingImages({ title: sub.name, images });
                      }
                    }}
                    className="w-24 h-24 rounded-2xl bg-[#242C20] border border-white/10 overflow-hidden shrink-0 cursor-pointer relative group flex items-center justify-center"
                    title="Click to inspect images"
                  >
                    {images.length > 0 ? (
                      <>
                        <img
                          src={images[0]}
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                        {images.length > 1 && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                            +{images.length - 1}
                          </span>
                        )}
                      </>
                    ) : (
                      <Tag className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#242C20] text-[#D3DACD] text-[10px] font-bold uppercase">
                        {sub.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] text-[10px] font-bold">
                        Condition: {sub.condition}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-campus-soft text-[#F5F7F0] text-[10px] font-extrabold border border-campus-primary/30">
                        <MapPin className="w-3 h-3 text-campus-primary" />
                        {sub.college_code} Campus
                      </span>
                      {sub.status === 'APPROVED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#C6DE41]/15 text-[#D9EBA8] text-[10px] font-bold">
                          ✓ Live on Campus
                        </span>
                      )}
                      {sub.status === 'REJECTED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          ✕ Rejected
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#F5F7F0] leading-snug">
                      {sub.name}
                    </h3>

                    <p className="text-xs text-[#B7C1B0] line-clamp-2 max-w-xl">
                      {sub.description}
                    </p>

                    {/* Student Info */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#A6B09F]">
                      <span className="font-medium text-[#D3DACD]">
                        Seller: <strong>{sub.student_name || 'Student'}</strong>
                      </span>
                      {sub.student_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#8F9A89]" />
                          {sub.student_phone}
                        </span>
                      )}
                      {sub.student_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#8F9A89]" />
                          {sub.student_email}
                        </span>
                      )}
                      <span className="text-[#8F9A89] text-[10px]">
                        Submitted: {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Student's Asking Price */}
                    <div className="pt-1">
                      <span className="text-xs text-[#A6B09F]">Student Expected Price: </span>
                      <span className="text-sm font-black text-[#F5F7F0]">₹{sub.expected_price.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Rejection notice if rejected */}
                    {sub.status === 'REJECTED' && sub.rejection_reason && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-200 text-rose-800 text-xs">
                        <strong>Rejection Reason:</strong> {sub.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Review Controls */}
                <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 space-y-3">
                  {sub.status === 'PENDING' ? (
                    <>
                      <div className="text-[11px] font-bold text-[#D3DACD] uppercase tracking-wider">
                        Set Official Valuation
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#A6B09F] mb-1">
                            Pay Seller (₹)
                          </label>
                          <SmoothInput
                            type="number"
                            min="1"
                            value={draft.buy}
                            onChange={(e) => handlePriceChange(sub.id, 'buy', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 text-xs font-bold rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-1 focus:ring-campus-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#A6B09F] mb-1">
                            Catalog Price (₹)
                          </label>
                          <SmoothInput
                            type="number"
                            min="1"
                            value={draft.sell}
                            onChange={(e) => handlePriceChange(sub.id, 'sell', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 text-xs font-bold rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-1 focus:ring-campus-primary"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!draft || draft.buy <= 0 || draft.sell <= 0) {
                              alert('Please specify valid positive buying and selling prices.');
                              return;
                            }
                            setConfirmModal({
                              id: sub.id,
                              name: sub.name,
                              studentName: sub.student_name || 'Student',
                              collegeCode: sub.college_code || 'Campus',
                              action: 'APPROVE',
                              buy: draft.buy,
                              sell: draft.sell,
                              reason: '',
                            });
                          }}
                          disabled={processingId === sub.id}
                          className="flex-1 py-2 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & List</span>
                        </button>

                        <button
                          onClick={() => {
                            setConfirmModal({
                              id: sub.id,
                              name: sub.name,
                              studentName: sub.student_name || 'Student',
                              collegeCode: sub.college_code || 'Campus',
                              action: 'REJECT',
                              buy: draft?.buy || 0,
                              sell: draft?.sell || 0,
                              reason: draft?.reason || 'Item does not meet platform quality or policy standards.',
                            });
                          }}
                          disabled={processingId === sub.id}
                          className="py-2 px-3 rounded-xl border border-rose-200 hover:bg-rose-500/10 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </>
                  ) : sub.status === 'APPROVED' ? (
                    <div className="p-3 bg-[#C6DE41]/10 rounded-2xl border border-[#C6DE41]/20 text-xs text-emerald-900 space-y-1">
                      <div className="font-extrabold flex items-center gap-1 text-[#D9EBA8]">
                        <CheckCircle className="w-4 h-4 text-[#C6DE41]" />
                        <span>Live on Campus</span>
                      </div>
                      <div className="text-[11px] text-[#C6DE41]">
                        Paid to student: <strong>₹{sub.admin_buy_price}</strong> | Buyer price: <strong>₹{sub.admin_sell_price}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#242C20] rounded-2xl text-xs text-[#B7C1B0] space-y-1">
                      <div className="font-bold text-[#D3DACD]">Submission Rejected</div>
                      <div className="text-[11px] text-[#A6B09F]">Student notified of rejection.</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL PHOTO INSPECTION MODAL */}
      {inspectingImages && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181D14] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-[#F5F7F0] text-sm">
                Item Images: {inspectingImages.title}
              </h3>
              <button
                onClick={() => setInspectingImages(null)}
                className="p-1.5 rounded-lg text-[#8F9A89] hover:text-[#B7C1B0] hover:bg-[#30392A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {inspectingImages.images.map((img, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 overflow-hidden bg-[#242C20] aspect-square">
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </div>
              ))}
            </div>

            <div className="text-right">
              <button
                onClick={() => setInspectingImages(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181D14] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-2xl ${
                  confirmModal.action === 'APPROVE'
                    ? 'bg-[#C6DE41]/15 text-[#C6DE41]'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {confirmModal.action === 'APPROVE' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#F5F7F0]">
                  {confirmModal.action === 'APPROVE' ? 'Approve & Publish Item?' : 'Reject Submission?'}
                </h3>
                <p className="text-[11px] text-[#A6B09F]">Custom item moderation</p>
              </div>
            </div>

            <p className="text-xs text-[#B7C1B0] mb-3 leading-relaxed">
              {confirmModal.action === 'APPROVE' ? (
                <>
                  Approving <strong className="text-[#F5F7F0]">{confirmModal.name}</strong> will create a new catalog product, create an approved sell request, and make it dynamically available on the <strong className="text-[#F5F7F0]">{confirmModal.collegeCode}</strong> campus.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong className="text-[#F5F7F0]">{confirmModal.name}</strong> submitted by <strong className="text-[#F5F7F0]">{confirmModal.studentName}</strong>? The item will NOT be published.
                </>
              )}
            </p>

            {confirmModal.action === 'APPROVE' && (
              <div className="p-3 bg-[#C6DE41]/10 border border-[#C6DE41]/20 rounded-xl text-[11px] text-[#D9EBA8] mb-4 leading-normal">
                Payout to student: <strong className="font-bold">₹{confirmModal.buy}</strong> • Campus selling price: <strong className="font-bold">₹{confirmModal.sell}</strong>.
              </div>
            )}

            {confirmModal.action === 'REJECT' && (
              <div className="mb-4">
                <label className="block text-[10px] font-bold uppercase text-[#A6B09F] mb-1">
                  Rejection Reason (shared with student)
                </label>
                <textarea
                  rows={2}
                  value={confirmModal.reason}
                  onChange={(e) =>
                    setConfirmModal({ ...confirmModal, reason: e.target.value })
                  }
                  className="w-full p-2 text-xs rounded-xl border border-white/10 bg-[#12160F] focus:bg-[#181D14] focus:outline-none focus:ring-1 focus:ring-campus-primary resize-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#B7C1B0] hover:bg-[#30392A] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const m = confirmModal;
                  setConfirmModal(null);
                  if (m.action === 'REJECT') {
                    handlePriceChange(m.id, 'reason', m.reason);
                  }
                  await handleReview(m.id, m.action);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                  confirmModal.action === 'APPROVE'
                    ? 'bg-campus-primary hover:bg-campus-primary-hover'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {confirmModal.action === 'APPROVE' ? 'Approve & List' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCustomSubmissions;
