import { SmoothInput } from '../../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { api, CampusHeroItem } from '../../services/api';
import {
  ShieldCheck,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Phone,
  Mail,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';

export const AdminCampusHeroes: React.FC = () => {
  const [apps, setApps] = useState<CampusHeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    id: string;
    name: string;
    college: string;
    newStatus: 'APPROVED' | 'REJECTED';
  } | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getCampusHeroes();
      setApps(data);
    } catch (err) {
      console.error('Failed to load campus heroes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      await api.admin.reviewCampusHero(id, status);
      await fetchApps();
    } catch (err: any) {
      alert(err.message || 'Failed to update hero application');
    } finally {
      setUpdatingId(null);
      setConfirmModal(null);
    }
  };

  const filteredApps = apps.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      (item.applicant_name || '').toLowerCase().includes(q) ||
      (item.applicant_email || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.college_code || '').toLowerCase().includes(q) ||
      (item.college_name || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Campus Ambassador Network</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Campus Hero Applications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review student applications to lead recommerce and coordinate physical inspections & deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Applicants: <span className="text-slate-900 font-extrabold">{apps.length}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <SmoothInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search applicant name, email, or campus..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-campus-primary/20"
          >
            <option value="ALL">All Applicants ({apps.length})</option>
            <option value="PENDING">PENDING ({apps.filter((a) => a.status === 'PENDING').length})</option>
            <option value="APPROVED">APPROVED ({apps.filter((a) => a.status === 'APPROVED').length})</option>
            <option value="REJECTED">REJECTED ({apps.filter((a) => a.status === 'REJECTED').length})</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Applications Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredApps.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-extrabold text-lg text-slate-900">{item.applicant_name}</h3>
                  <span className="inline-flex items-center gap-1 font-bold text-campus-primary text-xs bg-campus-soft px-3 py-1 rounded-full border border-campus-primary/30">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.college_code} — {item.college_name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      item.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                    {item.branch} • {item.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {item.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {item.applicant_email}
                  </span>
                  {item.instagram && (
                    <span className="text-slate-500">IG: @{item.instagram}</span>
                  )}
                  {item.linkedin && (
                    <a
                      href={item.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-campus-primary hover:underline flex items-center gap-1"
                    >
                      LinkedIn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Statement of Interest:</span>
                  <p className="leading-relaxed">"{item.reason}"</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col items-center gap-2 justify-end">
                {item.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() =>
                        setConfirmModal({
                          id: item.id,
                          name: item.applicant_name || 'Applicant',
                          college: item.college_code || 'Campus',
                          newStatus: 'APPROVED',
                        })
                      }
                      disabled={updatingId === item.id}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Hero</span>
                    </button>
                    <button
                      onClick={() =>
                        setConfirmModal({
                          id: item.id,
                          name: item.applicant_name || 'Applicant',
                          college: item.college_code || 'Campus',
                          newStatus: 'REJECTED',
                        })
                      }
                      disabled={updatingId === item.id}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      setConfirmModal({
                        id: item.id,
                        name: item.applicant_name || 'Applicant',
                        college: item.college_code || 'Campus',
                        newStatus: item.status === 'APPROVED' ? 'REJECTED' : 'APPROVED',
                      })
                    }
                    disabled={updatingId === item.id}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
                  >
                    Change to {item.status === 'APPROVED' ? 'REJECTED' : 'APPROVED'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-2xl ${
                  confirmModal.newStatus === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {confirmModal.newStatus === 'APPROVED' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {confirmModal.newStatus === 'APPROVED' ? 'Approve Campus Hero?' : 'Reject Application?'}
                </h3>
                <p className="text-[11px] text-slate-500">Confirm ambassador status</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to mark <strong className="text-slate-900">{confirmModal.name}</strong> ({confirmModal.college}) as <span className="font-bold uppercase">{confirmModal.newStatus}</span>?
            </p>

            {confirmModal.newStatus === 'APPROVED' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 mb-5 leading-normal">
                Approving this application will automatically upgrade the student's account role to <strong className="font-bold">CAMPUS_HERO</strong>, granting access to coordinate deliveries for {confirmModal.college}.
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(confirmModal.id, confirmModal.newStatus)}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                  confirmModal.newStatus === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {confirmModal.newStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
