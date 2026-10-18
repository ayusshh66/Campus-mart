import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, MapPin, CheckCircle2, ArrowUpRight, Heart, Users, Truck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-campus-dark text-white border-t border-campus-dark/40 pb-24 md:pb-10 pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-10 border-b border-white/10 mb-10 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-campus-light shrink-0">
              <Shield className="w-4 h-4 text-campus-light" />
            </div>
            <div>
              <p className="font-bold text-white text-[13px]">Verified Quality</p>
              <p className="text-slate-400 text-[11px]">Strict physical & diagnostic check</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-campus-light shrink-0">
              <CheckCircle2 className="w-4 h-4 text-campus-light" />
            </div>
            <div>
              <p className="font-bold text-white text-[13px]">Transparent Pricing</p>
              <p className="text-slate-400 text-[11px]">Admin-fixed fair rates. 0 haggling</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-campus-light shrink-0">
              <Truck className="w-4 h-4 text-campus-light" />
            </div>
            <div>
              <p className="font-bold text-white text-[13px]">Campus Delivery</p>
              <p className="text-slate-400 text-[11px]">Handed over directly in college</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-campus-light shrink-0">
              <Users className="w-4 h-4 text-campus-light" />
            </div>
            <div>
              <p className="font-bold text-white text-[13px]">Student Exclusivity</p>
              <p className="text-slate-400 text-[11px]">Zero strangers, verified peers</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-campus-primary flex items-center justify-center text-white font-extrabold text-base shadow-md">
                C
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Campus<span className="text-campus-light">Mart</span>
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-sm leading-relaxed">
              India's student-exclusive recommerce network. Trade pre-loved lab kits, engineering gear, calculators, and books seamlessly with verified college peers.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-campus-light font-medium pt-2">
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[11px]">
                <MapPin className="w-3 h-3 text-campus-primary" />
                Active at BPIT, MAIT, MSIT, USAR & expanding
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Recommerce Market</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/buy" className="hover:text-campus-light transition-colors flex items-center gap-1">
                  <span>Browse Campus Catalog</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-campus-light transition-colors flex items-center gap-1">
                  <span>Sell & Instant Valuation</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/find-teammates" className="hover:text-campus-light transition-colors flex items-center gap-1">
                  <span>Find Hackathon Teammates</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/campus-heroes" className="hover:text-campus-light transition-colors flex items-center gap-1">
                  <span>Campus Hero Program</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Student Support</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/profile" className="hover:text-campus-light transition-colors">
                  My Orders & Sell Requests
                </Link>
              </li>
              <li>
                <Link to="/my-teams" className="hover:text-campus-light transition-colors">
                  My Hackathon Teams
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-campus-light transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link to="/hero-dashboard" className="hover:text-campus-light transition-colors">
                  Hero Operations Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} CampusMart. Designed exclusively for engineering & college campuses.</p>
          <p className="flex items-center gap-1 text-slate-400">
            <span>Built with care for students</span>
            <Heart className="w-3 h-3 text-campus-primary fill-campus-primary" />
          </p>
        </div>
      </div>
    </footer>
  );
};
