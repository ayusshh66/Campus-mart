import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, CampusHeroItem } from '../services/api';
import { 
  ShieldCheck, 
  MapPin, 
  Award, 
  Users, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Send,
  AlertCircle,
  TrendingUp,
  Gift,
  Briefcase,
  ChevronDown,
  Quote,
  Star,
  Check
} from 'lucide-react';

export const CampusHeroesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [existingApp, setExistingApp] = useState<CampusHeroItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [branch, setBranch] = useState<string>('Computer Science & Engineering');
  const [year, setYear] = useState<string>('2nd Year');
  const [phone, setPhone] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [linkedin, setLinkedin] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchExisting = async () => {
      if (user) {
        setPhone(user.phone || '');
        try {
          const app = await api.getMyCampusHeroApplication();
          setExistingApp(app);
        } catch (err) {
          console.error('Error fetching hero application:', err);
        }
      }
      setLoading(false);
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
      setError('Please tell us why you want to become a Campus Hero.');
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
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "How much time is required to be a Campus Hero?",
      a: "Just 2 to 3 hours per week. Most of the activities happen during your normal class breaks, coordinating item handovers between batchmates in campus common areas."
    },
    {
      q: "Can 1st year / freshers apply?",
      a: "Absolutely! Freshers make fantastic Campus Heroes because you can build connections across all batches from day one."
    },
    {
      q: "What perks and benefits will I receive?",
      a: "You receive an official Certificate of Leadership & Letter of Recommendation for LinkedIn/CV, milestone-based stipends, exclusive CampusMart hoodies & stickers, and early priority access to incoming products."
    },
    {
      q: "What is my core role on campus?",
      a: "You are the trusted ambassador for CampusMart at your college. You spread awareness, help students submit sell requests, verify items during handover, and ensure safe, scam-free campus exchanges."
    }
  ];

  return (
    <div className="space-y-16 pb-20 overflow-hidden">
      
      {/* 1. HERO BANNER */}
      <section className="relative bg-gradient-to-br from-[#063B32] via-[#09483D] to-[#03241F] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative glowing blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-campus-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-campus-light text-xs font-bold mb-6 backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-campus-primary animate-spin-slow" />
            <span>CAMPUS LEADERSHIP PROGRAM 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Become the Face of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-campus-light">
              CampusMart at Your College 🦸‍♂️
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            Represent your campus, help batchmates buy & sell verified gear safely, earn exclusive rewards, and lead the circular student economy.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 border-t border-white/10 text-left">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-white block">4+</span>
              <span className="text-xs text-slate-300 font-medium">Partner Campuses (BPIT, MAIT, MSIT, USAR)</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-white block">₹2.5L+</span>
              <span className="text-xs text-slate-300 font-medium">Saved by College Students</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-white block">100%</span>
              <span className="text-xs text-slate-300 font-medium">Safe Inside-Campus Handovers</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-white block">Official</span>
              <span className="text-xs text-slate-300 font-medium">Signed Leadership Credential</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. WHY BECOME A CAMPUS HERO (BENTO GRID) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary">Supercharge Your College Life</span>
          <h2 className="text-3xl font-extrabold text-campus-dark mt-1">
            Why Join the Campus Hero Program?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            More than just a campus rep role — it's real-world operations experience and tangible career advantages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Leadership Credential</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Official certificate & signed recommendation letter from CampusMart founders for your LinkedIn, internships, and placements.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Perks & Swag</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Custom CampusMart oversized hoodies, badges, stickers, plus performance-linked cash stipends for campus milestones.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Campus-Wide Influence</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Build direct contacts across branches, societies, and academic years. You become the go-to student leader on campus.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Fast-Track Internship</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Direct access to our startup core team with priority consideration for summer tech, marketing, and operations roles.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (ROADMAP) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-campus-soft/60 border border-campus-light rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-primary">Zero Hassle Onboarding</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-dark mt-1">
              Your 4-Step Journey to Becoming a Hero
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative">
              <span className="text-3xl font-black text-campus-primary/20 block mb-2">01</span>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Apply Online</h4>
              <p className="text-xs text-slate-500">Fill the 1-minute form below with your college details & branch.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative">
              <span className="text-3xl font-black text-campus-primary/20 block mb-2">02</span>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Quick 10-Min Chat</h4>
              <p className="text-xs text-slate-500">A friendly video call with our student operations team.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative">
              <span className="text-3xl font-black text-campus-primary/20 block mb-2">03</span>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Get Onboarded</h4>
              <p className="text-xs text-slate-500">Receive your digital Hero badge, campus guidelines, and swags.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative">
              <span className="text-3xl font-black text-campus-primary/20 block mb-2">04</span>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Lead Your Campus</h4>
              <p className="text-xs text-slate-500">Facilitate campus exchanges, earn stipends, and build reputation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STUDENT HERO SPOTLIGHTS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary">Hall of Fame</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-dark mt-1">
            Hear from Active Campus Heroes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed mb-6">
                "Being the BPIT Campus Hero helped me get recognized by professors and seniors. Helping juniors find affordable Casio scientific calculators and books during semester exams is super fulfilling, and the stipend covers all my weekend canteen bills!"
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-campus-primary text-white font-bold flex items-center justify-center text-sm">
                R
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Rahul Sharma</h4>
                <span className="text-xs text-campus-primary font-semibold">📍 BPIT • 3rd Year CSE</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed mb-6">
                "CampusMart solved the biggest headache in our college: scammy WhatsApp group sales. Now as the MAIT lead, everything is verified, pricing is fair, and I even listed the experience on my resume for summer internship applications."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                P
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Priya Singh</h4>
                <span className="text-xs text-campus-primary font-semibold">📍 MAIT • 2nd Year IT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. APPLICATION FORM SECTION */}
      <section id="apply-form" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {existingApp && !success ? (
          /* Already Applied Card */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-card text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-campus-dark mb-1">
              Application Under Review
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto">
              You applied on behalf of <strong className="text-campus-dark">{existingApp.college_code}</strong>.
              Our core team is currently reviewing your application and will reach out via WhatsApp/Phone soon.
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-xs font-bold text-slate-700">
              <span>Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                existingApp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                existingApp.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {existingApp.status}
              </span>
            </div>
          </div>
        ) : success ? (
          /* Just Submitted Success State */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 shadow-card text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-campus-dark mb-2">
              Application Submitted Successfully!
            </h3>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
              Thank you for stepping up to represent <strong className="text-campus-dark">{user?.college.code}</strong>. Our student ambassador team will contact you within 24 hours.
            </p>
            <Link
              to="/profile"
              className="px-6 py-3 bg-campus-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-campus-primary-hover transition-colors"
            >
              View Application in Profile
            </Link>
          </div>
        ) : (
          /* Application Form */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-campus-primary/5 rounded-bl-full pointer-events-none" />

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-soft text-campus-dark text-[11px] font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-campus-primary" />
                <span>60-Second Application</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-dark tracking-tight">
                Apply to Become a Campus Hero
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Tell us why you want to represent your college. No prior experience required!
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed font-semibold"
                />
              </div>

              {/* College (Strictly Locked) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  College (Permanently Locked to Account)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={user ? `${user.college.code} — ${user.college.name}` : ''}
                    className="w-full p-3.5 pl-10 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold cursor-not-allowed"
                  />
                  <MapPin className="w-4 h-4 text-campus-primary absolute left-3.5 top-4" />
                </div>
              </div>

              {/* Branch & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Branch / Department
                  </label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE, IT, ECE, AI&DS"
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary cursor-pointer font-medium"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
                />
              </div>

              {/* Social Profiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Instagram Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    LinkedIn Profile (Optional)
                  </label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
                  />
                </div>
              </div>

              {/* Why join? */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Why do you want to join as a Campus Hero?
                </label>
                <textarea
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us about yourself, your societies, or how you can connect students across your campus..."
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-sm sm:text-base shadow-hero hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Application...' : 'Submit Hero Application'}</span>
                </button>
              </div>

            </form>
          </div>
        )}
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-dark mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 hover:text-campus-primary transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-campus-primary' : 'text-slate-400'}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
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
