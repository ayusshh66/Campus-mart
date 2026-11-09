
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, CampusHeroItem } from '../services/api';
import ParticleHeroHeadline from '../components/ui/ParticleHeroHeadline';
import { CampusHeroStepsGallery } from '../components/ui/CampusHeroStepsGallery';
import { SmoothInput } from '../components/motion/SmoothInput';

import {
  MapPin,
  Award,
  Users,
  Sparkles,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  Gift,
  Briefcase,
  ChevronDown,
  Star,
} from 'lucide-react';

export const CampusHeroesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [existingApp, setExistingApp] =
    useState<CampusHeroItem | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Application form
  const [branch, setBranch] = useState(
    'Computer Science & Engineering'
  );
  const [year, setYear] = useState('2nd Year');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [reason, setReason] = useState('');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchExisting = async () => {
      if (!user) return;

      setPhone(user.phone || '');

      try {
        const app = await api.getMyCampusHeroApplication();
        setExistingApp(app);
      } catch (err) {
        console.error('Error fetching hero application:', err);
      }
    };

    fetchExisting();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (!reason.trim()) {
      setError(
        'Please tell us why you want to become a Campus Hero.'
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.applyCampusHero({
        branch,
        year,
        phone,
        instagram: instagram.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        reason: reason.trim(),
      });

      setSuccess(true);

      const app = await api.getMyCampusHeroApplication();
      setExistingApp(app);
    } catch (err: any) {
      setError(
        err.message || 'Failed to submit application'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How much time is required to be a Campus Hero?',
      a: 'Just 2 to 3 hours per week. Most of the activities happen during your normal class breaks, coordinating item handovers between batchmates in campus common areas.',
    },
    {
      q: 'Can 1st year / freshers apply?',
      a: 'Absolutely! Freshers make fantastic Campus Heroes because you can build connections across all batches from day one.',
    },
    {
      q: 'What perks and benefits will I receive?',
      a: 'You receive an official Certificate of Leadership & Letter of Recommendation for LinkedIn/CV, milestone-based stipends, exclusive CampusMart hoodies & stickers, and early priority access to incoming products.',
    },
    {
      q: 'What is my core role on campus?',
      a: 'You are the trusted ambassador for CampusMart at your college. You spread awareness, help students submit sell requests, verify items during handover, and ensure safe, scam-free campus exchanges.',
    },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden space-y-16 bg-[#090B09] pb-20 transition-colors duration-200 dark:bg-[#090B09] light:bg-[#F7F8F2]">

      {/* =======================================
          1. ANIMATED HERO BACKGROUND
      ======================================= */}

      {/* <UnicornHeroBackground /> */}

      {/* =======================================
          2. HERO BANNER
      ======================================= */}

      <section
        className="
          relative z-10 mx-auto max-w-[1200px]
          overflow-hidden rounded-[28px]
          border border-[#C6DE41]/20
          bg-[#12160F]/60 px-4
          pb-24 pt-16 text-white
          shadow-[0_0_60px_rgba(198,222,65,0.08)]
          backdrop-blur-md
          sm:px-6 lg:px-8
          dark:bg-[#12160F]/60
          light:border-[#DFE5D5]
          light:bg-white/85
          light:text-[#171B13]
        "
      >
        <div className="relative z-10 mx-auto max-w-5xl text-center">

          {/* Leadership Badge */}
          <div
            className="
              mb-6 inline-flex items-center gap-2
              rounded-full border border-[#C6DE41]/30
              bg-[#C6DE41]/10 px-4 py-1.5
              text-[12px] font-bold text-[#C6DE41]
              shadow-sm backdrop-blur-md
            "
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>CAMPUS LEADERSHIP PROGRAM 2026</span>
          </div>

          {/* Existing Particle Heading */}
          <h1 className="sr-only">
            Become the Face of CampusMart at Your College.
          </h1>

          <ParticleHeroHeadline
            text="Become the Face of CampusMart at Your College."
            className="mb-6 h-[175px] sm:h-[195px] lg:h-[215px]"
          />

          <p
            className="
              mx-auto mb-10 max-w-2xl
              text-[14px] leading-relaxed
              tracking-tight text-stone-300
              sm:text-[16px]
            "
          >
            Represent your campus, help batchmates buy & sell
            verified gear safely, earn exclusive rewards, and
            lead the circular student economy.
          </p>

          {/* Existing Hero Metrics */}
          <div
            className="
              mx-auto grid max-w-3xl
              grid-cols-2 gap-3 border-t
              border-white/10 pt-6 text-left
              sm:grid-cols-4
            "
          >
            <div className="rounded-2xl border border-white/10 bg-[#181D14] p-4">
              <span className="block text-2xl font-black tracking-tight text-[#C6DE41] sm:text-3xl">
                4+
              </span>
              <span className="text-[11px] font-medium text-stone-400">
                Partner Campuses (BPIT, MAIT, MSIT, USAR)
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#181D14] p-4">
              <span className="block text-2xl font-black tracking-tight text-[#C6DE41] sm:text-3xl">
                ₹2.5L+
              </span>
              <span className="text-[11px] font-medium text-stone-400">
                Saved by College Students
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#181D14] p-4">
              <span className="block text-2xl font-black tracking-tight text-[#C6DE41] sm:text-3xl">
                100%
              </span>
              <span className="text-[11px] font-medium text-stone-400">
                Safe Inside-Campus Handovers
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#181D14] p-4">
              <span className="block text-2xl font-black tracking-tight text-[#C6DE41] sm:text-3xl">
                Official
              </span>
              <span className="text-[11px] font-medium text-stone-400">
                Signed Leadership Credential
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================
          3. WHY BECOME A CAMPUS HERO
          Existing benefit cards
      ======================================= */}

      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6DE41]">
            Supercharge Your College Life
          </span>

          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
            Why Join the Campus Hero Program?
          </h2>

          <p className="mt-2 text-[13px] leading-relaxed text-stone-400">
            More than just a campus rep role — it's real-world
            operations experience and tangible career advantages.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

          {/* Leadership */}
          <div className="rounded-[28px] border border-white/10 bg-[#12160F] p-6 shadow-lg transition-all hover:border-[#C6DE41]/40 hover:shadow-[0_0_30px_rgba(198,222,65,0.1)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6DE41]/20 bg-[#C6DE41]/10 text-[#C6DE41]">
              <Award className="h-5 w-5" />
            </div>

            <h3 className="mb-2 text-lg font-bold tracking-tight text-white">
              Leadership Credential
            </h3>

            <p className="text-[13px] leading-relaxed text-stone-400">
              Official certificate & signed recommendation letter
              from CampusMart founders for your LinkedIn,
              internships, and placements.
            </p>
          </div>

          {/* Perks */}
          <div className="rounded-[28px] border border-white/10 bg-[#12160F] p-6 shadow-lg transition-all hover:border-[#C6DE41]/40 hover:shadow-[0_0_30px_rgba(198,222,65,0.1)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6DE41]/20 bg-[#C6DE41]/10 text-[#C6DE41]">
              <Gift className="h-5 w-5" />
            </div>

            <h3 className="mb-2 text-lg font-bold tracking-tight text-white">
              Perks & Swag
            </h3>

            <p className="text-[13px] leading-relaxed text-stone-400">
              Custom CampusMart oversized hoodies, badges,
              stickers, plus performance-linked cash stipends
              for campus milestones.
            </p>
          </div>

          {/* Influence */}
          <div className="rounded-[28px] border border-white/10 bg-[#12160F] p-6 shadow-lg transition-all hover:border-[#C6DE41]/40 hover:shadow-[0_0_30px_rgba(198,222,65,0.1)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6DE41]/20 bg-[#C6DE41]/10 text-[#C6DE41]">
              <Users className="h-5 w-5" />
            </div>

            <h3 className="mb-2 text-lg font-bold tracking-tight text-white">
              Campus-Wide Influence
            </h3>

            <p className="text-[13px] leading-relaxed text-stone-400">
              Build direct contacts across branches, societies,
              and academic years. You become the go-to student
              leader on campus.
            </p>
          </div>

          {/* Internship */}
          <div className="rounded-[28px] border border-white/10 bg-[#12160F] p-6 shadow-lg transition-all hover:border-[#C6DE41]/40 hover:shadow-[0_0_30px_rgba(198,222,65,0.1)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6DE41]/20 bg-[#C6DE41]/10 text-[#C6DE41]">
              <Briefcase className="h-5 w-5" />
            </div>

            <h3 className="mb-2 text-lg font-bold tracking-tight text-white">
              Fast-Track Internship
            </h3>

            <p className="text-[13px] leading-relaxed text-stone-400">
              Direct access to our startup core team with priority
              consideration for summer tech, marketing, and
              operations roles.
            </p>
          </div>
        </div>
      </section>

      {/* =======================================
          4. HOW IT WORKS

          UPDATED:
          Elastic Gallery replaces the old
          four static onboarding cards.
      ======================================= */}

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/10 bg-[#12160F] p-5 shadow-lg sm:p-8 lg:p-10">

          <div className="mx-auto mb-10 max-w-xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6DE41]">
              Zero Hassle Onboarding
            </span>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Your 4-Step Journey to Becoming a Hero
            </h2>
          </div>

          {/* NEW ANIMATED ELASTIC GALLERY */}
          <CampusHeroStepsGallery />

        </div>
      </section>

      {/* =======================================
          5. STUDENT HERO SPOTLIGHTS
      ======================================= */}

      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C6DE41]">
            Hall of Fame
          </span>

          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Hear from Active Campus Heroes
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Testimonial 1 */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#12160F] p-6 shadow-lg sm:p-8">
            <div>
              <div className="mb-3 flex items-center gap-1 text-[#C6DE41]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-[#C6DE41]"
                  />
                ))}
              </div>

              <p className="mb-6 text-xs italic leading-relaxed text-stone-300 sm:text-sm">
                "Being the BPIT Campus Hero helped me get
                recognized by professors and seniors. Helping
                juniors find affordable Casio scientific
                calculators and books during semester exams is
                super fulfilling, and the stipend covers all
                my weekend canteen bills!"
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C6DE41] text-sm font-bold text-[#090B09] shadow-[0_0_12px_rgba(198,222,65,0.3)]">
                R
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  Rahul Sharma
                </h4>
                <span className="text-xs font-semibold text-[#C6DE41]">
                  📍 BPIT • 3rd Year CSE
                </span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#12160F] p-6 shadow-lg sm:p-8">
            <div>
              <div className="mb-3 flex items-center gap-1 text-[#C6DE41]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-[#C6DE41]"
                  />
                ))}
              </div>

              <p className="mb-6 text-xs italic leading-relaxed text-stone-300 sm:text-sm">
                "CampusMart solved the biggest headache in
                our college: scammy WhatsApp group sales.
                Now as the MAIT lead, everything is verified,
                pricing is fair, and I even listed the
                experience on my resume for summer internship
                applications."
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C6DE41] text-sm font-bold text-[#090B09] shadow-[0_0_12px_rgba(198,222,65,0.3)]">
                P
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  Priya Singh
                </h4>
                <span className="text-xs font-semibold text-[#C6DE41]">
                  📍 MAIT • 2nd Year IT
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =======================================
          6. APPLICATION FORM
      ======================================= */}

      <section
        id="apply-form"
        className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8"
      >
        {existingApp && !success ? (

          /* Already Applied */
          <div className="rounded-3xl border border-white/10 bg-[#12160F] p-8 text-center shadow-2xl sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Clock className="h-8 w-8" />
            </div>

            <h3 className="mb-1 text-2xl font-extrabold text-white">
              Application Under Review
            </h3>

            <p className="mx-auto mb-6 max-w-md text-xs text-stone-400 sm:text-sm">
              You applied on behalf of{' '}
              <strong className="font-semibold text-white">
                {existingApp.college_code}
              </strong>.
              {' '}Our core team is currently reviewing your
              application and will reach out via WhatsApp/Phone soon.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#181D14] px-5 py-2.5 text-xs font-semibold text-stone-300">
              <span>Status:</span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  existingApp.status === 'APPROVED'
                    ? 'border-[#C6DE41]/40 bg-[#C6DE41]/20 text-[#C6DE41]'
                    : existingApp.status === 'REJECTED'
                    ? 'border-rose-500/30 bg-rose-500/20 text-rose-400'
                    : 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                }`}
              >
                {existingApp.status}
              </span>
            </div>
          </div>

        ) : success ? (

          /* Application Successful */
          <div className="rounded-[28px] border border-[#C6DE41]/30 bg-[#12160F] p-8 text-center shadow-[0_0_50px_rgba(198,222,65,0.1)] sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#C6DE41]/30 bg-[#C6DE41]/15 text-[#C6DE41]">
              <CheckCircle className="h-8 w-8" />
            </div>

            <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-white">
              Application Submitted Successfully!
            </h3>

            <p className="mx-auto mb-6 max-w-md text-sm text-stone-400">
              Thank you for stepping up to represent{' '}
              <strong className="font-semibold text-white">
                {user?.college.code}
              </strong>.
              {' '}Our student ambassador team will contact you
              within 24 hours.
            </p>

            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-full bg-[#C6DE41] px-6 py-3 text-xs font-bold text-[#090B09] shadow-[0_0_20px_rgba(198,222,65,0.25)] transition-all hover:bg-[#D7EF59]"
            >
              View Application in Profile
            </Link>
          </div>

        ) : (

          /* Application Form */
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#12160F] p-6 shadow-2xl sm:p-10">

            <div className="mb-6">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#C6DE41]/20 bg-[#C6DE41]/10 px-3.5 py-1.5 text-xs font-bold text-[#C6DE41]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>60-Second Application</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Apply to Become a Campus Hero
              </h2>

              <p className="mt-1 text-xs text-stone-400 sm:text-sm">
                Tell us why you want to represent your college.
                No prior experience required!
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                  Full Name
                </label>

                <SmoothInput
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="h-11 w-full cursor-not-allowed rounded-full border border-white/10 bg-[#181D14]/80 px-4 text-xs font-medium text-stone-400 sm:text-sm"
                />
              </div>

              {/* College */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                  College (Permanently Locked to Account)
                </label>

                <div className="relative">
                  <SmoothInput
                    type="text"
                    disabled
                    value={
                      user
                        ? `${user.college.code} — ${user.college.name}`
                        : ''
                    }
                    className="h-11 w-full cursor-not-allowed rounded-full border border-white/10 bg-[#181D14]/80 pl-10 pr-4 text-xs font-semibold text-white sm:text-sm"
                  />

                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-[#C6DE41]" />
                </div>
              </div>

              {/* Branch and Academic Year */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Branch / Department
                  </label>

                  <SmoothInput
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE, IT, ECE, AI&DS"
                    className="h-11 w-full rounded-full border border-white/15 bg-[#181D14] px-4 text-xs text-white transition-colors placeholder:text-stone-500 focus:border-[#C6DE41] focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Academic Year
                  </label>

                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="h-11 w-full cursor-pointer rounded-full border border-white/15 bg-[#181D14] px-4 text-xs font-medium text-white transition-colors focus:border-[#C6DE41] focus:outline-none sm:text-sm"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                  Phone / WhatsApp Number
                </label>

                <SmoothInput
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="h-11 w-full rounded-full border border-white/15 bg-[#181D14] px-4 text-xs text-white transition-colors placeholder:text-stone-500 focus:border-[#C6DE41] focus:outline-none sm:text-sm"
                />
              </div>

              {/* Social Profiles */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Instagram Handle (Optional)
                  </label>

                  <SmoothInput
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle"
                    className="h-11 w-full rounded-full border border-white/15 bg-[#181D14] px-4 text-xs text-white transition-colors placeholder:text-stone-500 focus:border-[#C6DE41] focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    LinkedIn Profile (Optional)
                  </label>

                  <SmoothInput
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="h-11 w-full rounded-full border border-white/15 bg-[#181D14] px-4 text-xs text-white transition-colors placeholder:text-stone-500 focus:border-[#C6DE41] focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              {/* Why Join */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-300">
                  Why do you want to join as a Campus Hero?
                </label>

                <textarea
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us about yourself, your societies, or how you can connect students across your campus..."
                  className="w-full resize-none rounded-2xl border border-white/15 bg-[#181D14] p-4 text-xs text-white transition-colors placeholder:text-stone-500 focus:border-[#C6DE41] focus:outline-none sm:text-sm"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C6DE41] text-sm font-bold text-[#090B09] shadow-[0_0_20px_rgba(198,222,65,0.25)] transition-all hover:bg-[#D7EF59] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {submitting
                      ? 'Submitting Application...'
                      : 'Submit Hero Application'}
                  </span>
                </button>
              </div>

            </form>
          </div>
        )}
      </section>

      {/* =======================================
          7. FAQ ACCORDION
      ======================================= */}

      <section className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C6DE41]">
            Got Questions?
          </span>

          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-[20px] border border-white/10 bg-[#12160F] shadow-lg transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-semibold text-white transition-colors hover:text-[#C6DE41]"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isOpen
                        ? 'rotate-180 text-[#C6DE41]'
                        : 'text-stone-400'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-5 pb-5 pt-3 text-xs leading-relaxed text-stone-300 sm:text-sm">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>
    </div>
  );
};

export default CampusHeroesPage;
