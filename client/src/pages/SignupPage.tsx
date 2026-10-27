import { SmoothInput } from '../components/motion/SmoothInput';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, College } from '../services/api';
import { ArrowRight, UserPlus, AlertTriangle, AlertCircle, GraduationCap } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api.getColleges().then(list => {
      if (active) {
        setColleges(list);
        if (list.length) setCollegeId(list[0].id);
      }
    }).catch(() => {
      if (active) setError('Unable to load colleges. Please try again later.');
    });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !collegeId) {
      setError('Please complete all fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({ name, email, phone, password, college_id: collegeId });
      navigate('/buy');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full rounded-2xl border border-white/15 bg-[#12160F] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#C6DE41] focus:ring-2 focus:ring-[#C6DE41]/20 placeholder:text-zinc-500';

  return (
    <main className="min-h-screen bg-[#090B09] text-white flex items-center justify-center px-5 py-12 lg:py-20">
      <div className="mx-auto max-w-5xl w-full">
        <div className="grid overflow-hidden rounded-[32px] border border-[#C6DE41]/25 bg-[#12160F] shadow-2xl lg:grid-cols-[.8fr_1.2fr]">
          <aside className="relative bg-[#0E120A] p-8 text-white sm:p-12 border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#C6DE41]/10 blur-3xl" />
            <div className="relative flex items-center gap-2 text-sm font-bold text-[#C6DE41]">
              <GraduationCap size={20} /> JOIN YOUR CAMPUS
            </div>
            <h1 className="relative mt-20 text-4xl font-bold leading-tight tracking-tight text-white">
              Good gear.<br />Great people.<br /><span className="text-[#C6DE41]">One campus.</span>
            </h1>
            <p className="relative mt-5 max-w-xs text-sm leading-7 text-zinc-300">
              Join a student community for trusted buying, selling, and hackathon collaboration.
            </p>
            <div className="relative mt-20 border-t border-white/15 pt-5 text-xs text-zinc-400">
              Choose your college carefully — it is permanently linked to your student account.
            </div>
          </aside>

          <section className="p-7 sm:p-11">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Create your account<span className="text-[#C6DE41]">.</span>
                </h2>
                <p className="text-sm text-zinc-400">A few details and you're in.</p>
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-rose-500/40 bg-rose-900/30 p-3 text-sm text-rose-300">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-zinc-300">
                Full name
                <SmoothInput required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className={'mt-2 ' + field} />
              </label>

              <label className="text-sm font-semibold text-zinc-300">
                Email address
                <SmoothInput required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" className={'mt-2 ' + field} />
              </label>

              <label className="text-sm font-semibold text-zinc-300">
                Phone number
                <SmoothInput required type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your phone number" className={'mt-2 ' + field} />
              </label>

              <label className="text-sm font-semibold text-zinc-300">
                Password
                <SmoothInput required type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" className={'mt-2 ' + field} />
              </label>

              <label className="text-sm font-semibold text-zinc-300 sm:col-span-2">
                Your college
                <select required value={collegeId} onChange={e => setCollegeId(e.target.value)} className={'mt-2 ' + field}>
                  <option value="" disabled className="bg-[#12160F] text-white">Select a college</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#12160F] text-white">
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-900/20 p-4 text-sm text-amber-300 sm:col-span-2">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <p>
                  <strong>College selection is permanent.</strong> Make sure you select the correct college before continuing.
                </p>
              </div>

              <button
                disabled={loading || !collegeId}
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#C6DE41] hover:bg-[#D7EF59] px-5 py-4 text-sm font-bold text-[#090B09] shadow-lg shadow-[#C6DE41]/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 sm:col-span-2 transition-all"
              >
                {loading ? 'Creating account…' : 'Create account'}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Already a member?{' '}
              <Link to="/login" className="font-bold text-[#C6DE41] hover:underline">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};
