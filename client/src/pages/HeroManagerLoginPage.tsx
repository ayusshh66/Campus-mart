import React, { useState } from 'react';

import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { toast } from 'sonner';

import { useAuth } from '../context/AuthContext';

export const HeroManagerLoginPage: React.FC = () => {
  const { login, user, isLoading } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (submitting) return;

    setError('');

    if (!email.trim() || !password) {
      const message =
        'Enter your manager email and password.';

      setError(message);
      toast.error(message);

      return;
    }

    setSubmitting(true);

    try {
      await login(
        email.trim().toLowerCase(),
        password,
        true
      );

      toast.success('Welcome to Campus Hero Manager.');

      navigate('/hero-manager', {
        replace: true,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.';

      setError(message);

      toast.error('Manager login failed', {
        description: message,
        duration: 6000,
        className: 'campus-admin-error-toast',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090B09]">
        <Loader2 className="h-7 w-7 animate-spin text-[#C6DE41]" />
      </div>
    );
  }

  if (
    user?.role === 'HERO_MANAGER' ||
    user?.role === 'ADMIN'
  ) {
    return (
      <Navigate
        to="/hero-manager"
        replace
      />
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090B09] px-4 py-10 text-[#F5F7F0]">

      {/* Subtle CampusMart background */}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(198,222,65,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(198,222,65,0.035) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse at center, black, transparent 75%)',
        }}
      />

      <div className="relative w-full max-w-[470px]">

        {/* Brand */}

        <Link
          to="/"
          className="mb-10 flex items-center justify-center gap-2"
        >
          <span className="text-3xl font-extrabold tracking-tight">
            CampusMart
          </span>

          <span className="h-2.5 w-2.5 rounded-full bg-[#C6DE41] shadow-[0_0_12px_#C6DE41]" />
        </Link>

        {/* Header */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-3xl border border-[#C6DE41]/25 bg-[#C6DE41]/10">
            <ShieldCheck
              size={36}
              className="text-[#C6DE41]"
            />
          </div>

          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6DE41]">
            Authorized Campus Personnel
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight">
            Manager Sign In
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            Manage your campus. Coordinate your Heroes.
          </p>
        </div>

        {/* Login form */}

        <div className="rounded-[28px] border border-white/10 bg-[#12160F] p-6 shadow-2xl sm:p-8">

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-xs leading-relaxed text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* Email */}

            <div>
              <label
                htmlFor="manager-email"
                className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-[#A6B09F]"
              >
                Manager Email
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F9A89]" />

                <input
                  id="manager-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="manager@campusmart.in"
                  className="h-13 w-full rounded-xl border border-white/10 bg-[#090B09] py-3.5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-stone-600 focus:border-[#C6DE41]/60"
                />
              </div>
            </div>

            {/* Password */}

            <div>
              <label
                htmlFor="manager-password"
                className="mb-2.5 block text-[11px] font-bold uppercase tracking-wide text-[#A6B09F]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F9A89]" />

                <input
                  id="manager-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-[#090B09] py-3.5 pl-11 pr-11 text-sm outline-none transition-colors placeholder:text-stone-600 focus:border-[#C6DE41]/60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C6DE41] px-4 py-4 text-sm font-extrabold text-[#090B09] transition-all hover:bg-[#D7EF59] hover:shadow-[0_0_25px_rgba(198,222,65,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Manager Dashboard
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-center text-[11px] leading-relaxed text-stone-500">
            <ShieldCheck
              size={15}
              className="shrink-0 text-[#C6DE41]"
            />

            Restricted to authorized Campus Hero Managers
          </div>
        </div>

        <Link
          to="/"
          className="mt-7 flex items-center justify-center gap-2 text-xs text-stone-400 transition-colors hover:text-[#C6DE41]"
        >
          <ArrowLeft size={14} />
          Return to CampusMart
        </Link>

        <p className="mt-8 text-center text-[10px] text-stone-600">
          © {new Date().getFullYear()} CampusMart.
          Campus Operations Portal.
        </p>
      </div>
    </main>
  );
};

export default HeroManagerLoginPage;