import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, TeamPostItem, TeamApplicationItem, HackathonProfile } from '../services/api';
import {
  Users,
  Award,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Github,
  Globe,
  Linkedin,
  Mail,
  Phone,
  Send,
  Lock,
  Unlock,
  ShieldAlert,
  Info,
  ChevronRight,
  UserPlus,
  UserCheck
} from 'lucide-react';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<TeamPostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application form state (for applicants)
  const [roleApplied, setRoleApplied] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccessMsg, setAppSuccessMsg] = useState<string | null>(null);
  const [appErrorMsg, setAppErrorMsg] = useState<string | null>(null);

  // Owner Review state (for team lead)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Applicant Profile Viewer Modal
  const [viewingProfile, setViewingProfile] = useState<{
    name: string;
    college: string;
    email: string;
    phone?: string;
    profile: HackathonProfile | null;
  } | null>(null);

  const fetchTeamDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.teams.getTeamPostById(id);
      setPost(data);
      if (data.required_roles.length > 0 && !roleApplied) {
        setRoleApplied(data.required_roles[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team post.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  // Handle Application Submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!post) return;

    const finalRole = roleApplied === 'OTHER' ? customRole.trim() : roleApplied;
    if (!finalRole) {
      setAppErrorMsg('Please select or specify the role you are applying for.');
      return;
    }
    if (!applyMessage.trim()) {
      setAppErrorMsg('Please write a short message explaining your relevant experience.');
      return;
    }

    setSubmittingApp(true);
    setAppErrorMsg(null);
    setAppSuccessMsg(null);

    try {
      const res = await api.teams.applyToTeam(post.id, {
        role_applied: finalRole,
        message: applyMessage.trim(),
      });
      setAppSuccessMsg(res.message || 'Application submitted successfully!');
      fetchTeamDetails();
    } catch (err: any) {
      setAppErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  // Handle Application Decision (Owner only)
  const handleDecision = async (appId: string, status: 'ACCEPTED' | 'REJECTED', reason?: string) => {
    if (!post) return;
    setActionLoadingId(appId);
    try {
      await api.teams.reviewApplication(post.id, appId, {
        status,
        rejection_reason: reason,
      });
      setRejectingAppId(null);
      setRejectionReason('');
      fetchTeamDetails();
    } catch (err: any) {
      alert(err.message || `Failed to mark application as ${status}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Close or Reopen Team Post
  const handleToggleStatus = async (newStatus: 'OPEN' | 'CLOSED') => {
    if (!post) return;
    try {
      await api.teams.updateTeamPost(post.id, { status: newStatus });
      fetchTeamDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update team status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-semibold text-slate-500">Loading hackathon team recruitment details...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Team Post Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'This team recruitment post may have been removed or does not exist.'}</p>
          <Link
            to="/find-teammates"
            className="mt-5 inline-block px-5 py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors"
          >
            Back to Find Teammates
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = post.is_owner;
  const isExpired = new Date(post.application_deadline) < new Date();
  const isCrossCollege = post.eligibility_rules === 'OPEN_TO_ALL';
  const isSameCollege = post.eligibility_rules === 'SAME_COLLEGE_ONLY';
  const isUserCollegeMatch = user ? user.college.id === post.college.id : false;
  const isEligibleByCollege = isCrossCollege || isUserCollegeMatch;

  const acceptedCount = post.current_team_size;
  const openSeats = post.open_seats;
  const isTeamFull = acceptedCount >= post.max_team_size;

  return (
    <div className="min-h-screen bg-slate-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/find-teammates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Find Teammates</span>
          </Link>

          {isOwner && (
            <div className="flex items-center gap-2">
              {post.status === 'OPEN' ? (
                <button
                  onClick={() => handleToggleStatus('CLOSED')}
                  className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-950 text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Close Recruitment</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus('OPEN')}
                  className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 shadow-violet-600"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reopen Recruitment</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 1. Main Header Card */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-950 text-[11px] font-medium border border-slate-200">
                  <Award className="w-3 h-3 text-violet-600" />
                  <span>{post.hackathon_name}</span>
                </span>

                {post.status === 'OPEN' && !isExpired ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Recruiting ({openSeats} seat{openSeats !== 1 ? 's' : ''} left)
                  </span>
                ) : post.status === 'FULL' ? (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                    Team Full ({post.max_team_size}/{post.max_team_size})
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                    {post.status} {isExpired ? '(Deadline Expired)' : ''}
                  </span>
                )}

                {isCrossCollege ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-100">
                    Cross-College Open
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                    Same College ({post.college.code})
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">
                {post.team_title}
              </h1>

              {/* Host College & Creator Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-medium text-slate-950">
                  <MapPin className="w-3.5 h-3.5 text-violet-600" />
                  {post.college.name} ({post.college.code})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Lead: <strong className="text-slate-950 font-semibold">{post.creator.name}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Deadline: <strong className="text-slate-950 font-medium">{new Date(post.application_deadline).toLocaleDateString()}</strong>
                </span>
              </div>
            </div>

            {/* Team Capacity Badge Card */}
            <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-center shrink-0 min-w-[190px]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Team Capacity
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-950">
                {acceptedCount} <span className="text-lg font-normal text-slate-500">/ {post.max_team_size}</span>
              </div>
              <div className="mt-2.5 w-full bg-white rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-violet-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (acceptedCount / post.max_team_size) * 100)}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 font-medium">
                {openSeats > 0 ? `${openSeats} open spot${openSeats !== 1 ? 's' : ''}` : 'No spots remaining'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Project Description & Goals
            </h3>
            <p className="text-[13px] text-slate-950 leading-relaxed whitespace-pre-line tracking-tight">
              {post.description}
            </p>
          </div>

          {/* Tech Stack & Roles Needed Tags */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Open Roles Needed:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {post.required_roles.map((r, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-slate-100 text-slate-950 text-[11px] font-medium border border-slate-200"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Required Tech Stack:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {post.skills_needed.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-violet-600/5 text-violet-600 text-[11px] font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Special Eligibility Criteria & Instructions */}
          {post.eligibility_notes && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[12px]">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Eligibility Rules & Composition Guidelines:</span>
              </div>
              <p className="leading-relaxed pl-5 text-amber-900/90">{post.eligibility_notes}</p>
            </div>
          )}
        </div>

        {/* 2. Team Roster Visualization (Current Squad & Slots) */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Current Team Roster</h2>
              <p className="text-[12px] text-slate-500">
                Confirmed team members and available recruitment seats.
              </p>
            </div>
            <span className="text-[12px] font-semibold text-violet-600 bg-violet-600/10 px-3.5 py-1 rounded-full">
              {acceptedCount} of {post.max_team_size} Filled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Accepted Members */}
            {post.accepted_members.map((member) => (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  member.is_lead
                    ? 'bg-slate-100 border-slate-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    member.is_lead
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-950 border border-slate-200'
                  }`}
                >
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-slate-950 truncate">{member.name}</span>
                    {member.is_lead && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold uppercase">
                        Lead
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-violet-600 font-medium truncate">{member.role}</div>
                  {member.college && (
                    <div className="text-[10px] text-slate-500 truncate">📍 {member.college.code}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Remaining Open Slots */}
            {Array.from({ length: openSeats }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-100/50 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full border border-dashed border-slate-500/40 text-slate-500 flex items-center justify-center text-[11px] font-semibold shrink-0">
                  #{acceptedCount + idx + 1}
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-slate-950">Recruiting Open Seat</div>
                  <div className="text-[10px] text-slate-500">Awaiting applicant acceptance</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. APPLICATION WORKFLOW OR STATUS */}
        {!isOwner && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-lg">
            {post.my_application ? (
              /* Already Applied Banner */
              <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      post.my_application.status === 'ACCEPTED'
                        ? 'bg-emerald-600 text-white'
                        : post.my_application.status === 'REJECTED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-violet-600 text-white'
                    }`}
                  >
                    {post.my_application.status === 'ACCEPTED' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : post.my_application.status === 'REJECTED' ? (
                      <XCircle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight text-slate-950">
                        Application Status: <span className="uppercase text-violet-600">{post.my_application.status}</span>
                      </h3>
                    </div>
                    <p className="text-[13px] text-slate-500">
                      Applied for role: <strong className="text-slate-950">{post.my_application.role_applied}</strong>
                    </p>

                    {post.my_application.status === 'PENDING' && (
                      <p className="text-[12px] text-slate-500 mt-2">
                        Your application is in the team lead's review queue. They have received your skill profile and will make a decision soon.
                      </p>
                    )}

                    {post.my_application.status === 'ACCEPTED' && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12px]">
                        <strong>Welcome to the squad!</strong> You are an official team member. You can connect with team lead{' '}
                        <strong className="underline">{post.creator.name}</strong> at <strong className="underline">{post.creator.email}</strong> to coordinate strategy.
                      </div>
                    )}

                    {post.my_application.status === 'REJECTED' && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-[12px]">
                        <strong>Application not accepted:</strong>{' '}
                        {post.my_application.rejection_reason || 'The team selected another candidate for this role or reached full capacity.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : isExpired ? (
              /* Application Deadline Expired */
              <div className="p-8 rounded-2xl bg-slate-100 border border-slate-200 text-center">
                <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h3 className="text-base font-bold tracking-tight text-slate-950">Recruitment Deadline Closed</h3>
                <p className="text-[12px] text-slate-500 mt-1">
                  The application deadline ({new Date(post.application_deadline).toLocaleDateString()}) has passed.
                </p>
              </div>
            ) : isTeamFull ? (
              /* Team Full */
              <div className="p-8 rounded-2xl bg-slate-100 border border-slate-200 text-center">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h3 className="text-base font-bold tracking-tight text-slate-950">Team Roster Full</h3>
                <p className="text-[12px] text-slate-500 mt-1">
                  All {post.max_team_size} seats have been filled by the team lead.
                </p>
              </div>
            ) : !isEligibleByCollege ? (
              /* College Eligibility Restriction Warning */
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Campus Eligibility Restriction
                    </h3>
                    <p className="text-[12px] text-amber-800 mt-1 leading-relaxed">
                      This team's recruitment is restricted strictly to students enrolled in{' '}
                      <strong>{post.college.name} ({post.college.code})</strong>. Your registered campus is{' '}
                      <strong>{user?.college.code}</strong>.
                    </p>
                    <p className="text-[12px] text-amber-700 mt-2">
                      Check out teams marked <strong>"Cross-College Open"</strong> on the hackathon board to join teams from other campuses!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Application Form */
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold mb-2">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Apply To Join Squad</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Submit Your Application</h2>
                  <p className="text-[13px] text-slate-500 mt-1">
                    Your campus, hackathon skill profile, and message will be delivered directly to team lead {post.creator.name}.
                  </p>
                </div>

                {appSuccessMsg && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{appSuccessMsg}</span>
                  </div>
                )}

                {appErrorMsg && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[12px] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{appErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleApply} className="space-y-4">
                  {/* Select Role */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Role You Are Applying For <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={roleApplied}
                      onChange={(e) => setRoleApplied(e.target.value)}
                      className="w-full px-4 py-3 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[13px] font-medium text-slate-950 outline-none transition-all"
                    >
                      {post.required_roles.map((r, i) => (
                        <option key={i} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="OTHER">Other / Custom Role</option>
                    </select>

                    {roleApplied === 'OTHER' && (
                      <input
                        type="text"
                        required
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Specify role (e.g. AI Prompt Specialist, Pitch Lead)"
                        className="mt-2 w-full px-4 py-2.5 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[12px] text-slate-950 outline-none transition-all"
                      />
                    )}
                  </div>

                  {/* Pitch Message */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Pitch To Team Lead <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder="Explain your relevant tech stack, why this hackathon track excites you, and past projects you've built..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[13px] text-slate-950 outline-none transition-all leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Link
                      to="/my-teams"
                      className="text-[12px] text-violet-600 hover:underline font-medium"
                    >
                      Want to update your skill profile first?
                    </Link>

                    <button
                      type="submit"
                      disabled={submittingApp}
                      className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-medium shadow-violet-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingApp ? 'Submitting...' : 'Apply Now'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 4. TEAM OWNER / ADMIN APPLICANT QUEUE (Owner Only) */}
        {(isOwner || (user && user.role === 'ADMIN')) && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Applicant Review Queue ({post.applications?.length || 0})
                </h2>
                <p className="text-[12px] text-slate-500">
                  Review student applications, inspect skill profiles, and accept teammates.
                </p>
              </div>
              <div className="text-[12px] text-slate-500">
                Remaining seats: <strong className="text-violet-600 font-bold">{openSeats}</strong>
              </div>
            </div>

            {(!post.applications || post.applications.length === 0) ? (
              <div className="p-8 text-center bg-slate-100 rounded-2xl border border-slate-200">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-[13px] font-semibold text-slate-950">No applications received yet</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  When students discover your post and apply, their profiles will appear here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {post.applications.map((app) => {
                  const applicant = app.applicant;
                  const profile = applicant?.hackathon_profile;
                  const isAccepted = app.status === 'ACCEPTED';
                  const isRejected = app.status === 'REJECTED';
                  const isPending = app.status === 'PENDING';

                  return (
                    <div
                      key={app.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isAccepted
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isRejected
                          ? 'bg-slate-100/50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        {/* Applicant Summary */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-slate-950">
                              {applicant?.name}
                            </span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-950 font-medium border border-slate-200">
                              📍 {applicant?.college?.code}
                            </span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                                isAccepted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRejected
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>

                          <div className="text-[12px] font-semibold text-violet-600">
                            Applied For: <span>{app.role_applied}</span>
                          </div>

                          <p className="text-[12px] text-slate-500 bg-slate-100 p-3 rounded-2xl border border-slate-200 leading-relaxed max-w-2xl">
                            "{app.message}"
                          </p>

                          {/* Applicant Skills & Links */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            {profile?.skills && profile.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {profile.skills.slice(0, 5).map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-medium"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            {profile?.github_url && (
                              <a
                                href={profile.github_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-950 font-medium ml-2"
                              >
                                <Github className="w-3.5 h-3.5" />
                                <span>GitHub</span>
                              </a>
                            )}
                            {profile?.portfolio_url && (
                              <a
                                href={profile.portfolio_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-950 font-medium"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Portfolio</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Owner Decision Buttons */}
                        <div className="flex sm:flex-col items-center gap-2 shrink-0">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleDecision(app.id, 'ACCEPTED')}
                                disabled={actionLoadingId === app.id || openSeats <= 0}
                                className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-[12px] font-medium shadow-violet-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Accept to Squad</span>
                              </button>

                              <button
                                onClick={() => setRejectingAppId(app.id)}
                                disabled={actionLoadingId === app.id}
                                className="w-full px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-full text-[12px] font-medium transition-all flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <button
                              onClick={() => handleDecision(app.id, 'REJECTED', 'Removed by team owner')}
                              disabled={actionLoadingId === app.id}
                              className="px-3 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded-full transition-colors font-medium"
                            >
                              Remove Teammate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Rejection Modal/Inline Input */}
                      {rejectingAppId === app.id && (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Optional feedback / rejection reason for the applicant..."
                            className="flex-grow px-4 py-2 rounded-full bg-slate-100 border border-transparent focus:border-rose-300 text-[12px] text-slate-950 outline-none"
                          />
                          <button
                            onClick={() => handleDecision(app.id, 'REJECTED', rejectionReason)}
                            className="px-5 py-2 bg-rose-600 text-white rounded-full text-[12px] font-medium hover:bg-rose-700 transition-colors"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => {
                              setRejectingAppId(null);
                              setRejectionReason('');
                            }}
                            className="px-4 py-2 border border-slate-200 text-slate-500 rounded-full text-[12px] hover:bg-slate-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
