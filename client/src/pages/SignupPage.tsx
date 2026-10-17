import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, College } from '../services/api';
import { UserPlus, AlertTriangle, AlertCircle, ArrowRight, MapPin, ShieldAlert } from 'lucide-react';

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
    const fetchColleges = async () => {
      try {
        const list = await api.getColleges();
        setColleges(list);
        if (list.length > 0) {
          setCollegeId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load colleges:', err);
      }
    };
    fetchColleges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !collegeId) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        name,
        email,
        phone,
        password,
        college_id: collegeId,
      });
      navigate('/buy');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollegeObj = colleges.find((c) => c.id === collegeId);

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-14">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-campus-soft text-campus-primary flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-campus-dark tracking-tight">
            Create Student Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Join your college's exclusive student recommerce network.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98XXXXXXXX"
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Create Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
            />
          </div>

          {/* College Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Your College
            </label>
            <div className="relative">
              <select
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                className="w-full p-3.5 pl-10 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary cursor-pointer"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-campus-primary absolute left-3.5 top-4" />
            </div>
          </div>

          {/* MANDATORY WARNING BEFORE CONFIRMATION */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">Important Notice:</p>
              <p className="mt-0.5 leading-relaxed font-medium">
                Choose your college carefully. Your college can only be selected once and cannot be changed later.
              </p>
            </div>
          </div>

          {/* Confirm & Create Account Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-sm shadow-hero hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Account...' : 'Confirm & Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-campus-primary font-bold hover:underline">
            Log in
          </Link>
        </div>

      </div>
    </div>
  );
};
