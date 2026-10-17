import React, { useEffect, useState } from 'react';
import { api, CampusHeroItem } from '../../services/api';
import { ShieldCheck, MapPin, CheckCircle, XCircle, Clock, ExternalLink, Phone, Mail } from 'lucide-react';

export const AdminCampusHeroes: React.FC = () => {
  const [apps, setApps] = useState<CampusHeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Campus Hero Applications</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review student applications to lead recommerce and coordinate transactions in their college.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Applications Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Student applications will appear here as they apply.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {apps.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-extrabold text-lg text-slate-900">{item.applicant_name}</h3>
                  <span className="inline-flex items-center gap-1 font-bold text-campus-primary text-xs bg-campus-soft px-3 py-1 rounded-full border border-campus-primary/30">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.college_code} — {item.college_name}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
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
                    <span className="text-slate-500">
                      IG: @{item.instagram}
                    </span>
                  )}
                  {item.linkedin && (
                    <a
                      href={item.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-campus-primary font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="bg-[#F8FAF9] p-3 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-1">Reason for joining:</strong>
                  "{item.reason}"
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                {item.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleReview(item.id, 'APPROVED')}
                    disabled={updatingId === item.id}
                    className="px-4 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Hero</span>
                  </button>
                )}

                {item.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleReview(item.id, 'REJECTED')}
                    disabled={updatingId === item.id}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
