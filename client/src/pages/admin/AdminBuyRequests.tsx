import React, { useEffect, useState } from 'react';
import { api, BuyRequestItem } from '../../services/api';
import { ShoppingBag, MapPin, CheckCircle, Clock, CheckCircle2, XCircle, Phone, Mail } from 'lucide-react';

export const AdminBuyRequests: React.FC = () => {
  const [requests, setRequests] = useState<BuyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getBuyRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load buy requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      await api.admin.reviewBuyRequest(id, newStatus);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update buy request status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Student Purchase & Interest Requests</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track buyer requests, coordinate campus meetups, and mark items as completed.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF9] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-6">Buyer & Contact</th>
                <th className="py-4 px-4">Campus</th>
                <th className="py-4 px-4">Product Requested</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading buy requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No buy requests submitted yet.</td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">{r.buyer_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{r.buyer_phone}</span>
                        <span>•</span>
                        <span>{r.buyer_email}</span>
                      </div>
                      {r.notes && (
                        <div className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          "{r.notes}"
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-campus-dark text-xs">
                        <MapPin className="w-3 h-3 text-campus-primary" />
                        {r.college_code}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800 text-xs">
                        {r.product_name}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-campus-dark text-sm">
                      ₹{r.selling_price}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        r.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <select
                        value={r.status}
                        disabled={updatingId === r.id}
                        onChange={(e) => handleStatusChange(r.id, e.target.value as any)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-campus-primary cursor-pointer"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
