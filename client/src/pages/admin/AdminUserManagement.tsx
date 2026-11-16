import { SmoothInput } from '../../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { api, AdminUserItem, College } from '../../services/api';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  Tag,
  Truck
} from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'CAMPUS_HERO' | 'ADMIN'>('ALL');
  const [collegeFilter, setCollegeFilter] = useState<string>('ALL');

  // Role Edit Confirmation Modal
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [newRole, setNewRole] = useState<'USER' | 'CAMPUS_HERO' | 'ADMIN'>('USER');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getUsers({
        search: searchTerm,
        role: roleFilter,
        college_id: collegeFilter,
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const data = await api.getColleges();
      setColleges(data);
    } catch (err) {
      console.error('Failed to load colleges for filter:', err);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, collegeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const openRoleModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setFeedback(null);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      await api.admin.updateUserRole(selectedUser.id, newRole);
      setFeedback({
        type: 'success',
        message: `Successfully updated ${selectedUser.name}'s role to ${newRole}.`,
      });
      setSelectedUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#D9EBA8] text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5 text-[#C6DE41]" />
            <span>Campus Community Directory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F7F0] tracking-tight">
            User & Role Management
          </h2>
          <p className="text-xs text-[#A6B09F] mt-0.5">
            View registered students, filter by college campus, and manage roles (Student, Campus Hero, Admin).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#B7C1B0] bg-[#242C20] px-3 py-1.5 rounded-xl border border-white/10">
            Total Shown: <span className="text-[#F5F7F0] font-extrabold">{users.length}</span>
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-[#C6DE41]/10 text-[#D9EBA8] border border-[#C6DE41]/20'
              : 'bg-rose-500/10 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#C6DE41] flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#8F9A89] hover:text-[#B7C1B0]">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#181D14] p-4 rounded-2xl border border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8F9A89] absolute left-3 top-1/2 -translate-y-1/2" />
          <SmoothInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 text-xs focus:ring-2 focus:ring-campus-primary/20 outline-none"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#A6B09F] font-medium">
            <Filter className="w-3.5 h-3.5 text-[#8F9A89]" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold bg-[#12160F] text-[#E8EDE2] outline-none focus:ring-2 focus:ring-campus-primary/20"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Student (USER)</option>
              <option value="CAMPUS_HERO">Campus Hero</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {/* College Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#A6B09F] font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#8F9A89]" />
            <span>College:</span>
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold bg-[#12160F] text-[#E8EDE2] outline-none focus:ring-2 focus:ring-campus-primary/20 max-w-[180px]"
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table / Mobile Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#242C20] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 text-rose-800 p-6 rounded-2xl border border-rose-200 text-center text-xs">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#181D14] rounded-3xl p-12 text-center border border-white/10">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#E8EDE2] text-base">No Users Found</h3>
          <p className="text-xs text-[#A6B09F] mt-1">Try adjusting your search criteria or role filters.</p>
        </div>
      ) : (
        <div className="bg-[#181D14] rounded-3xl border border-white/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#12160F] text-[#8F9A89] font-bold uppercase tracking-wider border-b border-white/10/80">
                <tr>
                  <th className="py-4 px-6">User / Contact</th>
                  <th className="py-4 px-4">Campus</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Activity Summary</th>
                  <th className="py-4 px-4">Joined</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-[#283225]/80 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#F5F7F0] text-sm">{u.name}</div>
                        <div className="text-[11px] text-[#A6B09F] flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#8F9A89]" />
                            {u.email}
                          </span>
                          {u.phone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#8F9A89]" />
                                {u.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="py-4 px-4">
                        {u.college ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#E8EDE2] text-xs bg-[#242C20] px-2.5 py-1 rounded-lg border border-white/10">
                            <MapPin className="w-3 h-3 text-campus-primary" />
                            {u.college.code}
                          </span>
                        ) : (
                          <span className="text-[#8F9A89] italic">None</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C6DE41]/20 text-[#181D14] text-[11px] font-extrabold border border-[#C6DE41]/40">
                            <ShieldAlert className="w-3 h-3 text-[#181D14]" />
                            Administrator
                          </span>
                        ) : u.role === 'CAMPUS_HERO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold border border-amber-200">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            Campus Hero
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242C20] text-[#D3DACD] text-[11px] font-bold border border-white/10">
                            <UserCheck className="w-3 h-3 text-[#A6B09F]" />
                            Student
                          </span>
                        )}
                      </td>

                      {/* Activity Summary */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                          {u._count.sell_requests > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-[#C6DE41]/10 text-[#C6DE41] border border-emerald-100" title="Sell Submissions">
                              {u._count.sell_requests} sold
                            </span>
                          )}
                          {u._count.buy_requests > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-[#C6DE41]/15 text-[#181D14] border border-[#C6DE41]/30" title="Buy Requests">
                              {u._count.buy_requests} bought
                            </span>
                          )}
                          {u._count.hero_tasks > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-[#C6DE41]/10 text-[#C6DE41] border border-blue-100" title="Hero Delivery Tasks">
                              {u._count.hero_tasks} deliveries
                            </span>
                          )}
                          {u._count.created_teams > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-[#C6DE41]/10 text-[#C6DE41] border border-indigo-100" title="Hackathon Teams Created">
                              {u._count.created_teams} teams
                            </span>
                          )}
                          {u._count.sell_requests === 0 && u._count.buy_requests === 0 && u._count.hero_tasks === 0 && u._count.created_teams === 0 && (
                            <span className="text-[#8F9A89] font-normal">No activity yet</span>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-[#A6B09F] text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openRoleModal(u)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/15 bg-[#181D14] hover:bg-[#283225] text-[#D3DACD] text-xs font-bold transition-all shadow-sm"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181D14] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-campus-primary" />
                <h3 className="font-extrabold text-base text-[#F5F7F0]">Change User Role</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#8F9A89] hover:text-[#B7C1B0] text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#12160F] p-4 rounded-2xl border border-white/10">
                <div className="font-bold text-[#F5F7F0] text-sm">{selectedUser.name}</div>
                <div className="text-xs text-[#A6B09F] mt-0.5">{selectedUser.email}</div>
                <div className="text-xs font-medium text-[#B7C1B0] mt-1">
                  Campus: <span className="font-bold">{selectedUser.college?.name || 'Unassigned'}</span>
                </div>
                <div className="text-xs font-medium text-[#B7C1B0] mt-0.5">
                  Current Role: <span className="font-bold text-[#F5F7F0]">{selectedUser.role}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#D3DACD] uppercase tracking-wider mb-2">
                  Select New Role
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'USER',
                      title: 'Student (USER)',
                      desc: 'Standard student privileges: buy, sell, join teams, and browse.',
                    },
                    {
                      id: 'CAMPUS_HERO',
                      title: 'Campus Hero (CAMPUS_HERO)',
                      desc: 'Campus ambassador: coordinates pickup/deliveries and inspects items for their college.',
                    },
                    {
                      id: 'ADMIN',
                      title: 'Administrator (ADMIN)',
                      desc: 'Full administrative access to manage inventory, approvals, colleges, and settings.',
                    },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        newRole === r.id
                          ? 'border-campus-primary bg-campus-soft/50 ring-2 ring-campus-primary/20'
                          : 'border-white/10 hover:bg-[#283225]'
                      }`}
                    >
                      <SmoothInput
                        type="radio"
                        name="roleSelection"
                        value={r.id}
                        checked={newRole === r.id}
                        onChange={() => setNewRole(r.id as any)}
                        className="mt-1 text-campus-primary focus:ring-campus-primary"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#F5F7F0]">{r.title}</div>
                        <div className="text-[11px] text-[#A6B09F] mt-0.5">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {newRole === 'ADMIN' && selectedUser.role !== 'ADMIN' && (
                <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Warning: Granting Administrator privileges allows this user full backend access to platform finances, product catalogs, and data.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#B7C1B0] hover:bg-[#30392A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRoleChange}
                  disabled={updating || newRole === selectedUser.role}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-campus-primary hover:bg-campus-primary-hover text-white transition-all shadow-md disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Confirm Role Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
