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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Campus Community Directory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            User & Role Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View registered students, filter by college campus, and manage roles (Student, Campus Hero, Admin).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Shown: <span className="text-slate-900 font-extrabold">{users.length}</span>
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <SmoothInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 outline-none"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-campus-primary/20"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Student (USER)</option>
              <option value="CAMPUS_HERO">Campus Hero</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {/* College Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>College:</span>
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-campus-primary/20 max-w-[180px]"
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
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-800 p-6 rounded-2xl border border-rose-200 text-center text-xs">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Users Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or role filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF9] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-4 px-6">User / Contact</th>
                  <th className="py-4 px-4">Campus</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Activity Summary</th>
                  <th className="py-4 px-4">Joined</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {u.email}
                          </span>
                          {u.phone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {u.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="py-4 px-4">
                        {u.college ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            <MapPin className="w-3 h-3 text-campus-primary" />
                            {u.college.code}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                            <UserCheck className="w-3 h-3 text-slate-500" />
                            Student
                          </span>
                        )}
                      </td>

                      {/* Activity Summary */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                          {u._count.sell_requests > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100" title="Sell Submissions">
                              {u._count.sell_requests} sold
                            </span>
                          )}
                          {u._count.buy_requests > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-[#C6DE41]/15 text-[#181D14] border border-[#C6DE41]/30" title="Buy Requests">
                              {u._count.buy_requests} bought
                            </span>
                          )}
                          {u._count.hero_tasks > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100" title="Hero Delivery Tasks">
                              {u._count.hero_tasks} deliveries
                            </span>
                          )}
                          {u._count.created_teams > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100" title="Hackathon Teams Created">
                              {u._count.created_teams} teams
                            </span>
                          )}
                          {u._count.sell_requests === 0 && u._count.buy_requests === 0 && u._count.hero_tasks === 0 && u._count.created_teams === 0 && (
                            <span className="text-slate-400 font-normal">No activity yet</span>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
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
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-campus-primary" />
                <h3 className="font-extrabold text-base text-slate-900">Change User Role</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{selectedUser.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedUser.email}</div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Campus: <span className="font-bold">{selectedUser.college?.name || 'Unassigned'}</span>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-0.5">
                  Current Role: <span className="font-bold text-campus-dark">{selectedUser.role}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                          : 'border-slate-200 hover:bg-slate-50'
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
                        <div className="text-xs font-bold text-slate-900">{r.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {newRole === 'ADMIN' && selectedUser.role !== 'ADMIN' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Warning: Granting Administrator privileges allows this user full backend access to platform finances, product catalogs, and data.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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
