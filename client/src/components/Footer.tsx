import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-campus-dark text-white border-t border-campus-dark/40 pb-20 md:pb-8 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-campus-primary flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Campus<span className="text-campus-light">Mart</span>
              </span>
            </div>
            <p className="text-slate-300 text-sm max-w-sm leading-relaxed">
              The student-exclusive recommerce platform. Buy and sell pre-loved campus gear with fixed fair pricing, zero scams, and hyper-local pickup.
            </p>
            <div className="flex items-center gap-2 text-xs text-campus-light font-medium pt-1">
              <MapPin className="w-3.5 h-3.5 text-campus-primary" />
              <span>Exclusively supporting BPIT, MAIT, MSIT, and USAR campuses.</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/buy" className="hover:text-campus-light transition-colors">Campus Catalog</Link></li>
              <li><Link to="/sell" className="hover:text-campus-light transition-colors">Sell an Item</Link></li>
              <li><Link to="/campus-heroes" className="hover:text-campus-light transition-colors">Join as Campus Hero</Link></li>
              <li><Link to="/profile" className="hover:text-campus-light transition-colors">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Campus Trust</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-campus-primary shrink-0 mt-0.5" />
                <span>Admin-verified pricing and item condition inspection.</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-campus-primary shrink-0 mt-0.5" />
                <span>Zero stranger meetings — pick up directly inside campus.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} CampusMart. Built exclusively for college communities.</p>
          <p className="flex items-center gap-1">
            <span>Clean, simple & student-powered.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
