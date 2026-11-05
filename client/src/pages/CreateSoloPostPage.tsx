import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, UserRoundPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { soloApi, type SoloScope } from '../services/soloApi';
import './SoloPosts.css';

const HACKATHONS = ['Smart India Hackathon (SIH 2026)', 'Google Solution Challenge', 'HackMIT', 'ETHIndia Web3 Hackathon', 'Campus Innovation Challenge'];
function splitTags(value: string): string[] {
  return Array.from(new Set(value.split(',').map(s => s.trim()).filter(Boolean)));
}

export const CreateSoloPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [roles, setRoles] = useState('');
  const [scope, setScope] = useState<SoloScope>('OPEN_TO_ALL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reuse the existing HackathonProfile so the user doesn't retype their skills.
  useEffect(() => {
    if (!user) return;
    api.teams.getMyProfile().then((profile) => {
      if (!profile) return;
      setDescription((v) => v || profile.bio || '');
      setSkills((v) => v || (profile.skills || []).join(', '));
      setRoles((v) => v || (profile.preferred_roles || []).join(', '));
    }).catch(() => { /* Form remains fully usable without a saved profile */ });
  }, [user?.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const tags = splitTags(skills);
    const chosenRoles = splitTags(roles);
    if (hackathon.trim().length < 3 || headline.trim().length < 5 || description.trim().length < 20 || tags.length === 0 || chosenRoles.length === 0 || tags.length > 15 || chosenRoles.length > 15) {
      const message = 'Enter a hackathon, a headline (5+ characters), introduction (20+ characters), skills and preferred roles (max 15 each).';
      setError(message);
      toast.error(message);
      return;
    }
    setSubmitting(true);
    try {
      await soloApi.create({
        hackathon_name: hackathon.trim(),
        headline: headline.trim(),
        description: description.trim(),
        skills: tags,
        preferred_roles: chosenRoles,
        eligibility_rules: scope,
      });
      toast.success('Your Looking for Team post is live!');
      navigate('/find-students');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not publish post.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="solo-page min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/find-students" className="solo-muted mb-6 inline-flex items-center gap-2 text-sm"><ArrowLeft size={16}/> Back to Student Board</Link>
        <section className="solo-panel rounded-[28px] p-6 sm:p-10">
          <span className="solo-eyebrow"><UserRoundPlus size={14}/> INDIVIDUAL HACKATHON POST</span>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Looking for a Team<span className="solo-lime">.</span></h1>
          <p className="solo-muted mt-2 text-sm">Tell team leaders what you want to build and what you can contribute. Your college is taken from your account.</p>
          <form onSubmit={submit} className="mt-8 space-y-6">
            <div><label htmlFor="solo-hackathon" className="solo-label">TARGET HACKATHON *</label><input id="solo-hackathon" required list="solo-hackathon-options" className="solo-input mt-2 w-full rounded-2xl px-4 py-3" value={hackathon} onChange={e => setHackathon(e.target.value)} placeholder="e.g. Google Solution Challenge"/><datalist id="solo-hackathon-options">{HACKATHONS.map(s => <option key={s} value={s}/>)}</datalist></div>
            <div><label htmlFor="solo-headline" className="solo-label">HEADLINE *</label><input id="solo-headline" required maxLength={100} className="solo-input mt-2 w-full rounded-2xl px-4 py-3" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. React + Python developer looking for an AI team"/></div>
            <div><label htmlFor="solo-description" className="solo-label">ABOUT YOU & YOUR HACKATHON INTEREST *</label><textarea id="solo-description" required rows={5} maxLength={1200} className="solo-input mt-2 w-full rounded-2xl px-4 py-3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Share your projects, experience, and the problem areas you're interested in..."/></div>
            <div><label htmlFor="solo-skills" className="solo-label">YOUR SKILLS (COMMA SEPARATED) *</label><input id="solo-skills" required className="solo-input mt-2 w-full rounded-2xl px-4 py-3" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Python, FastAPI"/></div>
            <div><label htmlFor="solo-roles" className="solo-label">PREFERRED ROLES (COMMA SEPARATED) *</label><input id="solo-roles" required className="solo-input mt-2 w-full rounded-2xl px-4 py-3" value={roles} onChange={e => setRoles(e.target.value)} placeholder="Full Stack Developer, AI/ML Engineer"/></div>
            <fieldset><legend className="solo-label">WHO CAN DISCOVER YOUR POST? *</legend><div className="mt-3 flex flex-wrap gap-3"><label className="solo-outline cursor-pointer rounded-full px-4 py-2.5 text-sm"><input type="radio" name="scope" className="mr-2 accent-[#C6DE41]" checked={scope === 'OPEN_TO_ALL'} onChange={() => setScope('OPEN_TO_ALL')}/>All colleges</label><label className="solo-outline cursor-pointer rounded-full px-4 py-2.5 text-sm"><input type="radio" name="scope" className="mr-2 accent-[#C6DE41]" checked={scope === 'SAME_COLLEGE_ONLY'} onChange={() => setScope('SAME_COLLEGE_ONLY')}/>My college only ({user?.college.code})</label></div></fieldset>
            {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p>}
            <div className="solo-divider flex flex-wrap justify-end gap-3 pt-6"><Link to="/find-students" className="solo-outline rounded-full px-5 py-3 text-sm">Cancel</Link><button type="submit" disabled={submitting} className="solo-primary rounded-full px-6 py-3 text-sm font-bold disabled:opacity-60">{submitting ? 'Publishing...' : 'Publish My Post'}</button></div>
          </form>
        </section>
      </div>
    </main>
  );
};
