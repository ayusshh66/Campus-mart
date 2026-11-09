
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const benefits = [
  {
    title: 'Leadership Credential',
    description:
      'Official certificate & signed recommendation letter from CampusMart founders for your LinkedIn, internships, and placements.',
    Icon: Award,
  },
  {
    title: 'Perks & Swag',
    description:
      'Custom CampusMart oversized hoodies, badges, stickers, plus performance-linked cash stipends for campus milestones.',
    Icon: Gift,
  },
  {
    title: 'Campus-Wide Influence',
    description:
      'Build direct contacts across branches, societies, and academic years. You become the go-to student leader on campus.',
    Icon: Users,
  },
  {
    title: 'Fast-Track Internship',
    description:
      'Direct access to our startup core team with priority consideration for summer tech, marketing, and operations roles.',
    Icon: Briefcase,
  },
];

const testimonials = [
  {
    initial: 'R',
    name: 'Rahul Sharma',
    details: 'BPIT • 3rd Year CSE',
    quote:
      'Being the BPIT Campus Hero helped me get recognized by professors and seniors. Helping juniors find affordable Casio scientific calculators and books during semester exams is super fulfilling, and the stipend covers all my weekend canteen bills!',
  },
  {
    initial: 'P',
    name: 'Priya Singh',
    details: 'MAIT • 2nd Year IT',
    quote:
      'CampusMart solved the biggest headache in our college: scammy WhatsApp group sales. Now as the MAIT lead, everything is verified, pricing is fair, and I even listed the experience on my resume for summer internship applications.',
  },
];

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

const inputClass =
  'h-11 w-full min-w-0 rounded-full border border-white/15 bg-[#181D14] px-4 text-sm text-white outline-none transition-colors placeholder:text-stone-500 focus:border-[#C6DE41] light:border-[#DFE5D5] light:bg-[#F3F5EC] light:text-[#171B13]';

