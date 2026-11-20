import { SmoothInput } from '../../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { api, BuyRequestItem } from '../../services/api';
import {
  ShoppingBag,
  MapPin,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';

export const AdminBuyRequests: React.FC = () => {
  const [requests, setRequests] = useState<BuyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'>('ALL');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    id: string;
    buyerName: string;
    productName: string;
    newStatus: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  } | null>(null);

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

  const initiateStatusChange = (id: string, buyerName: string, productName: string, newStatus: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED') => {
    if (newStatus === 'REJECTED' || newStatus === 'COMPLETED') {
      setConfirmModal({ id, buyerName, productName, newStatus });
    } else {
      executeStatusChange(id, newStatus);
    }
  };

  const executeStatusChange = async (id: string, newStatus: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      await api.admin.reviewBuyRequest(id, newStatus);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update buy request status');
    } finally {
      setUpdatingId(null);
      setConfirmModal(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      (r.buyer_name || '').toLowerCase().includes(q) ||
      (r.buyer_email || '').toLowerCase().includes(q) ||
      (r.buyer_phone || '').toLowerCase().includes(q) ||
      (r.product_name || '').toLowerCase().includes(q) ||
      (r.college_code || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/15 text-[#181D14] border border-[#C6DE41]/30 text-xs font-bold mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-[#181D14]" />
            <span>Buyer Demand & Fulfillment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F7F0] tracking-tight">
            Student Purchase & Interest Requests
          </h2>
          <p className="text-xs text-[#A6B09F] mt-0.5">
            Track buyer inquiries, match with available campus inventory, and mark orders as fulfilled.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#B7C1B0] bg-[#242C20] px-3 py-1.5 rounded-xl border border-white/10">
            Total Orders: <span className="text-[#F5F7F0] font-extrabold">{requests.length}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#181D14] p-4 rounded-2xl border border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8F9A89] absolute left-3 top-1/2 -translate-y-1/2" />
          <SmoothInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by buyer, product, or campus..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 text-xs focus:ring-2 focus:ring-campus-primary/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#8F9A89]" />
          <span className="text-xs text-[#A6B09F] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold bg-[#12160F] text-[#E8EDE2] outline-none focus:ring-2 focus:ring-campus-primary/20"
          >
            <option value="ALL">All Statuses ({requests.length})</option>
            <option value="PENDING">PENDING ({requests.filter((r) => r.status === 'PENDING').length})</option>
            <option value="APPROVED">APPROVED ({requests.filter((r) => r.status === 'APPROVED').length})</option>
            <option value="COMPLETED">COMPLETED ({requests.filter((r) => r.status === 'COMPLETED').length})</option>
            <option value="REJECTED">REJECTED ({requests.filter((r) => r.status === 'REJECTED').length})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#181D14] rounded-3xl border border-white/10/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#12160F] text-[#8F9A89] font-bold uppercase tracking-wider border-b border-white/10/80">
              <tr>
                <th className="py-4 px-6">Buyer & Contact</th>
                <th className="py-4 px-4">Campus</th>
                <th className="py-4 px-4">Product Requested</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8F9A89]">Loading buy requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8F9A89]">No matching buy requests found.</td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#283225]/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#F5F7F0] text-sm">{r.buyer_name}</div>
                      <div className="text-[11px] text-[#A6B09F] flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#8F9A89]" />
                          {r.buyer_phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#8F9A89]" />
                          {r.buyer_email}
                        </span>
                      </div>
                      {r.notes && (
                        <div className="text-[11px] text-[#B7C1B0] italic mt-1 bg-[#12160F] p-1.5 rounded-lg border border-white/10">
                          "{r.notes}"
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-[#F5F7F0] text-xs bg-[#242C20] px-2.5 py-1 rounded-lg border border-white/10">
                        <MapPin className="w-3 h-3 text-campus-primary" />
                        {r.college_code}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-[#E8EDE2] text-xs">
                        {r.product_name}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-[#F5F7F0] text-sm">
                      ₹{r.selling_price}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        r.status === 'COMPLETED' ? 'bg-[#C6DE41]/15 text-[#D9EBA8]' :
                        r.status === 'APPROVED' ? 'bg-[#C6DE41]/15 text-[#D9EBA8]' :
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
                        onChange={(e) => initiateStatusChange(r.id, r.buyer_name || 'Buyer', r.product_name, e.target.value as any)}
                        className="p-1.5 rounded-xl border border-white/10 bg-[#181D14] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-campus-primary/20 cursor-pointer shadow-xs"
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

      {/* Confirmation Dialog */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181D14] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-2xl ${confirmModal.newStatus === 'COMPLETED' ? 'bg-[#C6DE41]/15 text-[#C6DE41]' : 'bg-rose-100 text-rose-700'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#F5F7F0]">
                  {confirmModal.newStatus === 'COMPLETED' ? 'Complete Order?' : 'Reject Order?'}
                </h3>
                <p className="text-[11px] text-[#A6B09F]">Confirm order status update</p>
              </div>
            </div>

            <p className="text-xs text-[#B7C1B0] mb-5 leading-relaxed">
              Are you sure you want to mark the purchase request for <strong className="text-[#F5F7F0]">{confirmModal.productName}</strong> by <strong className="text-[#F5F7F0]">{confirmModal.buyerName}</strong> as <span className="font-bold uppercase">{confirmModal.newStatus}</span>?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#B7C1B0] hover:bg-[#30392A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeStatusChange(confirmModal.id, confirmModal.newStatus)}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                  confirmModal.newStatus === 'COMPLETED'
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
