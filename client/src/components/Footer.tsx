
import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Truck,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 w-full border-t border-[#C6DE41]/20 bg-[#090B09] pt-16 pb-24 text-white md:pb-12">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Top Trust Ribbon */}
        <div className="mb-12 grid grid-cols-2 gap-4 border-b border-[#C6DE41]/15 pb-12 text-[12px] sm:grid-cols-4">
          {[
            {
              icon: Shield,
              title: "Verified Quality",
              description: "Diagnostic peer checks",
            },
            {
              icon: CheckCircle2,
              title: "Zero Haggling",
              description: "Fair fixed valuations",
            },
            {
              icon: Truck,
              title: "Campus Handover",
              description: "Library / gate dropoffs",
            },
            {
              icon: Users,
              title: "Student Only",
              description: "Zero stranger risk",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C6DE41]/20 bg-[#12160F]">
                <Icon className="h-4 w-4 text-[#C6DE41]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-white">
                  {title}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Footer Links */}
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-white">
                CampusMart
              </span>
              <span className="h-2 w-2 rounded-full bg-[#C6DE41] shadow-[0_0_8px_#C6DE41]" />
            </div>

            <p className="max-w-sm text-[13px] leading-relaxed tracking-tight text-zinc-400">
              India's verified campus recommerce network. Trade
              pre-loved lab kits, engineering tools, calculators,
              and books seamlessly with verified student peers.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C6DE41]/20 bg-[#12160F] px-3 py-1 text-[11px] text-white">
                <MapPin className="h-3 w-3 text-[#C6DE41]" />
                Active at BPIT, MAIT, MSIT, USAR & expanding
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-[12px] font-semibold tracking-tight text-white">
              Explore Market
            </h4>

            <ul className="space-y-2.5 text-[13px] text-zinc-400">
              {[
                { label: "Browse Gear Catalog", to: "/buy" },
                { label: "Instant Sell Valuation", to: "/sell" },
                { label: "Hackathon Teammates", to: "/find-teammates" },
                { label: "Campus Hero Program", to: "/campus-heroes" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-1 transition-colors hover:text-[#C6DE41]"
                  >
                    <span>{label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[12px] font-semibold tracking-tight text-white">
              Student Support
            </h4>

            <ul className="space-y-2.5 text-[13px] text-zinc-400">
              {[
                {
                  label: "My Orders & Sell Requests",
                  to: "/profile",
                },
                {
                  label: "My Hackathon Teams",
                  to: "/my-teams",
                },
                {
                  label: "Student Sign In",
                  to: "/login",
                },
                {
                  label: "Hero Operations Portal",
                  to: "/hero-dashboard",
                },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="transition-colors hover:text-[#C6DE41]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#C6DE41]/15 pt-8 text-[12px] text-zinc-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} CampusMart.
            All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <span>Campus Recommerce Protocol</span>
            <span>Privacy & College Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
