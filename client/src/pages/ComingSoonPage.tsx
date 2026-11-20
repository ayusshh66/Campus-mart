
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';

export const ComingSoonPage: React.FC = () => {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#090B09] px-5 py-16 text-white light:bg-[#F7F8F2] light:text-[#171B13]">
      <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#101010] p-8 text-center shadow-xl light:border-[#DFE5D5] light:bg-white sm:p-12">

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C6DE41]/30 bg-[#C6DE41]/10">
          <Users className="h-6 w-6 text-[#C6DE41] light:text-[#526800]" />
        </div>

        <span className="inline-block rounded-full border border-[#C6DE41]/30 bg-[#C6DE41]/10 px-4 py-1.5 text-xs font-bold text-[#C6DE41] light:text-[#526800]">
          Launching Soon
        </span>

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Hackathon Teammates
        </h1>

        <p className="mt-4 text-sm leading-7 text-zinc-400 light:text-[#62695E]">
          We're focusing on buying and selling campus essentials
          right now. Hackathon team matching, student discovery,
          and invitations are coming in a future release.
        </p>

        <Link
          to="/buy"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#C6DE41] px-6 py-3 text-sm font-bold text-[#090B09] transition-colors hover:bg-[#D7EF59]"
        >
          Explore Marketplace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
};
