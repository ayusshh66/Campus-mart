import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, TeamPostItem, College, HackathonProfile } from '../services/api';
import {
  Users,
  Search,
  Filter,
  Calendar,
  MapPin,
  Sparkles,
  PlusCircle,
  Clock,
  Shield,
  ArrowRight,
  ExternalLink,
  Github,
  Globe,
  AlertCircle,
  CheckCircle2,
  X,
  UserCheck,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';

const COMMON_HACKATHONS = [
  'Smart India Hackathon (SIH 2026)',
  'Google Solution Challenge',
  'HackMIT',
  'ETHIndia Web3 Hackathon',
  'Flipkart GRiD 6.0',
  'Microsoft Imagine Cup',
  'Campus Innovation Challenge',
];

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
  'Flutter',
];

export const FindTeammatesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<TeamPostItem[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [onlyOpenSeats, setOnlyOpenSeats] = useState(true);

  // Quick Skill Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [myProfile, setMyProfile] = useState<HackathonProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Skill Profile Form state
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [rolesSelected, setRolesSelected] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');

  // Load Colleges and Team Posts
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.teams.getTeamPosts({
        hackathon: selectedHackathon || undefined,
        college: selectedCollege || undefined,
        role: selectedRole || undefined,
        skill: selectedSkill || undefined,
        status: onlyOpenSeats ? 'OPEN' : 'ALL',
        search: search.trim() || undefined,
      });
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const colList = await api.getColleges();
        setColleges(colList.filter((c) => c.is_active));
      } catch (e) {
        console.error('Failed to load colleges', e);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedHackathon, selectedCollege, selectedRole, selectedSkill, onlyOpenSeats]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  // Open Skill Profile Editor
  const openSkillProfileModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowProfileModal(true);
    setProfileLoading(true);
    setProfileSuccessMsg('');
    try {
      const profile = await api.teams.getMyProfile();
      if (profile) {
        setMyProfile(profile);
        setBio(profile.bio || '');
        setSkillsInput(profile.skills.join(', '));
        setRolesSelected(profile.preferred_roles || []);
        setGithubUrl(profile.github_url || '');
        setPortfolioUrl(profile.portfolio_url || '');
        setLinkedinUrl(profile.linkedin_url || '');
        setExperienceLevel(profile.experience_level || 'Intermediate');
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setProfileLoading(false);
    }
  };

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
        preferred_roles: rolesSelected,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        linkedin_url: linkedinUrl,
        experience_level: experienceLevel,
      });

      setMyProfile(res.data);
      setProfileSuccessMsg('Skill profile updated successfully!');
      setTimeout(() => {
        setShowProfileModal(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save skill profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleRoleSelection = (role: string) => {
    if (rolesSelected.includes(role)) {
      setRolesSelected(rolesSelected.filter((r) => r !== role));
    } else {
      setRolesSelected([...rolesSelected, role]);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedHackathon('');
    setSelectedCollege('');
    setSelectedRole('');
    setSelectedSkill('');
    setOnlyOpenSeats(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-slate-950 text-white rounded-[28px] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[11px] font-medium">
                <Users className="w-3.5 h-3.5 text-violet-600" />
                <span>Hackathon Teammate Matching Network</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Find Your Hackathon Team
              </h1>
              <p className="text-[14px] text-slate-500 leading-relaxed tracking-tight">
                Connect with student developers, designers, and AI specialists for national competitions like{' '}
                <strong className="text-white">SIH 2026</strong>, open source sprints, and college hackathons.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/teams/create"
                className="px-5 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-medium shadow-violet-600 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Team Post</span>
              </Link>
              {user && (
                <Link
                  to="/my-teams"
                  className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[13px] font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4 text-violet-200" />
                  <span>My Teams</span>
                </Link>
              )}
              <button
                onClick={openSkillProfileModal}
                className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[13px] font-medium transition-all flex items-center justify-center gap-2"
                title="Update your student skills, GitHub, and roles"
              >
                <Award className="w-4 h-4 text-violet-600" />
                <span>My Skill Profile</span>
              </button>
            </div>
          </div>

          {/* Quick Hackathon Chips */}
          <div className="pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-[12px]">
            <span className="text-slate-500 font-normal shrink-0">
              Popular:
            </span>
            <button
              onClick={() => setSelectedHackathon('')}
              className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 font-medium ${
                selectedHackathon === ''
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              All Events
            </button>
            {COMMON_HACKATHONS.map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHackathon(selectedHackathon === h ? '' : h)}
                className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 font-medium ${
                  selectedHackathon === h
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-[28px] p-6 shadow-lg border border-slate-200 mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search text input */}
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by team title, project idea, hackathon name, or tech..."
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[13px] tracking-tight placeholder:text-slate-500 text-slate-950 outline-none transition-all"
                />
              </div>

              {/* College Filter */}
              <div className="w-full md:w-60 shrink-0">
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="w-full px-4 py-3 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[13px] tracking-tight text-slate-950 outline-none transition-all font-medium"
                >
                  <option value="">All Campuses</option>
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.code} - {col.name.split('-')[0].trim()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Search */}
              <button
                type="submit"
                className="w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600 transition-all shrink-0 flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Chips Row: Role, Skill, Open status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-[12px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" /> Filters:
                </span>

                {/* Role select */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-950 text-[12px] font-medium outline-none transition-all"
                >
                  <option value="">Any Role Needed</option>
                  {COMMON_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* Skill select */}
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-950 text-[12px] font-medium outline-none transition-all"
                >
                  <option value="">Any Skill / Tech</option>
                  {COMMON_SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {/* Reset button */}
                {(search || selectedHackathon || selectedCollege || selectedRole || selectedSkill || !onlyOpenSeats) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-rose-600 hover:text-rose-700 font-medium px-2 py-1 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>

              {/* Toggle Open Seats Only */}
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-500 hover:text-slate-950 select-none transition-colors">
                <input
                  type="checkbox"
                  checked={onlyOpenSeats}
                  onChange={(e) => setOnlyOpenSeats(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-600/30 w-4 h-4 border-slate-200"
                />
                <span>Recruiting teams only</span>
              </label>
            </div>
          </form>
        </div>

        {/* Content State: Loading, Error, Empty, or Posts List */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[13px] text-slate-500 font-medium">Scanning hackathon recruitment boards across campuses...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-[28px] bg-rose-50 border border-rose-200 text-center max-w-xl mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-rose-900 tracking-tight">Failed to load teams</h3>
            <p className="text-[13px] text-rose-700 mt-1">{error}</p>
            <button
              onClick={fetchPosts}
              className="mt-4 px-5 py-2.5 bg-rose-600 text-white rounded-full text-[12px] font-medium hover:bg-rose-700 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-[28px] p-12 text-center border border-slate-200 max-w-2xl mx-auto shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-violet-600 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950">No matching team recruitment posts</h3>
            <p className="text-[13px] text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              We couldn't find any team looking for members with the active filters. Be the first to build a team for your favorite hackathon!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/teams/create"
                className="px-6 py-2.5 rounded-full bg-violet-600 text-white text-[13px] font-medium shadow-violet-600 hover:bg-violet-700 transition-all"
              >
                + Create a Recruitment Post
              </Link>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-950 text-[13px] font-medium hover:bg-slate-100 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[13px] font-semibold text-slate-950 tracking-tight">
                Showing <span className="text-violet-600 font-bold">{posts.length}</span> active recruitment post{posts.length !== 1 ? 's' : ''}
              </h2>
              <span className="text-[12px] text-slate-500">SIH & Cross-College Discovery Enabled</span>
            </div>

            {/* Grid of Team Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const isCrossCollege = post.eligibility_rules === 'OPEN_TO_ALL';
                const isSameCollege = post.eligibility_rules === 'SAME_COLLEGE_ONLY';

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-[28px] p-6 shadow-lg hover:shadow-xl border border-slate-200 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Top: Hackathon Tag & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-950 text-[11px] font-medium border border-slate-200 truncate max-w-[210px]">
                          <Award className="w-3 h-3 text-violet-600 shrink-0" />
                          <span className="truncate">{post.hackathon_name}</span>
                        </span>

                        {/* Status Chip */}
                        {post.status === 'OPEN' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold flex items-center gap-1 shrink-0 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Recruiting
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold shrink-0">
                            {post.status}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold tracking-tight text-slate-950 group-hover:text-violet-600 transition-colors line-clamp-1 mb-2">
                        {post.team_title}
                      </h3>

                      {/* College origin and cross-college status */}
                      <div className="flex items-center gap-2 mb-4 text-[12px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-950">
                          <MapPin className="w-3.5 h-3.5 text-violet-600" />
                          {post.college.code}
                        </span>
                        <span>•</span>
                        {isCrossCollege ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-100">
                            Cross-College
                          </span>
                        ) : (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-200">
                            {post.college.code} Only
                          </span>
                        )}
                      </div>

                      <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {post.description}
                      </p>

                      {/* Roles Required */}
                      <div className="space-y-1.5 mb-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Open Roles ({post.open_seats} spot{post.open_seats !== 1 ? 's' : ''} left):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {post.required_roles.map((r, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-950 text-[11px] font-medium border border-slate-200"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Skills needed */}
                      {post.skills_needed.length > 0 && (
                        <div className="space-y-1.5 mb-4">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Tech Stack:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {post.skills_needed.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full bg-violet-600/5 text-violet-600 text-[10px] font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      {/* Team Lead & Deadline footer info */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-[9px]">
                            {post.creator.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-950 truncate max-w-[110px]">
                            {post.creator.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1" title="Application Deadline">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(post.application_deadline).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Card Action Button */}
                      {post.my_application ? (
                        <Link
                          to={`/teams/${post.id}`}
                          className={`w-full py-2.5 rounded-full text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all ${
                            post.my_application.status === 'ACCEPTED'
                              ? 'bg-emerald-600 text-white'
                              : post.my_application.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Application: {post.my_application.status} • View Team
                          </span>
                        </Link>
                      ) : post.is_owner ? (
                        <Link
                          to={`/teams/${post.id}`}
                          className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-950 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Manage My Team ({post.accepted_members.length}/{post.max_team_size})</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/teams/${post.id}`}
                          className="w-full py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm group-hover:bg-violet-600"
                        >
                          <span>View Details & Apply</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* QUICK SKILL PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Your Hackathon Skill Profile</h2>
            </div>
            <p className="text-[13px] text-slate-500 mb-6">
              This profile is shared with team leaders when you apply. Keep it updated to stand out!
            </p>

            {profileLoading ? (
              <div className="py-12 text-center text-[13px] text-slate-500">Loading your profile data...</div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[12px] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {/* Bio */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-950 mb-1.5">
                    Short Bio & Hackathon Experience
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. 3rd year CSE student interested in deep learning & distributed systems. Built 2 projects in React & FastAPI."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[13px] text-slate-950 outline-none transition-all"
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-950 mb-1.5">
                    Hackathon Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[13px] text-slate-950 outline-none transition-all font-medium"
                  >
                    <option value="Beginner">Beginner (1st or 2nd Hackathon)</option>
                    <option value="Intermediate">Intermediate (Participated in 2-4 Hackathons)</option>
                    <option value="Advanced">Advanced (Hackathon Winner / Seasoned Hacker)</option>
                  </select>
                </div>

                {/* Skills Comma Separated */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-950 mb-1.5">
                    Key Technical Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. React, Node.js, Python, PyTorch, Figma, Solidity"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[13px] text-slate-950 outline-none transition-all"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_SKILLS.slice(0, 8).map((sk) => (
                      <button
                        type="button"
                        key={sk}
                        onClick={() => {
                          const current = skillsInput ? skillsInput.split(',').map((s) => s.trim()) : [];
                          if (!current.includes(sk)) {
                            setSkillsInput(current.length > 0 ? `${skillsInput}, ${sk}` : sk);
                          }
                        }}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-950 border border-slate-200 transition-colors"
                      >
                        + {sk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Roles Checkboxes */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-950 mb-1.5">
                    Preferred Roles in a Team
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 rounded-2xl bg-slate-100 border border-slate-200 text-[12px]">
                    {COMMON_ROLES.map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-2 text-slate-950 cursor-pointer select-none text-[11px]"
                      >
                        <input
                          type="checkbox"
                          checked={rolesSelected.includes(role)}
                          onChange={() => toggleRoleSelection(role)}
                          className="rounded text-violet-600 focus:ring-violet-600/30 w-3.5 h-3.5 border-slate-200"
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Portfolio, GitHub, LinkedIn */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-950 mb-1 flex items-center gap-1">
                      <Github className="w-3.5 h-3.5 text-slate-500" /> GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full px-4 py-2 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[12px] text-slate-950 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-950 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-500" /> Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://myportfolio.dev"
                      className="w-full px-4 py-2 rounded-full bg-slate-100 border border-transparent focus:border-violet-600 focus:bg-white text-[12px] text-slate-950 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-950 text-[12px] font-medium hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-medium shadow-violet-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function FlameIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.9 2.5-7.22 6-8.48.56-.2.95-.73.95-1.33 0-1.07-1.06-1.85-2.07-1.48C5.23 3.68 3 6.64 3 10.16 3 16.14 7.86 21 13.84 21c2.8 0 5.4-1.07 7.37-2.83.69-.62.3-1.78-.62-1.89-2.73-.34-5.06-2.04-6.05-4.52-.33-.83-.09-1.79.59-2.37l1.65-1.42c.8-.69.96-1.86.37-2.73C16.48 4.2 15.22 3.5 13.88 3.5c-.83 0-1.5.67-1.5 1.5 0 2.37-1.12 4.48-2.88 5.82-.69.53-1.03 1.42-.87 2.28.3 1.62 1.48 2.94 3.05 3.39 1.46.42 2.99-.02 4.02-1.09.43-.45 1.16-.39 1.51.14 1.25 1.88 1.95 4.12 1.95 6.46 0 1.25-.21 2.45-.6 3.58-.27.81-.96 1.42-1.82 1.42H12z" />
    </svg>
  );
}
