import { SmoothInput } from '../components/motion/SmoothInput';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sparkles,
  ArrowLeft,
  AlertCircle
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
    <div className="min-h-screen bg-[#090B09] py-10 px-4 sm:px-6 lg:px-8 text-[#F5F7F0]">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <Link
          to="/find-teammates"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12160F] border border-white/10 text-[12px] font-semibold text-stone-300 hover:text-white hover:bg-[#181D14] transition-all mb-6 group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C6DE41] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Find Teammates</span>
        </Link>

        {/* Card Container */}
        <div className="bg-[#12160F] rounded-[28px] p-6 sm:p-10 border border-[#C6DE41]/20 shadow-2xl">
          {/* Header */}
          <div className="border-b border-white/10 pb-6 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] border border-[#C6DE41]/20 text-[11px] font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recruit Teammates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Create a Hackathon Team Post<span className="text-[#C6DE41]">.</span>
            </h1>
            <p className="text-[13px] text-stone-300 mt-1.5 leading-relaxed tracking-tight">
              Post your hackathon idea, select roles needed, configure team capacity, and accept applications from qualified student developers.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12px] font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Hackathon Name */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Target Hackathon / Competition <span className="text-[#C6DE41]">*</span>
              </label>
              <SmoothInput
                type="text"
                required
                value={hackathonName}
                onChange={(e) => setHackathonName(e.target.value)}
                placeholder="e.g. Smart India Hackathon (SIH 2026)"
                className="w-full px-4 py-3 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] text-white outline-none transition-all font-medium placeholder:text-stone-500"
              />
              {/* Preset buttons */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-stone-400 font-medium">Suggestions:</span>
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
                    className="text-[10px] px-2.5 py-1 rounded-full bg-[#181D14] hover:bg-[#C6DE41]/10 hover:text-[#C6DE41] text-stone-300 border border-white/10 transition-colors"
                  >
                    + {h}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Team Title */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Team Name / Project Title <span className="text-[#C6DE41]">*</span>
              </label>
              <SmoothInput
                type="text"
                required
                value={teamTitle}
                onChange={(e) => setTeamTitle(e.target.value)}
                placeholder="e.g. FinSecure AI - Automated Campus Fraud Detection"
                className="w-full px-4 py-3 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] text-white outline-none transition-all font-medium placeholder:text-stone-500"
              />
            </div>

            {/* 3. Description & Project Vision */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Problem Statement & Project Vision <span className="text-[#C6DE41]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your hackathon track or idea, what problems you aim to solve, and what kind of commitment you expect from teammates..."
                className="w-full px-4 py-3 rounded-2xl bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] text-white outline-none transition-all leading-relaxed placeholder:text-stone-500"
              />
            </div>

            {/* 4. Roles Needed (Checkbox tags + custom) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider">
                  Open Roles Needed <span className="text-[#C6DE41]">*</span>
                </label>
                <span className="text-[11px] text-[#C6DE41] font-bold">
                  {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-[#181D14] border border-white/10 max-h-48 overflow-y-auto">
                {COMMON_ROLES.map((role) => (
                  <label
                    key={role}
                    className={`flex items-center gap-2 p-2.5 rounded-full text-[11px] font-semibold cursor-pointer select-none transition-all ${
                      selectedRoles.includes(role)
                        ? 'bg-[#C6DE41] text-[#090B09] shadow-sm'
                        : 'bg-[#12160F] text-stone-300 hover:text-white border border-white/10'
                    }`}
                  >
                    <SmoothInput
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="sr-only"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>

              {/* Add custom role input */}
              <div className="flex gap-2 mt-2.5">
                <SmoothInput
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
                  className="flex-grow px-4 py-2.5 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[12px] text-white outline-none transition-all placeholder:text-stone-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="px-5 py-2.5 rounded-full bg-[#181D14] hover:bg-white/10 text-white text-[12px] font-semibold border border-white/15 transition-colors"
                >
                  Add Role
                </button>
              </div>
            </div>

            {/* 5. Required Skills / Tech Stack */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Preferred Tech Stack / Skills (comma separated)
              </label>
              <SmoothInput
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. React, Node.js, Python, PyTorch, Figma, Solidity"
                className="w-full px-4 py-3 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] text-white outline-none transition-all font-medium placeholder:text-stone-500"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-stone-400 font-medium">Quick add:</span>
                {COMMON_SKILLS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => addSkillChip(s)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-[#181D14] hover:bg-[#C6DE41]/10 hover:text-[#C6DE41] text-stone-300 border border-white/10 transition-colors"
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
                <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Max Team Size (Total Capacity) <span className="text-[#C6DE41]">*</span>
                </label>
                <div className="relative">
                  <SmoothInput
                    type="number"
                    min={2}
                    max={15}
                    required
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] outline-none font-bold text-white transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 font-medium">
                    Members (incl. you)
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  SIH requires 6 members. Most hackathons allow 2 to 6.
                </p>
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Application Deadline <span className="text-[#C6DE41]">*</span>
                </label>
                <SmoothInput
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-full bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[13px] outline-none font-medium text-white transition-all"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Applications will close automatically after this date.
                </p>
              </div>
            </div>

            {/* 7. Institutional Eligibility Scope */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-2">
                College Eligibility Scope <span className="text-[#C6DE41]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    eligibilityRules === 'OPEN_TO_ALL'
                      ? 'bg-[#C6DE41]/10 border-[#C6DE41] text-white shadow-sm'
                      : 'bg-[#181D14] border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-white flex items-center gap-1.5">
                      <span>🌍</span> Open To All Colleges
                    </span>
                    <SmoothInput
                      type="radio"
                      name="eligibility"
                      value="OPEN_TO_ALL"
                      checked={eligibilityRules === 'OPEN_TO_ALL'}
                      onChange={() => setEligibilityRules('OPEN_TO_ALL')}
                      className="accent-[#C6DE41]"
                    />
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Inter-college team allowed. Any verified college student can discover and apply.
                  </span>
                </label>

                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    eligibilityRules === 'SAME_COLLEGE_ONLY'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-sm'
                      : 'bg-[#181D14] border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-white flex items-center gap-1.5">
                      <span>🔒</span> Same College Only
                    </span>
                    <SmoothInput
                      type="radio"
                      name="eligibility"
                      value="SAME_COLLEGE_ONLY"
                      checked={eligibilityRules === 'SAME_COLLEGE_ONLY'}
                      onChange={() => setEligibilityRules('SAME_COLLEGE_ONLY')}
                      className="accent-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Restricted strictly to students from your college ({user?.college.code}).
                  </span>
                </label>
              </div>
            </div>

            {/* 8. Eligibility Notes / Criteria */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Specific Eligibility Criteria or Team Composition Rules (Optional)
              </label>
              <textarea
                rows={2}
                value={eligibilityNotes}
                onChange={(e) => setEligibilityNotes(e.target.value)}
                placeholder="e.g. As per SIH requirements, at least 1 female teammate is mandatory. 2nd or 3rd year students preferred."
                className="w-full px-4 py-3 rounded-2xl bg-[#181D14] border border-white/15 focus:border-[#C6DE41] text-[12px] text-white outline-none transition-all placeholder:text-stone-500"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Mention any mandatory composition rules (gender balance, branch, semester, or hackathon-specific guidelines).
              </p>
            </div>

            {/* Submission Actions */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
              <Link
                to="/find-teammates"
                className="px-5 py-2.5 rounded-full border border-white/15 text-stone-300 hover:text-white text-[12px] font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[13px] font-bold shadow-[0_0_20px_rgba(198,222,65,0.25)] transition-all flex items-center gap-2 disabled:opacity-50"
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
