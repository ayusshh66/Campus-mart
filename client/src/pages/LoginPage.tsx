import { SmoothInput } from '../components/motion/SmoothInput';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError(null);
    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/admin' : '/buy');
    } catch (err: any) { setError(err.message || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };
  const field = 'w-full rounded-2xl border border-white/15 bg-[#12160F] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#C6DE41] focus:ring-2 focus:ring-[#C6DE41]/20 placeholder:text-zinc-500';
  return (
    <main className="min-h-screen bg-[#090B09] text-white flex items-center justify-center px-5 py-12 lg:py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
        <section className="hidden rounded-[36px] bg-[#12160F] border border-[#C6DE41]/25 p-12 text-white lg:flex lg:min-h-[570px] lg:flex-col lg:justify-between relative overflow-hidden shadow-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#C6DE41]/10 blur-3xl" />
          <div className="relative flex items-center gap-2 text-sm font-semibold text-[#C6DE41]"><Sparkles size={18}/> CAMPUSMART / STUDENT ACCESS</div>
          <div className="relative">
            <h1 className="max-w-md text-5xl font-bold leading-[1.05] tracking-tight text-white">Your campus.<br/><span className="text-[#C6DE41]">Your marketplace.</span></h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-zinc-300">Find verified essentials, give good gear a second life, and build teams with people around you.</p>
          </div>
          <div className="relative flex items-center gap-2 text-sm text-zinc-300"><ShieldCheck size={18} className="text-[#C6DE41]"/> Built for college communities</div>
        </section>
        <section className="mx-auto w-full max-w-md bg-[#12160F] border border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl">
          <div className="mb-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30"><LockKeyhole size={22}/></div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#C6DE41]">Welcome back</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">Sign in to CampusMart<span className="text-[#C6DE41]">.</span></h2>
            <p className="mt-3 text-sm text-zinc-400">Pick up right where you left off.</p>
          </div>
          {error && <div role="alert" className="mb-5 flex gap-2 rounded-2xl border border-rose-500/40 bg-rose-900/30 p-3 text-sm text-rose-300"><AlertCircle size={18}/>{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-zinc-300">Email address</label>
              <SmoothInput id="login-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@college.edu" className={field}/>
            </div>
            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-zinc-300">Password</label>
              <SmoothInput id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" className={field}/>
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C6DE41] hover:bg-[#D7EF59] px-5 py-4 text-sm font-bold text-[#090B09] shadow-lg shadow-[#C6DE41]/25 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">{loading?'Signing in…':'Sign in'}<ArrowRight size={18}/></button>
          </form>
          <div className="mt-7 border-t border-white/10 pt-6">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">Demo accounts — prefill only</p>
            <div className="grid grid-cols-3 gap-2">{[{name:'BPIT',email:'rahul@bpit.ac.in',pass:'student123'},{name:'MAIT',email:'priya@mait.ac.in',pass:'student123'},{name:'Admin',email:'admin@campusmart.in',pass:'admin123'}].map(a=><button key={a.name} type="button" onClick={()=>{setEmail(a.email);setPassword(a.pass);}} className="rounded-xl border border-white/15 bg-[#181D14] px-2 py-2.5 text-xs font-semibold text-zinc-300 hover:border-[#C6DE41]/50 hover:text-[#C6DE41] transition-colors">{a.name}</button>)}</div>
          </div>
          <p className="mt-7 text-center text-sm text-zinc-400">New here? <Link to="/signup" className="font-bold text-[#C6DE41] hover:underline">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
};
