import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';

/** Skiper 19-inspired scroll-drawn stroke, constrained to its own section. */
export const HomeScrollAccent: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const progress = useTransform(scrollYProgress, [0.08, 0.88], [0, 1]);

  return (
    <section
      ref={ref}
      className="relative isolate mx-auto w-full max-w-[1200px] overflow-hidden rounded-[28px] bg-slate-950 px-6 py-14 text-white sm:px-12 sm:py-20"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 380"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60"
      >
        <motion.path
          d="M-60 290 C100 50, 260 390, 430 160 S710 30, 790 225 S1080 410, 1260 60"
          fill="none"
          stroke="#C6DE41"
          strokeWidth="12"
          strokeLinecap="round"
          style={{ pathLength: reduceMotion ? 1 : progress }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/35" />
      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#C6DE41]/30 bg-[#C6DE41]/15 px-3 py-1 text-xs font-semibold text-[#C6DE41]">
          <Sparkles className="h-3.5 w-3.5" /> More than a marketplace
        </span>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Good gear. Great teams. One campus.
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200 sm:text-base">
          Find your next essential, then find the people who will help you build your next big idea.
        </p>
        <Link
          to="/find-teammates"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] px-5 py-3 text-sm font-bold text-[#090B09] shadow-lg shadow-[#C6DE41]/20 transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6DE41]"
        >
          Discover hackathon teams <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <a
        href="https://skiper-ui.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-4 z-10 text-[10px] text-slate-300 underline underline-offset-2 hover:text-white"
      >Motion inspired by Skiper UI</a>
    </section>
  );
};
