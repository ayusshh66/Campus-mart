import { SmoothInput } from '../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, TeamPostItem, TeamApplicationItem, HackathonProfile } from '../services/api';
import {
  Users,
  Award,
  PlusCircle,
  CheckCircle2,
  Github,
  Globe,
  Edit3,
  ChevronRight,
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
  const [, setProfile] = useState<HackathonProfile | null>(null);

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
    <div className="min-h-screen bg-[#090B09] text-[#F5F7F0] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] border border-[#C6DE41]/20 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hackathon Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              My Teams & Applications<span className="text-[#C6DE41]">.</span>
            </h1>
            <p className="text-[13px] text-stone-300 mt-1 leading-relaxed">
              Manage teams you lead, track statuses of your submitted applications, and update your skill profile.
            </p>
          </div>

          <Link
            to="/teams/create"
            className="px-5 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[12px] font-bold shadow-[0_0_20px_rgba(198,222,65,0.25)] transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-[#090B09]" />
            <span>Create New Team Post</span>
          </Link>
        </div>

        {/* Pill Tab Navigation */}
        <div className="inline-flex p-1 bg-[#12160F] rounded-full border border-white/10 shadow-sm gap-1">
          <button
            onClick={() => setTab('created')}
            className={`py-2 px-5 rounded-full text-[12px] font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'created'
                ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_12px_rgba(198,222,65,0.25)]'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teams I Lead ({createdTeams.length})</span>
          </button>

          <button
            onClick={() => setTab('applied')}
            className={`py-2 px-5 rounded-full text-[12px] font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'applied'
                ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_12px_rgba(198,222,65,0.25)]'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Applications ({appliedTeams.length})</span>
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`py-2 px-5 rounded-full text-[12px] font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_12px_rgba(198,222,65,0.25)]'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>My Skill Profile</span>
          </button>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#C6DE41] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-[13px] text-stone-400 font-medium">Loading your hackathon activities...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-[28px] bg-rose-500/10 border border-rose-500/30 text-center text-[12px] text-rose-300 font-semibold">
            {error}
          </div>
        ) : (
          <div>
            {/* TAB 1: TEAMS I CREATED & LEAD */}
            {activeTab === 'created' && (
              <div className="space-y-6">
                {createdTeams.length === 0 ? (
                  <div className="bg-[#12160F] rounded-[28px] p-12 text-center border border-white/10 shadow-xl">
                    <Users className="w-12 h-12 text-stone-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold tracking-tight text-white">You haven't posted any hackathon teams yet</h3>
                    <p className="text-[13px] text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Have a great project idea or want to assemble a team for SIH 2026? Create your recruitment post now.
                    </p>
                    <Link
                      to="/teams/create"
                      className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[12px] font-bold shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all"
                    >
                      <PlusCircle className="w-4 h-4 text-[#090B09]" />
                      <span>Post a Team Request</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {createdTeams.map((post) => {
                      const pendingApps = post.applications?.filter((a) => a.status === 'PENDING') || [];

                      return (
                        <div
                          key={post.id}
                          className="bg-[#12160F] rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-xl space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-3 py-0.5 rounded-full bg-[#181D14] text-stone-200 text-[11px] font-medium border border-white/10">
                                  {post.hackathon_name}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-stone-400 text-[10px] font-semibold border border-white/10">
                                  Status: {post.status}
                                </span>
                              </div>
                              <h2 className="text-xl font-bold tracking-tight text-white">{post.team_title}</h2>
                            </div>

                            <Link
                              to={`/teams/${post.id}`}
                              className="px-4 py-2 bg-[#181D14] hover:bg-white/10 text-white border border-white/15 rounded-full text-[12px] font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <span>Manage Post & Roster</span>
                              <ChevronRight className="w-3.5 h-3.5 text-[#C6DE41]" />
                            </Link>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-[#181D14] rounded-2xl border border-white/10">
                              <div className="text-[10px] text-stone-400 font-semibold uppercase">Capacity</div>
                              <div className="text-lg font-bold text-white">
                                {post.current_team_size} / {post.max_team_size}
                              </div>
                            </div>
                            <div className="p-3 bg-[#C6DE41]/10 rounded-2xl border border-[#C6DE41]/20">
                              <div className="text-[10px] text-[#C6DE41] font-bold uppercase">Open Seats</div>
                              <div className="text-lg font-bold text-[#C6DE41]">{post.open_seats}</div>
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                              <div className="text-[10px] text-amber-300 font-bold uppercase">Pending Applicants</div>
                              <div className="text-lg font-bold text-amber-300">{pendingApps.length}</div>
                            </div>
                            <div className="p-3 bg-[#181D14] rounded-2xl border border-white/10">
                              <div className="text-[10px] text-stone-400 font-semibold uppercase">Total Applications</div>
                              <div className="text-lg font-bold text-white">
                                {post.applications?.length || 0}
                              </div>
                            </div>
                          </div>

                          {/* Pending Applications preview */}
                          {pendingApps.length > 0 && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="text-[12px] font-semibold text-white mb-3 flex items-center justify-between">
                                <span>Pending Applications Requiring Your Review:</span>
                                <Link to={`/teams/${post.id}`} className="text-[#C6DE41] hover:underline text-[11px] font-bold">
                                  View all ({pendingApps.length})
                                </Link>
                              </div>

                              <div className="space-y-2.5">
                                {pendingApps.slice(0, 3).map((app) => (
                                  <div
                                    key={app.id}
                                    className="p-3.5 rounded-2xl bg-[#181D14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                  >
                                    <div>
                                      <div className="font-semibold text-white flex items-center gap-2">
                                        <span>{app.applicant?.name}</span>
                                        <span className="text-[10px] text-stone-400 font-normal">
                                          📍 {app.applicant?.college?.code}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-[#C6DE41] font-semibold">
                                        Applied for: {app.role_applied}
                                      </div>
                                      <p className="text-stone-400 text-[11px] mt-0.5 line-clamp-1 italic">
                                        "{app.message}"
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => handleQuickDecision(post.id, app.id, 'ACCEPTED')}
                                        disabled={actionLoadingId === app.id || post.open_seats <= 0}
                                        className="px-4 py-1.5 bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] rounded-full font-bold text-[11px] shadow-sm disabled:opacity-50 transition-all"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleQuickDecision(post.id, app.id, 'REJECTED')}
                                        disabled={actionLoadingId === app.id}
                                        className="px-4 py-1.5 border border-white/15 hover:bg-rose-500/20 hover:text-rose-300 text-stone-300 rounded-full font-semibold text-[11px] transition-colors"
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
                  <div className="bg-[#12160F] rounded-[28px] p-12 text-center border border-white/10 shadow-xl">
                    <Award className="w-12 h-12 text-stone-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold tracking-tight text-white">You haven't applied to any teams yet</h3>
                    <p className="text-[13px] text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Explore open hackathon teams from student leaders across campuses and apply to build great projects together!
                    </p>
                    <Link
                      to="/find-teammates"
                      className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[12px] font-bold shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all"
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

                      return (
                        <div
                          key={app.id}
                          className="bg-[#12160F] rounded-[28px] p-6 border border-white/10 shadow-xl flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[11px] font-medium px-3 py-0.5 rounded-full bg-[#181D14] text-stone-200 border border-white/10 truncate max-w-[200px]">
                                {post?.hackathon_name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isAccepted
                                    ? 'bg-[#C6DE41]/20 text-[#C6DE41] border border-[#C6DE41]/30'
                                    : isRejected
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {app.status}
                              </span>
                            </div>

                            <h3 className="text-base font-bold tracking-tight text-white line-clamp-1">
                              {post?.team_title}
                            </h3>

                            <div className="text-[12px] text-[#C6DE41] font-semibold mt-1">
                              Applied Role: {app.role_applied}
                            </div>

                            <p className="text-[12px] text-stone-300 mt-2 bg-[#181D14] p-3 rounded-2xl border border-white/10 line-clamp-2 italic leading-relaxed">
                              "{app.message}"
                            </p>

                            {isAccepted && (
                              <div className="mt-3 p-3 rounded-2xl bg-[#C6DE41]/10 border border-[#C6DE41]/20 text-white text-[12px]">
                                <strong className="text-[#C6DE41]">You are in!</strong> Contact team lead{' '}
                                <strong>{post?.creator?.name}</strong> at{' '}
                                <a href={`mailto:${post?.creator?.email}`} className="underline font-semibold text-[#C6DE41]">
                                  {post?.creator?.email}
                                </a>
                              </div>
                            )}

                            {isRejected && app.rejection_reason && (
                              <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12px]">
                                <strong>Note from lead:</strong> {app.rejection_reason}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                            <span className="text-stone-400 text-[11px]">
                              Applied {new Date(app.created_at).toLocaleDateString()}
                            </span>
                            {post && (
                              <Link
                                to={`/teams/${post.id}`}
                                className="text-[#C6DE41] font-bold hover:underline flex items-center gap-1 text-[12px]"
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
              <div className="bg-[#12160F] rounded-[28px] p-6 sm:p-10 border border-white/10 shadow-xl max-w-3xl">
                <div className="border-b border-white/10 pb-4 mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-white">Your Student Skill Profile</h2>
                  <p className="text-[13px] text-stone-300 mt-1 leading-relaxed">
                    When you apply to hackathon teams, team leads review your technical skills, experience level, and GitHub portfolio.
                  </p>
                </div>

                {profileSuccessMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-[#C6DE41]/15 border border-[#C6DE41]/30 text-[#C6DE41] text-[12px] font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C6DE41]" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Bio */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                      Short Bio / Hackathon Pitch
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. 3rd year CSE student interested in deep learning & distributed systems. Built 2 projects in React & FastAPI."
                      className="w-full px-4 py-3 rounded-2xl bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] text-white outline-none transition-all leading-relaxed placeholder:text-stone-500"
                    />
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                      Hackathon Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] text-white outline-none transition-all font-medium"
                    >
                      <option value="Beginner" className="bg-[#12160F] text-white">Beginner (1st or 2nd Hackathon)</option>
                      <option value="Intermediate" className="bg-[#12160F] text-white">Intermediate (Participated in 2-4 Hackathons)</option>
                      <option value="Advanced" className="bg-[#12160F] text-white">Advanced (Hackathon Winner / Seasoned Hacker)</option>
                    </select>
                  </div>

                  {/* Skills Comma Separated */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                      Technical Skills (comma separated)
                    </label>
                    <SmoothInput
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. React, Node.js, Python, PyTorch, Figma, Solidity"
                      className="w-full px-4 py-3 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] text-white outline-none transition-all font-medium placeholder:text-stone-500"
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
                          className="text-[10px] px-2.5 py-1 rounded-full bg-[#181D14] hover:bg-[#C6DE41]/10 hover:text-[#C6DE41] text-stone-300 border border-white/10 transition-colors"
                        >
                          + {sk}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Roles */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                      Preferred Roles
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#181D14] border border-white/10 max-h-40 overflow-y-auto">
                      {COMMON_ROLES.map((role) => (
                        <label
                          key={role}
                          className="flex items-center gap-2 text-stone-300 cursor-pointer select-none text-[12px] font-medium"
                        >
                          <SmoothInput
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={() => toggleRoleSelection(role)}
                            className="rounded accent-[#C6DE41] text-[#090B09] w-3.5 h-3.5 border-white/20"
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* External Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-[#C6DE41]" />
                        <span>GitHub Profile URL</span>
                      </label>
                      <SmoothInput
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full px-4 py-2.5 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[12px] text-white outline-none transition-all placeholder:text-stone-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#C6DE41]" />
                        <span>Portfolio / Website URL</span>
                      </label>
                      <SmoothInput
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://myportfolio.dev"
                        className="w-full px-4 py-2.5 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[12px] text-white outline-none transition-all placeholder:text-stone-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[12px] font-bold shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all disabled:opacity-50"
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
