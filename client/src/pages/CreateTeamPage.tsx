import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Users,
  Award,
  Calendar,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
  Info
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
  'AI/ML Specialist',
  'UI/UX Designer',
  'Mobile Developer (Flutter/React Native)',
  'Cloud / DevOps Engineer',
  'Blockchain / Smart Contract Dev',
  'Data Scientist',
  'Pitch / Presentation Lead',
];

const COMMON_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'PyTorch',
  'TensorFlow',
  'PostgreSQL',
  'MongoDB',
  'Next.js',
  'TailwindCSS',
  'Docker',
  'Figma',
  'Solidity',
  'FastAPI',
];

export const CreateTeamPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [hackathonName, setHackathonName] = useState('');
  const [teamTitle, setTeamTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState<number>(6);
  const [eligibilityRules, setEligibilityRules] = useState<'OPEN_TO_ALL' | 'SAME_COLLEGE_ONLY'>('OPEN_TO_ALL');
  const [eligibilityNotes, setEligibilityNotes] = useState('');
  
  // Set default deadline to 14 days from now in YYYY-MM-DDTHH:mm format
  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [deadline, setDeadline] = useState(getDefaultDeadline());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleAddCustomRole = () => {
    if (customRoleInput.trim() && !selectedRoles.includes(customRoleInput.trim())) {
      setSelectedRoles([...selectedRoles, customRoleInput.trim()]);
      setCustomRoleInput('');
    }
  };

  const addSkillChip = (skill: string) => {
    const parts = skillsInput ? skillsInput.split(',').map((s) => s.trim()) : [];
    if (!parts.includes(skill)) {
      setSkillsInput(parts.length > 0 ? `${skillsInput}, ${skill}` : skill);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hackathonName.trim()) {
      setError('Please provide the Hackathon name.');
      return;
    }
    if (!teamTitle.trim()) {
      setError('Please provide a team title.');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError('Please provide a detailed team description (at least 20 characters).');
      return;
    }
    if (selectedRoles.length === 0) {
      setError('Please select or specify at least one role you need on your team.');
      return;
    }
    if (maxTeamSize < 2 || maxTeamSize > 15) {
      setError('Max team size must be between 2 and 15 members.');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      setError('Application deadline must be a valid future date & time.');
      return;
    }

    setLoading(true);
    try {
      const parsedSkills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.teams.createTeamPost({
        hackathon_name: hackathonName.trim(),
        team_title: teamTitle.trim(),
        description: description.trim(),
        skills_needed: parsedSkills,
        required_roles: selectedRoles,
        max_team_size: Number(maxTeamSize),
        eligibility_rules: eligibilityRules,
        eligibility_notes: eligibilityNotes.trim() || undefined,
        application_deadline: deadlineDate.toISOString(),
      });

      navigate(`/teams/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create team recruitment post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <Link
          to="/find-teammates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Find Teammates</span>
        </Link>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recruit Teammates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create a Hackathon Team Post
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Post your hackathon idea, select roles needed, configure team capacity, and accept applications from qualified student developers.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Hackathon Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Target Hackathon / Competition <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={hackathonName}
                onChange={(e) => setHackathonName(e.target.value)}
                placeholder="e.g. Smart India Hackathon (SIH 2026)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none font-medium"
              />
              {/* Preset buttons */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
                {COMMON_HACKATHONS.map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => {
                      setHackathonName(h);
                      if (h.includes('SIH')) {
                        setMaxTeamSize(6);
                        if (!eligibilityNotes) {
                          setEligibilityNotes('Must have at least 1 female teammate as per SIH guidelines. Team size 6 members.');
                        }
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 transition-colors"
                  >
                    + {h}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Team Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Team Name / Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={teamTitle}
                onChange={(e) => setTeamTitle(e.target.value)}
                placeholder="e.g. FinSecure AI - Automated Campus Fraud Detection"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none font-medium"
              />
            </div>

            {/* 3. Description & Project Idea */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Problem Statement & Project Vision <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your hackathon track or idea, what problems you aim to solve, and what kind of commitment you expect from teammates..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none leading-relaxed"
              />
            </div>

            {/* 4. Roles Needed (Checkbox tags + custom) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Open Roles Needed <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 max-h-48 overflow-y-auto">
                {COMMON_ROLES.map((role) => (
                  <label
                    key={role}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all ${
                      selectedRoles.includes(role)
                        ? 'bg-campus-primary/10 text-campus-primary border border-campus-primary/30'
                        : 'bg-white text-slate-700 hover:bg-slate-100/80 border border-slate-200/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded text-campus-primary focus:ring-campus-primary/30 w-3.5 h-3.5"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>

              {/* Add custom role input */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomRole();
                    }
                  }}
                  placeholder="Or type a custom role (e.g. Hardware Engineer, Cloud Architect)..."
                  className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Add Role
                </button>
              </div>
            </div>

            {/* 5. Required Skills / Tech Stack */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Preferred Tech Stack / Skills (comma separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. React, Node.js, Python, PyTorch, Figma, Solidity"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none font-medium"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Quick add:</span>
                {COMMON_SKILLS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => addSkillChip(s)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Team Capacity & Eligibility Rules Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Max Team Size */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Max Team Size (Total Capacity) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={2}
                    max={15}
                    required
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none font-bold text-slate-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                    Members (incl. you)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  SIH usually requires 6 members. Most hackathons allow 2 to 6.
                </p>
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Application Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Applications will close automatically after this date.
                </p>
              </div>
            </div>

            {/* 7. Institutional Eligibility Scope */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                College Eligibility Scope <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    eligibilityRules === 'OPEN_TO_ALL'
                      ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/20 text-emerald-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>🌍</span> Open To All Colleges
                    </span>
                    <input
                      type="radio"
                      name="eligibility"
                      value="OPEN_TO_ALL"
                      checked={eligibilityRules === 'OPEN_TO_ALL'}
                      onChange={() => setEligibilityRules('OPEN_TO_ALL')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Inter-college team allowed. Any verified college student can discover and apply.
                  </span>
                </label>

                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    eligibilityRules === 'SAME_COLLEGE_ONLY'
                      ? 'bg-amber-50/70 border-amber-500 ring-1 ring-amber-500/20 text-amber-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>🔒</span> Same College Only
                    </span>
                    <input
                      type="radio"
                      name="eligibility"
                      value="SAME_COLLEGE_ONLY"
                      checked={eligibilityRules === 'SAME_COLLEGE_ONLY'}
                      onChange={() => setEligibilityRules('SAME_COLLEGE_ONLY')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Restricted strictly to students from your college ({user?.college.code}).
                  </span>
                </label>
              </div>
            </div>

            {/* 8. Eligibility Notes / Criteria */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Specific Eligibility Criteria or Team Composition Rules (Optional)
              </label>
              <textarea
                rows={2}
                value={eligibilityNotes}
                onChange={(e) => setEligibilityNotes(e.target.value)}
                placeholder="e.g. As per SIH requirements, at least 1 female teammate is mandatory. 2nd or 3rd year students preferred."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-campus-primary/20 focus:border-campus-primary outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Mention any mandatory composition rules (gender balance, branch, semester, or hackathon-specific guidelines).
              </p>
            </div>

            {/* Submission Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to="/find-teammates"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-lg shadow-campus-primary/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Publishing Post...' : 'Publish Recruitment Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