const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-300 light:text-[#57614E]';

export const CampusHeroesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [existingApp, setExistingApp] =
    useState<CampusHeroItem | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [branch, setBranch] = useState(
    'Computer Science & Engineering'
  );
  const [year, setYear] = useState('2nd Year');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [reason, setReason] = useState('');

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ========================================
  // FETCH EXISTING CAMPUS HERO APPLICATION
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const fetchExisting = async () => {
      if (!user) {
        setExistingApp(null);
        return;
      }

      setPhone(user.phone || '');

      try {
        const app = await api.getMyCampusHeroApplication();

        if (!cancelled) {
          setExistingApp(app);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            'Error fetching hero application:',
            err
          );
        }
      }
    };

    fetchExisting();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ========================================
  // SUBMIT APPLICATION
  // ========================================

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

      try {
        const app = await api.getMyCampusHeroApplication();
        setExistingApp(app);
      } catch (refreshError) {
        console.error(
          'Application submitted, but status refresh failed:',
          refreshError
        );
      }
    } catch (err: any) {
      setError(
        err.message || 'Failed to submit application'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="
        relative isolate min-h-screen
        space-y-16 overflow-hidden
        bg-[#090B09] pb-20 text-white
        transition-colors duration-200
        light:bg-[#F7F8F2]
        light:text-[#171B13]
      "
    >
      {/* =====================================
          1. HERO BANNER
          Heavy Unicorn background disabled
      ===================================== */}

      <section
        className="
          relative z-10 mx-auto
          max-w-[1200px]
          overflow-hidden rounded-[28px]
          border border-[#C6DE41]/20
          bg-[#12160F]/60
          px-4 pb-24 pt-16
          text-white
          shadow-[0_0_60px_rgba(198,222,65,0.08)]
          backdrop-blur-md
          sm:px-6 lg:px-8
          light:border-[#DFE5D5]
          light:bg-white/85
          light:text-[#171B13]
        "
      >
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div
            className="
              mb-6 inline-flex items-center gap-2
              rounded-full
              border border-[#C6DE41]/30
              bg-[#C6DE41]/10
              px-4 py-1.5
              text-xs font-bold text-[#C6DE41]
            "
          >
            <Sparkles className="h-3.5 w-3.5" />
            CAMPUS LEADERSHIP PROGRAM 2026
          </div>

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
              text-sm leading-relaxed
              text-stone-300
              sm:text-base
              light:text-[#57614E]
            "
          >
            Represent your campus, help batchmates buy & sell
            verified gear safely, earn exclusive rewards,
            and lead the circular student economy.
          </p>

          <div
            className="
              mx-auto grid max-w-3xl
              grid-cols-2 gap-3
              border-t border-white/10
              pt-6 text-left
              sm:grid-cols-4
              light:border-[#DFE5D5]
            "
          >
            {[
              ['4+', 'Partner Campuses (BPIT, MAIT, MSIT, USAR)'],
              ['₹2.5L+', 'Saved by College Students'],
              ['100%', 'Safe Inside-Campus Handovers'],
              ['Official', 'Signed Leadership Credential'],
            ].map(([value, description]) => (
              <div
                key={value}
                className="
                  rounded-2xl
                  border border-white/10
                  bg-[#181D14] p-4
                  light:border-[#DFE5D5]
                  light:bg-white
                "
              >
                <span
                  className="
                    block text-2xl font-black
                    tracking-tight text-[#C6DE41]
                    sm:text-3xl
                  "
                >
                  {value}
                </span>

                <span
                  className="
                    text-[11px] font-medium
                    text-stone-400
                    light:text-[#57614E]
                  "
                >
                  {description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================
          2. BENEFITS
      ===================================== */}

      <section
        className="
          relative z-10 mx-auto
          max-w-6xl px-4
          sm:px-6 lg:px-8
        "
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span
            className="
              text-[11px] font-bold
              uppercase tracking-wider
              text-[#C6DE41]
            "
          >
            Supercharge Your College Life
          </span>

          <h2
            className="
              mt-2 text-3xl font-extrabold
              tracking-tight text-white
              light:text-[#171B13]
            "
          >
            Why Join the Campus Hero Program?
          </h2>

          <p
            className="
              mt-3 text-sm leading-relaxed
              text-stone-400
              light:text-[#57614E]
            "
          >
            More than just a campus rep role — it's real-world
            operations experience and tangible career advantages.
          </p>
        </div>

        <div
          className="
            grid grid-cols-1 gap-6
            md:grid-cols-2
            lg:grid-cols-4
          "
        >
          {benefits.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="
                rounded-[28px]
                border border-white/10
                bg-[#12160F] p-6
                shadow-lg transition-all
                hover:border-[#C6DE41]/40
                hover:shadow-[0_0_30px_rgba(198,222,65,0.1)]
                light:border-[#DFE5D5]
                light:bg-white
              "
            >
              <div
                className="
                  mb-4 flex h-12 w-12
                  items-center justify-center
                  rounded-full
                  border border-[#C6DE41]/20
                  bg-[#C6DE41]/10
                  text-[#C6DE41]
                "
              >
                <Icon className="h-5 w-5" />
              </div>

              <h3
                className="
                  mb-2 text-lg font-bold
                  text-white
                  light:text-[#171B13]
                "
              >
                {title}
              </h3>

              <p
                className="
                  text-[13px] leading-relaxed
                  text-stone-400
                  light:text-[#57614E]
                "
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          3. JOURNEY + APPLICATION
          Wider desktop layout

          Left  = 4-step gallery
          Right = application form

          Mobile = stacked
      ===================================== */}

      <section
        className="
          relative z-10 mx-auto
          w-full max-w-[1700px]
          px-4 sm:px-6 lg:px-8
        "
      >
        <div
          className="
            grid grid-cols-1
            items-start gap-7
            xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]
            xl:gap-8
          "
        >
          {/* LEFT: ANIMATED JOURNEY */}

          

          {/* RIGHT: APPLICATION FORM */}

          <div
            id="apply-form"
            className="min-w-0 scroll-mt-28"
          >
            {success ? (
              /* SUCCESS MESSAGE */

              <div
                className="
                  rounded-[28px]
                  border border-[#C6DE41]/30
                  bg-[#12160F]
                  p-8 text-center shadow-xl
                  sm:p-12
                  light:bg-white
                "
              >
                <div
                  className="
                    mx-auto mb-4 flex h-16 w-16
                    items-center justify-center
                    rounded-full
                    border border-[#C6DE41]/30
                    bg-[#C6DE41]/15
                    text-[#C6DE41]
                  "
                >
                  <CheckCircle className="h-8 w-8" />
                </div>

                <h3
                  className="
                    mb-3 text-2xl font-extrabold
                    text-white
                    light:text-[#171B13]
                  "
                >
                  Application Submitted Successfully!
                </h3>

                <p
                  className="
                    mx-auto mb-6 max-w-md
                    text-sm leading-relaxed
                    text-stone-400
                    light:text-[#57614E]
                  "
                >
                  Thank you for stepping up to represent{' '}
                  <strong
                    className="
                      text-white
                      light:text-[#171B13]
                    "
                  >
                    {user?.college.code}
                  </strong>.
                  {' '}Our student ambassador team will
                  contact you about the next steps.
                </p>

                <Link
                  to="/profile"
                  className="
                    inline-flex items-center
                    justify-center rounded-full
                    bg-[#C6DE41]
                    px-6 py-3
                    text-sm font-bold
                    text-[#090B09]
                    transition-colors
                    hover:bg-[#D7EF59]
                  "
                >
                  View Application in Profile
                </Link>
              </div>
            ) : existingApp ? (
              /* EXISTING APPLICATION */

              <div
                className="
                  rounded-[28px]
                  border border-white/10
                  bg-[#12160F]
                  p-8 text-center
                  shadow-xl sm:p-12
                  light:border-[#DFE5D5]
                  light:bg-white
                "
              >
                <div
                  className="
                    mx-auto mb-4 flex h-16 w-16
                    items-center justify-center
                    rounded-full
                    border border-amber-500/20
                    bg-amber-500/10
                    text-amber-400
                  "
                >
                  <Clock className="h-8 w-8" />
                </div>

                <h3
                  className="
                    mb-3 text-2xl font-extrabold
                    text-white
                    light:text-[#171B13]
                  "
                >
                  {existingApp.status === 'APPROVED'
                    ? 'Application Approved'
                    : existingApp.status === 'REJECTED'
                    ? 'Application Status'
                    : 'Application Under Review'}
                </h3>

                <p
                  className="
                    mx-auto mb-6 max-w-md
                    text-sm leading-relaxed
                    text-stone-400
                    light:text-[#57614E]
                  "
                >
                  You applied on behalf of{' '}
                  <strong
                    className="
                      text-white
                      light:text-[#171B13]
                    "
                  >
                    {existingApp.college_code}
                  </strong>.
                  {' '}Your application status is displayed below.
                </p>

                <div
                  className="
                    inline-flex items-center gap-2
                    rounded-full
                    border border-white/10
                    bg-[#181D14]
                    px-5 py-2.5
                    text-xs font-semibold
                    text-stone-300
                  "
                >
                  <span>Status:</span>

                  <span
                    className={`
                      rounded-full border
                      px-3 py-1 text-xs font-bold
                      ${
                        existingApp.status === 'APPROVED'
                          ? 'border-[#C6DE41]/40 bg-[#C6DE41]/20 text-[#C6DE41]'
                          : existingApp.status === 'REJECTED'
                          ? 'border-rose-500/30 bg-rose-500/20 text-rose-400'
                          : 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                      }
                    `}
                  >
                    {existingApp.status}
                  </span>
                </div>
              </div>
            ) : (
              /* APPLICATION FORM */

              <div
                className="
                  relative min-w-0
                  overflow-hidden
                  rounded-[28px]
                  border border-white/10
                  bg-[#12160F]
                  p-6 shadow-2xl
                  sm:p-8 2xl:p-10
                  light:border-[#DFE5D5]
                  light:bg-white
                "
              >
                {/* FORM HEADING */}

                <div className="mb-8">
                  <div
                    className="
                      mb-4 inline-flex items-center
                      gap-2 rounded-full
                      border border-[#C6DE41]/20
                      bg-[#C6DE41]/10
                      px-4 py-1.5
                      text-xs font-bold
                      text-[#C6DE41]
                    "
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    60-Second Application
                  </div>

                  <h2
                    className="
                      text-2xl font-extrabold
                      leading-tight tracking-tight
                      text-white
                      sm:text-3xl 2xl:text-4xl
                      light:text-[#171B13]
                    "
                  >
                    Apply to Become a Campus Hero
                  </h2>

                  <p
                    className="
                      mt-3 text-sm leading-relaxed
                      text-stone-400
                      light:text-[#57614E]
                    "
                  >
                    Tell us why you want to represent your college.
                    No prior experience required!
                  </p>
                </div>

                {/* ERROR MESSAGE */}

                {error && (
                  <div
                    role="alert"
                    className="
                      mb-6 flex items-center gap-2
                      rounded-2xl
                      border border-rose-500/30
                      bg-rose-500/10
                      p-4 text-sm text-rose-300
                    "
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* APPLICATION FORM FIELDS */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* FULL NAME */}

                  <div>
                    <label
                      htmlFor="hero-name"
                      className={labelClass}
                    >
                      Full Name
                    </label>

                    <SmoothInput
                      id="hero-name"
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="
                        h-11 w-full rounded-full
                        border border-white/10
                        bg-[#181D14]/80
                        px-4 text-sm
                        text-stone-400
                        disabled:cursor-not-allowed
                        light:bg-[#F3F5EC]
                      "
                    />
                  </div>

                  {/* COLLEGE */}

                  <div>
                    <label
                      htmlFor="hero-college"
                      className={labelClass}
                    >
                      College (Permanently Locked to Account)
                    </label>

                    <div className="relative">
                      <SmoothInput
                        id="hero-college"
                        type="text"
                        disabled
                        value={
                          user
                            ? `${user.college.code} — ${user.college.name}`
                            : ''
                        }
                        className="
                          h-11 w-full rounded-full
                          border border-white/10
                          bg-[#181D14]/80
                          pl-10 pr-4
                          text-sm text-white
                          disabled:cursor-not-allowed
                          light:bg-[#F3F5EC]
                          light:text-[#171B13]
                        "
                      />

                      <MapPin
                        className="
                          pointer-events-none
                          absolute left-3.5 top-3.5
                          h-4 w-4 text-[#C6DE41]
                        "
                      />
                    </div>
                  </div>

                  {/* BRANCH AND YEAR */}

                  <div
                    className="
                      grid grid-cols-1 gap-4
                      sm:grid-cols-2
                    "
                  >
                    <div className="min-w-0">
                      <label
                        htmlFor="hero-branch"
                        className={labelClass}
                      >
                        Branch / Department
                      </label>

                      <SmoothInput
                        id="hero-branch"
                        type="text"
                        required
                        value={branch}
                        onChange={(e) =>
                          setBranch(e.target.value)
                        }
                        placeholder="e.g. CSE, IT, ECE"
                        className={inputClass}
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        htmlFor="hero-year"
                        className={labelClass}
                      >
                        Academic Year
                      </label>

                      <select
                        id="hero-year"
                        value={year}
                        onChange={(e) =>
                          setYear(e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="1st Year">
                          1st Year
                        </option>
                        <option value="2nd Year">
                          2nd Year
                        </option>
                        <option value="3rd Year">
                          3rd Year
                        </option>
                        <option value="4th Year">
                          4th Year
                        </option>
                        <option value="Postgraduate">
                          Postgraduate
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* PHONE NUMBER */}

                  <div>
                    <label
                      htmlFor="hero-phone"
                      className={labelClass}
                    >
                      Phone / WhatsApp Number
                    </label>

                    <SmoothInput
                      id="hero-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="10-digit mobile number"
                      className={inputClass}
                    />
                  </div>

                  {/* SOCIAL MEDIA */}

                  <div
                    className="
                      grid grid-cols-1 gap-4
                      sm:grid-cols-2
                    "
                  >
                    <div className="min-w-0">
                      <label
                        htmlFor="hero-instagram"
                        className={labelClass}
                      >
                        Instagram Handle (Optional)
                      </label>

                      <SmoothInput
                        id="hero-instagram"
                        type="text"
                        value={instagram}
                        onChange={(e) =>
                          setInstagram(e.target.value)
                        }
                        placeholder="@yourhandle"
                        className={inputClass}
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        htmlFor="hero-linkedin"
                        className={labelClass}
                      >
                        LinkedIn Profile (Optional)
                      </label>

                      <SmoothInput
                        id="hero-linkedin"
                        type="text"
                        value={linkedin}
                        onChange={(e) =>
                          setLinkedin(e.target.value)
                        }
                        placeholder="https://linkedin.com/in/..."
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* APPLICATION REASON */}

                  <div>
                    <label
                      htmlFor="hero-reason"
                      className={labelClass}
                    >
                      Why do you want to join as a Campus Hero?
                    </label>

                    <textarea
                      id="hero-reason"
                      rows={5}
                      required
                      value={reason}
                      onChange={(e) =>
                        setReason(e.target.value)
                      }
                      placeholder="Tell us about yourself, your societies, or how you can connect students across your campus..."
                      className="
                        w-full resize-y
                        rounded-2xl
                        border border-white/15
                        bg-[#181D14]
                        p-4 text-sm text-white
                        outline-none
                        transition-colors
                        placeholder:text-stone-500
                        focus:border-[#C6DE41]
                        light:border-[#DFE5D5]
                        light:bg-[#F3F5EC]
                        light:text-[#171B13]
                      "
                    />
                  </div>

                  {/* SUBMIT BUTTON */}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="
                      flex h-12 w-full
                      items-center justify-center
                      gap-2 rounded-full
                      bg-[#C6DE41]
                      text-sm font-bold
                      text-[#090B09]
                      shadow-[0_0_20px_rgba(198,222,65,0.25)]
                      transition-colors
                      hover:bg-[#D7EF59]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Send className="h-4 w-4" />

                    {submitting
                      ? 'Submitting Application...'
                      : 'Submit Hero Application'}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div
            className="
              min-w-0 overflow-hidden
              rounded-[28px]
              border border-white/10
              bg-[#12160F]
              p-5 shadow-xl
              sm:p-7 xl:p-6
              2xl:p-8
              light:border-[#DFE5D5]
              light:bg-white
            "
          >
            <div className="mb-8 text-center">
              <span
                className="
                  text-xs font-bold
                  uppercase tracking-wider
                  text-[#C6DE41]
                "
              >
                Zero Hassle Onboarding
              </span>

              <h2
                className="
                  mx-auto mt-3 max-w-xl
                  text-2xl font-extrabold
                  leading-tight tracking-tight
                  text-white sm:text-3xl
                  light:text-[#171B13]
                "
              >
                Your 4-Step Journey to Becoming a Hero
              </h2>
            </div>

            <div className="min-w-0">
              <CampusHeroStepsGallery />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          4. TESTIMONIALS
          BELOW THE GALLERY + FORM
      ===================================== */}

      <section
        className="
          relative z-10 mx-auto
          max-w-5xl px-4
          sm:px-6 lg:px-8
        "
      >
        <div className="mb-10 text-center">
          <span
            className="
              text-xs font-bold
              uppercase tracking-wider
              text-[#C6DE41]
            "
          >
            Hall of Fame
          </span>

          <h2
            className="
              mt-2 text-2xl font-extrabold
              tracking-tight text-white
              sm:text-3xl
              light:text-[#171B13]
            "
          >
            Hear from Active Campus Heroes
          </h2>
        </div>

        <div
          className="
            grid grid-cols-1 gap-6
            md:grid-cols-2
          "
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="
                flex flex-col justify-between
                rounded-3xl
                border border-white/10
                bg-[#12160F]
                p-6 shadow-lg
                sm:p-8
                light:border-[#DFE5D5]
                light:bg-white
              "
            >
              <div>
                <div
                  className="
                    mb-3 flex items-center
                    gap-1 text-[#C6DE41]
                  "
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-[#C6DE41]"
                    />
                  ))}
                </div>

                <p
                  className="
                    mb-6 text-sm italic
                    leading-relaxed
                    text-stone-300
                    light:text-[#57614E]
                  "
                >
                  "{testimonial.quote}"
                </p>
              </div>

              <div
                className="
                  flex items-center gap-3
                  border-t border-white/10
                  pt-4
                  light:border-[#DFE5D5]
                "
              >
                <div
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    bg-[#C6DE41]
                    text-sm font-bold
                    text-[#090B09]
                  "
                >
                  {testimonial.initial}
                </div>

                <div>
                  <h4
                    className="
                      text-sm font-bold
                      text-white
                      light:text-[#171B13]
                    "
                  >
                    {testimonial.name}
                  </h4>

                  <span
                    className="
                      text-xs font-semibold
                      text-[#C6DE41]
                    "
                  >
                    📍 {testimonial.details}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          5. FAQ SECTION
      ===================================== */}

      <section
        className="
          relative z-10 mx-auto
          max-w-3xl px-4
          sm:px-6 lg:px-8
        "
      >
        <div className="mb-8 text-center">
          <span
            className="
              text-xs font-bold
              uppercase tracking-wider
              text-[#C6DE41]
            "
          >
            Got Questions?
          </span>

          <h2
            className="
              mt-2 text-2xl font-extrabold
              tracking-tight text-white
              sm:text-3xl
              light:text-[#171B13]
            "
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;

            return (
              <div
                key={faq.q}
                className="
                  overflow-hidden
                  rounded-[20px]
                  border border-white/10
                  bg-[#12160F]
                  shadow-lg transition-colors
                  light:border-[#DFE5D5]
                  light:bg-white
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(isOpen ? null : idx)
                  }
                  aria-expanded={isOpen}
                  className="
                    flex w-full items-center
                    justify-between gap-4
                    p-5 text-left
                    text-sm font-semibold
                    text-white
                    transition-colors
                    hover:text-[#C6DE41]
                    light:text-[#171B13]
                  "
                >
                  <span>{faq.q}</span>

                  <ChevronDown
                    className={`
                      h-4 w-4 shrink-0
                      transition-transform
                      ${
                        isOpen
                          ? 'rotate-180 text-[#C6DE41]'
                          : 'text-stone-400'
                      }
                    `}
                  />
                </button>

                {isOpen && (
                  <div
                    className="
                      border-t border-white/10
                      px-5 pb-5 pt-3
                      text-sm leading-relaxed
                      text-stone-300
                      light:border-[#DFE5D5]
                      light:text-[#57614E]
                    "
                  >
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
