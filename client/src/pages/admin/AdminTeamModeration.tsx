import { SmoothInput } from '../../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, TeamPostItem } from '../../services/api';
import {
  Users,
  Award,
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const AdminTeamModeration: React.FC = () => {
  const [posts, setPosts] = useState<TeamPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdminTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getTeamPosts();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load team posts for moderation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTeams();
  }, []);

  const handleStatusChange = async (postId: string, newStatus: 'OPEN' | 'FULL' | 'CLOSED' | 'REMOVED') => {
    setActionLoadingId(postId);
    try {
      await api.admin.updateTeamStatus(postId, newStatus);
      fetchAdminTeams();
    } catch (err: any) {
      alert(err.message || 'Failed to update post status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.team_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hackathon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.creator.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-[#181D14] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8F9A89] absolute left-3 top-1/2 -translate-y-1/2" />
          <SmoothInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team, hackathon, or student lead..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 text-xs focus:ring-2 focus:ring-campus-primary/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#A6B09F] font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold bg-[#181D14] text-[#D3DACD] outline-none"
          >
            <option value="ALL">All Posts ({posts.length})</option>
            <option value="OPEN">Recruiting (OPEN)</option>
            <option value="FULL">Team Full (FULL)</option>
            <option value="CLOSED">Closed (CLOSED)</option>
            <option value="REMOVED">Removed by Admin (REMOVED)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#8F9A89]">
          Loading hackathon team posts across all campuses...
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-200 text-center text-xs text-rose-700">
          {error}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-[#181D14] p-12 rounded-3xl border border-white/10 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#D3DACD]">No team posts match your filter</h3>
        </div>
      ) : (
        <div className="bg-[#181D14] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#12160F] border-b border-white/10 text-[#A6B09F] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Hackathon & Team</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Team Lead</th>
                  <th className="py-3 px-4">Capacity / Apps</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPosts.map((post) => {
                  const isActionLoading = actionLoadingId === post.id;
                  const isRemoved = post.status === 'REMOVED';

                  return (
                    <tr
                      key={post.id}
                      className={`hover:bg-[#283225]/60 transition-colors ${
                        isRemoved ? 'bg-rose-500/10/30 opacity-70' : ''
                      }`}
                    >
                      {/* Hackathon & Team Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-extrabold text-[#F5F7F0] line-clamp-1">
                          {post.team_title}
                        </div>
                        <div className="text-[11px] text-campus-primary font-semibold truncate">
                          {post.hackathon_name}
                        </div>
                        <div className="text-[10px] text-[#8F9A89]">
                          Scope: {post.eligibility_rules === 'OPEN_TO_ALL' ? '🌍 Inter-College' : `🔒 ${post.college.code} Only`}
                        </div>
                      </td>

                      {/* College */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-[#E8EDE2]">📍 {post.college.code}</span>
                        <div className="text-[10px] text-[#8F9A89] truncate max-w-[120px]">
                          {post.college.name.split('-')[0].trim()}
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#E8EDE2]">{post.creator.name}</div>
                        <div className="text-[10px] text-[#8F9A89]">{post.creator.email}</div>
                      </td>

                      {/* Capacity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#D3DACD]">
                          Max: {post.max_team_size} members
                        </div>
                        <div className="text-[10px] text-[#A6B09F]">
                          Applications: {(post as any)._count?.applications ?? (post.applications?.length || 0)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            post.status === 'OPEN'
                              ? 'bg-[#C6DE41]/15 text-[#D9EBA8]'
                              : post.status === 'FULL'
                              ? 'bg-[#C6DE41]/20 text-[#181D14] border border-[#C6DE41]/40'
                              : post.status === 'REMOVED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-[#242C20] text-[#D3DACD]'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/teams/${post.id}`}
                            target="_blank"
                            className="p-1.5 text-[#A6B09F] hover:text-[#E8EDE2] hover:bg-[#30392A] rounded-lg transition-colors"
                            title="View public team post"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {post.status !== 'REMOVED' ? (
                            <button
                              onClick={() => handleStatusChange(post.id, 'REMOVED')}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors border border-rose-200"
                              title="Remove post for violation or spam"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(post.id, 'OPEN')}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg bg-[#C6DE41]/10 hover:bg-[#C6DE41]/15 text-[#C6DE41] font-bold text-[11px] transition-colors border border-[#C6DE41]/20"
                              title="Restore post to OPEN"
                            >
                              Restore
                            </button>
                          )}

                          {post.status === 'OPEN' ? (
                            <button
                              onClick={() => handleStatusChange(post.id, 'CLOSED')}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg bg-[#242C20] hover:bg-[#343C30] text-[#D3DACD] font-semibold text-[11px] transition-colors"
                            >
                              Close
                            </button>
                          ) : post.status === 'CLOSED' ? (
                            <button
                              onClick={() => handleStatusChange(post.id, 'OPEN')}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg bg-[#242C20] hover:bg-[#343C30] text-[#D3DACD] font-semibold text-[11px] transition-colors"
                            >
                              Reopen
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
