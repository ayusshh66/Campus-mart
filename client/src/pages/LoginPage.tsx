import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/buy');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-campus-soft text-campus-primary flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-campus-dark tracking-tight">
            Welcome back to CampusMart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log in with your registered college student account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              College Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@bpit.ac.in"
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-sm shadow-hero hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Logging in...' : 'Log in to CampusMart'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Demo Sign In Helpers */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
            Instant Demo Logins (Click to autofill):
          </span>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => handleQuickLogin('rahul@bpit.ac.in', 'student123')}
              className="p-2 rounded-lg bg-campus-soft hover:bg-campus-light text-campus-dark transition-colors text-center"
            >
              BPIT Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('priya@mait.ac.in', 'student123')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-center"
            >
              MAIT Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@campusmart.in', 'admin123')}
              className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors text-center flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3 text-amber-600" />
              Admin
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          New to CampusMart?{' '}
          <Link to="/signup" className="text-campus-primary font-bold hover:underline">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
};
