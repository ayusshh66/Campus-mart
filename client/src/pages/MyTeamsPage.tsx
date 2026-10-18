import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, TeamPostItem, TeamApplicationItem, HackathonProfile } from '../services/api';
import {
  Users,
  Award,
  Calendar,
  Clock,
  MapPin,
  PlusCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Github,
  Globe,
  Linkedin,
  Mail,
  UserCheck,
  Edit3,
  Layers,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Mobile App Developer',
  'Cloud/DevOps Engineer',
  'Blockchain Developer',
  'Cybersecurity Analyst',
  'Pitch / Presentation Lead',
];

const COMMON_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'PyTorch',
  'TensorFlow',
  'TailwindCSS',
  'PostgreSQL',
  'MongoDB',
  'Next.js',
  'Docker',
  'Figma',
  'Solidity',
  'FastAPI',
];

export const MyTeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'created';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createdTeams, setCreatedTeams] = useState<TeamPostItem[]>([]);
  const [appliedTeams, setAppliedTeams] = useState<TeamApplicationItem[]>([]);
  const [profile, setProfile] = useState<HackathonProfile | null>(null);

  // Skill Profile form state
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Owner action loading state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.teams.getMyTeams();
      setCreatedTeams(data.created_teams || []);
      setAppliedTeams(data.applied_teams || []);
      if (data.profile) {
        setProfile(data.profile);
        setBio(data.profile.bio || '');
        setSkillsInput(data.profile.skills?.join(', ') || '');
        setSelectedRoles(data.profile.preferred_roles || []);
        setGithubUrl(data.profile.github_url || '');
        setPortfolioUrl(data.profile.portfolio_url || '');
        setLinkedinUrl(data.profile.linkedin_url || '');
        setExperienceLevel(data.profile.experience_level || 'Intermediate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load your hackathon teams data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');
    try {
      const parsedSkills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.teams.saveProfile({
        bio,
        skills: parsedSkills,
        preferred_roles: selectedRoles,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        linkedin_url: linkedinUrl,
        experience_level: experienceLevel,
      });

      setProfile(res.data);
      setProfileSuccessMsg('Skill profile saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleRoleSelection = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleQuickDecision = async (teamId: string, appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setActionLoadingId(appId);
    try {
      await api.teams.reviewApplication(teamId, appId, { status });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update application');
    } finally {
      setActionLoadingId(null);
    }
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hackathon Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              My Teams & Applications
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage teams you lead, track statuses of your submitted applications, and update your skill profile.
            </p>
          </div>

          <Link
            to="/teams/create"
            className="px-5 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md shadow-campus-primary/25 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Team Post</span>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setTab('created')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'created'
                ? 'border-campus-primary text-campus-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams I Lead ({createdTeams.length})</span>
          </button>

          <button
            onClick={() => setTab('applied')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'applied'
                ? 'border-campus-primary text-campus-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>My Applications ({appliedTeams.length})</span>
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-campus-primary text-campus-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>My Skill Profile</span>
          </button>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-campus-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs text-slate-500">Loading your hackathon activities...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-700">
            {error}
          </div>
        ) : (
          <div>
            {/* TAB 1: TEAMS I CREATED & LEAD */}
            {activeTab === 'created' && (
              <div className="space-y-6">
                {createdTeams.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">You haven't posted any hackathon teams yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Have a great project idea or want to assemble a team for SIH 2026? Create your recruitment post now.
                    </p>
                    <Link
                      to="/teams/create"
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-campus-primary text-white text-xs font-bold hover:bg-campus-primary-hover shadow-md"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Post a Team Request</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {createdTeams.map((post) => {
                      const pendingApps = post.applications?.filter((a) => a.status === 'PENDING') || [];
                      const acceptedApps = post.applications?.filter((a) => a.status === 'ACCEPTED') || [];

                      return (
                        <div
                          key={post.id}
                          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                  {post.hackathon_name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                  Status: {post.status}
                                </span>
                              </div>
                              <h2 className="text-xl font-bold text-slate-900">{post.team_title}</h2>
                            </div>

                            <Link
                              to={`/teams/${post.id}`}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <span>Manage Post & Roster</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-xs text-slate-400 font-semibold uppercase">Capacity</div>
                              <div className="text-lg font-extrabold text-slate-800">
                                {post.current_team_size} / {post.max_team_size}
                              </div>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                              <div className="text-xs text-emerald-700 font-semibold uppercase">Open Seats</div>
                              <div className="text-lg font-extrabold text-emerald-900">{post.open_seats}</div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                              <div className="text-xs text-amber-700 font-semibold uppercase">Pending Applicants</div>
                              <div className="text-lg font-extrabold text-amber-900">{pendingApps.length}</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                              <div className="text-xs text-purple-700 font-semibold uppercase">Total Applications</div>
                              <div className="text-lg font-extrabold text-purple-900">
                                {post.applications?.length || 0}
                              </div>
                            </div>
                          </div>

                          {/* Pending Applications preview */}
                          {pendingApps.length > 0 && (
                            <div className="pt-3 border-t border-slate-100">
                              <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                                <span>Pending Applications Requiring Your Review:</span>
                                <Link to={`/teams/${post.id}`} className="text-campus-primary hover:underline text-[11px]">
                                  View all ({pendingApps.length})
                                </Link>
                              </div>

                              <div className="space-y-2.5">
                                {pendingApps.slice(0, 3).map((app) => (
                                  <div
                                    key={app.id}
                                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-900 flex items-center gap-2">
                                        <span>{app.applicant?.name}</span>
                                        <span className="text-[10px] text-slate-500 font-normal">
                                          📍 {app.applicant?.college?.code}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-campus-primary font-semibold">
                                        Applied for: {app.role_applied}
                                      </div>
                                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1 italic">
                                        "{app.message}"
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => handleQuickDecision(post.id, app.id, 'ACCEPTED')}
                                        disabled={actionLoadingId === app.id || post.open_seats <= 0}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm disabled:opacity-50"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleQuickDecision(post.id, app.id, 'REJECTED')}
                                        disabled={actionLoadingId === app.id}
                                        className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg font-semibold text-[11px]"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY SUBMITTED APPLICATIONS */}
            {activeTab === 'applied' && (
              <div className="space-y-4">
                {appliedTeams.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">You haven't applied to any teams yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Explore open hackathon teams from student leaders across campuses and apply to build great projects together!
                    </p>
                    <Link
                      to="/find-teammates"
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-campus-primary text-white text-xs font-bold hover:bg-campus-primary-hover shadow-md"
                    >
                      <span>Browse Open Teams</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appliedTeams.map((app) => {
                      const post = app.team_post;
                      const isAccepted = app.status === 'ACCEPTED';
                      const isRejected = app.status === 'REJECTED';
                      const isPending = app.status === 'PENDING';

                      return (
                        <div
                          key={app.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 truncate max-w-[200px]">
                                {post?.hackathon_name}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
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

                            <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                              {post?.team_title}
                            </h3>

                            <div className="text-xs text-campus-primary font-semibold mt-1">
                              Applied Role: {app.role_applied}
                            </div>

                            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 italic">
                              "{app.message}"
                            </p>

                            {isAccepted && (
                              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                                <strong>🎉 You are in!</strong> Contact team lead{' '}
                                <strong>{post?.creator?.name}</strong> at{' '}
                                <a href={`mailto:${post?.creator?.email}`} className="underline font-bold">
                                  {post?.creator?.email}
                                </a>
                              </div>
                            )}

                            {isRejected && app.rejection_reason && (
                              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                                <strong>Note from lead:</strong> {app.rejection_reason}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">
                              Applied {new Date(app.created_at).toLocaleDateString()}
                            </span>
                            {post && (
                              <Link
                                to={`/teams/${post.id}`}
                                className="text-campus-primary font-bold hover:underline flex items-center gap-1"
                              >
                                <span>View Team</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MY SKILL PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-3xl">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Your Student Skill Profile</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    When you apply to hackathon teams, team leads review your technical skills, experience level, and GitHub portfolio.
                  </p>
                </div>

                {profileSuccessMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Short Bio / Hackathon Pitch
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. 3rd year CSE student interested in deep learning & distributed systems. Built 2 projects in React & FastAPI."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none"
                    />
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Hackathon Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none font-medium"
                    >
                      <option value="Beginner">Beginner (1st or 2nd Hackathon)</option>
                      <option value="Intermediate">Intermediate (Participated in 2-4 Hackathons)</option>
                      <option value="Advanced">Advanced (Hackathon Winner / Seasoned Hacker)</option>
                    </select>
                  </div>

                  {/* Skills Comma Separated */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Technical Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. React, Node.js, Python, PyTorch, Figma, Solidity"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none font-medium"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {COMMON_SKILLS.map((sk) => (
                        <button
                          type="button"
                          key={sk}
                          onClick={() => {
                            const current = skillsInput ? skillsInput.split(',').map((s) => s.trim()) : [];
                            if (!current.includes(sk)) {
                              setSkillsInput(current.length > 0 ? `${skillsInput}, ${sk}` : sk);
                            }
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          + {sk}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Roles */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Preferred Roles
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 max-h-40 overflow-y-auto">
                      {COMMON_ROLES.map((role) => (
                        <label
                          key={role}
                          className="flex items-center gap-2 text-slate-700 cursor-pointer select-none text-xs font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={() => toggleRoleSelection(role)}
                            className="rounded text-campus-primary focus:ring-campus-primary/30 w-3.5 h-3.5"
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* External Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub Profile URL</span>
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Portfolio / Website URL</span>
                      </label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://myportfolio.dev"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md shadow-campus-primary/25 transition-all disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving Changes...' : 'Save Skill Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
