import { TextRoll } from './motion/TextRoll';
import { SmoothInput } from './motion/SmoothInput';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, College } from '../services/api';
import {
  ShoppingBag,
  Tag,
  User as UserIcon,
  MapPin,
  LogOut,
  LogIn,
  Home,
  Users,
  ChevronDown,
  Search,
  X,
  Check,
  Building2,
  RotateCcw
} from 'lucide-react';

// 21st.dev Navbar Menu: original spring timing and layout animation,
// adapted for React Router and CampusMart's dark/violet color palette.
const menuTransition = {
  type: 'spring' as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

type MenuItemProps = {
  label: string;
  to: string;
  active: string | null;
  setActive: (item: string | null) => void;
  current: boolean;
  children: React.ReactNode;
};

const MenuItem: React.FC<MenuItemProps> = ({
  label, to, active, setActive, current, children,
}) => (
  <div
    className="relative"
    onMouseEnter={() => setActive(label)}
    onFocus={() => setActive(label)}
  >
    <motion.div transition={{ duration: 0.3 }}>
      <Link
        to={to}
        aria-current={current ? 'page' : undefined}
        aria-expanded={active === label}
        className={`block whitespace-nowrap rounded-full px-2.5 py-2 text-[12px] font-medium transition-colors lg:text-[13px] ${current ? 'text-[#C6DE41]' : 'text-white hover:text-[#C6DE41]'
          }`}
      >
        {label}
      </Link>
    </motion.div>

    {active === label && (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={menuTransition}
        className="absolute left-1/2 top-full z-[70] -translate-x-1/2 pt-4"
      >
        <motion.div
          layoutId="campusmart-navbar-active"
          transition={menuTransition}
          className="overflow-hidden rounded-2xl border border-[#C6DE41]/30 bg-[#0A0D08]/95 shadow-xl backdrop-blur-md"
        >
          <motion.div layout className="flex w-max min-w-[185px] flex-col gap-1 p-4 text-sm">
            {children}
          </motion.div>
        </motion.div>
      </motion.div>
    )}
  </div>
);

const HoveredLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link
    to={to}
    className="rounded-lg px-3 py-2 text-zinc-300 transition-colors hover:bg-[#C6DE41]/15 hover:text-[#C6DE41]"
  >
    {children}
  </Link>
);

export const Navbar: React.FC = () => {
  const { user, logout, selectedCollegeId, setSelectedCollegeId, resetToHomeCollege, isBrowsingOtherCollege, marketplaceMode, setMarketplaceMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState<College[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const list = await api.getColleges();
        setColleges(list);
      } catch (err) {
        console.error('Failed to fetch colleges for navbar:', err);
      }
    };
    fetchColleges();
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowCollegeModal(false);
      }
    };
    if (showCollegeModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCollegeModal]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Find active college details
  const activeCollege = colleges.find((c) => c.id === selectedCollegeId) || (user ? user.college : colleges[0]);

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  return (
    <>
      {/* Top Banner - Shop App Style Notice */}
      <div className="bg-[#090B09] text-white py-2 px-4 text-center text-xs font-medium tracking-tight border-b border-[#C6DE41]/20 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C6DE41] shadow-[0_0_8px_#C6DE41] shrink-0" />
          <span className="text-white font-semibold">CampusMart Recommerce:</span>
          <span className="text-white/90">Verified student-to-student handover with zero shipping fee</span>
        </div>
      </div>

      {/* Main Top Header */}
      <header className="sticky top-0 z-50 border-b border-[#C6DE41]/20 bg-[#090B09]/90 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: Brand Logo & Interactive Campus Selector */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-1.5 group shrink-0">
              <span className="font-bold text-[20px] tracking-tightest text-white">
                CampusMart
              </span>
              <span className="w-2 h-2 rounded-full bg-[#C6DE41] mb-1 shadow-[0_0_8px_rgba(198,222,65,0.6)]" />
            </Link>

            {/* Interactive Campus Selector Button */}
            <div className="relative">
              <button
                onClick={() => setShowCollegeModal(!showCollegeModal)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shadow-shop-pill ${isBrowsingOtherCollege
                    ? 'bg-amber-900/30 border border-amber-500/40 text-white'
                    : 'bg-[#12160F] border border-[#C6DE41]/30 text-white hover:border-[#C6DE41]/70'
                  }`}
                title="Click to switch active campus"
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${isBrowsingOtherCollege ? 'text-amber-500' : 'text-[#C6DE41]'}`} />
                <span className="font-semibold text-white">
                  {activeCollege ? activeCollege.code : 'All Campuses'}
                </span>
                <span className="hidden xl:inline text-zinc-400 text-[11px] max-w-[110px] truncate">
                  ({activeCollege ? activeCollege.name.split('-')[0].trim() : 'Select'})
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0 ml-0.5" />
              </button>

              {/* Campus Selector Popover */}
              {showCollegeModal && (
                <div
                  ref={modalRef}
                  className="absolute left-0 mt-2 w-80 sm:w-96 bg-[#0E120A]/95 rounded-[28px] shadow-2xl border border-[#C6DE41]/30 p-5 z-50 text-white animate-fade-in backdrop-blur-md"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#C6DE41]/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#C6DE41]/15 flex items-center justify-center text-[#C6DE41]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-white">Select Campus</h4>
                        <p className="text-[11px] text-zinc-400">Browse listings specific to your college</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCollegeModal(false)}
                      className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Campus Input */}
                  <div className="relative my-3">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <SmoothInput
                      type="text"
                      placeholder="Search college code or name..."
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[12px] rounded-full border border-[#C6DE41]/30 bg-white/5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C6DE41]"
                    />
                  </div>

                  {/* College Options List */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {filteredColleges.map((col) => {
                      const isSelected = activeCollege?.id === col.id;
                      const isUserHome = user && user.college.id === col.id;

                      return (
                        <button
                          key={col.id}
                          onClick={() => {
                            setSelectedCollegeId(col.id);
                            setShowCollegeModal(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-[16px] text-left text-[12px] transition-all ${isSelected
                              ? 'bg-[#C6DE41]/20 text-[#C6DE41] font-semibold border border-[#C6DE41]/30'
                              : 'hover:bg-[#C6DE41]/10 text-zinc-300 hover:text-white'
                            }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{col.code}</span>
                              {isUserHome && (
                                <span className="px-1.5 py-0.2 text-[9px] font-medium rounded-full bg-[#C6DE41]/20 text-[#C6DE41] border border-[#C6DE41]/30">
                                  Home
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 line-clamp-1">{col.name}</span>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-[#C6DE41] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}

                    {filteredColleges.length === 0 && (
                      <p className="text-center text-[12px] text-zinc-400 py-4">No colleges match your query.</p>
                    )}
                  </div>

                  {/* Reset to Home Campus Action */}
                  {user && isBrowsingOtherCollege && (
                    <div className="pt-3 mt-2 border-t border-[#C6DE41]/20 flex items-center justify-between">
                      <span className="text-[11px] text-amber-400">Browsing alternate campus</span>
                      <button
                        onClick={() => {
                          resetToHomeCollege();
                          setShowCollegeModal(false);
                        }}
                        className="text-[12px] font-medium text-[#C6DE41] hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to {user.college.code}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 21st.dev-style black pill menu with #C6DE41 border and spring dropdowns */}
          <nav
            className="relative hidden items-center justify-center gap-0.5 rounded-full border border-[#C6DE41]/30 bg-[#090B09] px-3 py-1.5 shadow-lg lg:flex"
            onMouseLeave={() => setActiveMenu(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setActiveMenu(null); }}
          >
            {marketplaceMode === 'SELLER' ? (
              /* Seller Mode Desktop Navigation */
              <>
                <MenuItem label="Sell Gear" to="/sell" active={activeMenu} setActive={setActiveMenu} current={isActive('/sell')}>
                  <HoveredLink to="/sell">Submit Item to Sell</HoveredLink>
                  <HoveredLink to="/profile">Track Payouts & Valuation</HoveredLink>
                </MenuItem>
                <MenuItem label="My Submissions" to="/profile" active={activeMenu} setActive={setActiveMenu} current={isActive('/profile')}>
                  <HoveredLink to="/profile">Submission Review Status</HoveredLink>
                  <HoveredLink to="/profile">Payout Quotes</HoveredLink>
                </MenuItem>
                <MenuItem label="Teammates" to="/find-teammates" active={activeMenu} setActive={setActiveMenu} current={isActive('/find-teammates') || isActive('/teams')}>
                  <HoveredLink to="/find-teammates">Browse Team Openings</HoveredLink>
                  <HoveredLink to="/teams/create">Create Team Post</HoveredLink>
                  {user && <HoveredLink to="/my-teams">My Teams</HoveredLink>}
                </MenuItem>
                <MenuItem label="Heroes" to="/campus-heroes" active={activeMenu} setActive={setActiveMenu} current={isActive('/campus-heroes')}>
                  <HoveredLink to="/campus-heroes">Campus Hero Program</HoveredLink>
                  {(user?.role === 'CAMPUS_HERO' || user?.role === 'ADMIN') && (
                    <HoveredLink to="/hero-dashboard">Hero Operations</HoveredLink>
                  )}
                </MenuItem>
                {user && (
                  <MenuItem label="My Teams" to="/my-teams" active={activeMenu} setActive={setActiveMenu} current={isActive('/my-teams')}>
                    <HoveredLink to="/my-teams">My Team Applications</HoveredLink>
                    <HoveredLink to="/find-teammates">Find Teammates</HoveredLink>
                  </MenuItem>
                )}
                {(user?.role === 'CAMPUS_HERO' || user?.role === 'ADMIN') && (
                  <Link to="/hero-dashboard" className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 hover:text-[#C6DE41]" title="Campus Hero Delivery Operations">
                    Hero Ops
                  </Link>
                )}
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 hover:text-[#C6DE41]">Admin</Link>
                )}
              </>
            ) : (
              /* Buyer Mode Desktop Navigation: Primary focus BUY, "Sell Gear" LAST among marketplace actions */
              <>
                <MenuItem label="Explore" to="/buy" active={activeMenu} setActive={setActiveMenu} current={isActive('/buy')}>
                  <HoveredLink to="/buy">Browse Campus Catalog</HoveredLink>
                  <HoveredLink to="/sell">Sell Your Gear</HoveredLink>
                </MenuItem>
                <MenuItem label="Teammates" to="/find-teammates" active={activeMenu} setActive={setActiveMenu} current={isActive('/find-teammates') || isActive('/teams')}>
                  <HoveredLink to="/find-teammates">Browse Team Openings</HoveredLink>
                  <HoveredLink to="/teams/create">Create Team Post</HoveredLink>
                  {user && <HoveredLink to="/my-teams">My Teams</HoveredLink>}
                </MenuItem>
                <MenuItem label="Heroes" to="/campus-heroes" active={activeMenu} setActive={setActiveMenu} current={isActive('/campus-heroes')}>
                  <HoveredLink to="/campus-heroes">Campus Hero Program</HoveredLink>
                  {(user?.role === 'CAMPUS_HERO' || user?.role === 'ADMIN') && (
                    <HoveredLink to="/hero-dashboard">Hero Operations</HoveredLink>
                  )}
                </MenuItem>
                {user && (
                  <MenuItem label="My Teams" to="/my-teams" active={activeMenu} setActive={setActiveMenu} current={isActive('/my-teams')}>
                    <HoveredLink to="/my-teams">My Team Applications</HoveredLink>
                    <HoveredLink to="/find-teammates">Find Teammates</HoveredLink>
                  </MenuItem>
                )}
                {(user?.role === 'CAMPUS_HERO' || user?.role === 'ADMIN') && (
                  <Link to="/hero-dashboard" className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 hover:text-[#C6DE41]" title="Campus Hero Delivery Operations">
                    Hero Ops
                  </Link>
                )}
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 hover:text-[#C6DE41]">Admin</Link>
                )}
                <MenuItem label="Sell Gear" to="/sell" active={activeMenu} setActive={setActiveMenu} current={isActive('/sell')}>
                  <HoveredLink to="/sell">Sell Campus Essentials</HoveredLink>
                </MenuItem>
              </>
            )}
          </nav>

          {/* Right: Auth Profile / Login Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Mode Switcher Pill */}
                <button
                  onClick={() => setMarketplaceMode(marketplaceMode === 'BUYER' ? 'SELLER' : 'BUYER')}
                  title={`Switch to ${marketplaceMode === 'BUYER' ? 'Seller' : 'Buyer'} Mode`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C6DE41]/40 bg-[#12160F] hover:bg-[#C6DE41]/10 text-white text-[11px] font-bold transition-all shadow-shop-pill group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6DE41] shadow-[0_0_5px_#C6DE41]" />
                  <span className="text-zinc-400 font-normal">Mode:</span>
                  <span className="text-[#C6DE41] group-hover:underline">
                    {marketplaceMode === 'SELLER' ? 'Seller' : 'Buyer'}
                  </span>
                </button>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C6DE41]/30 bg-[#12160F] hover:border-[#C6DE41]/60 transition-all text-[12px] font-medium text-white shadow-shop-pill"
                >
                  <div className="w-6 h-6 rounded-full bg-[#C6DE41]/20 text-[#C6DE41] border border-[#C6DE41]/30 flex items-center justify-center font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-semibold">{user.name.split(' ')[0]}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#C6DE41]/15 text-[10px] text-[#C6DE41] font-semibold">
                    {user.college.code}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-zinc-400 hover:text-[#C6DE41] hover:bg-[#C6DE41]/10 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-[13px] font-medium text-white hover:text-[#C6DE41] rounded-full transition-colors"
                >
                  <TextRoll text="Log in" />
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-[13px] font-bold text-[#090B09] bg-[#C6DE41] hover:bg-[#D7EF59] rounded-full transition-all shadow-shop-pill shadow-[0_0_12px_rgba(198,222,65,0.3)] hover:scale-105 active:scale-95"
                >
                  <TextRoll text="Sign up" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Shop Pill Rail) */}
      <div className="lg:hidden fixed bottom-3 left-4 right-4 z-50 bg-[#090B09]/95 backdrop-blur-md border border-[#C6DE41]/30 rounded-full px-4 py-2 flex items-center justify-around shadow-shop-float">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
            }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>

        {marketplaceMode === 'SELLER' ? (
          /* Seller Mobile Nav: No Buy button */
          <>
            <Link
              to="/sell"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/sell') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
                }`}
            >
              <Tag className="w-4 h-4 mb-0.5" />
              <span><TextRoll text="Sell" /></span>
            </Link>
            <Link
              to="/find-teammates"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/find-teammates') || isActive('/teams') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
                }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>Teams</span>
            </Link>
          </>
        ) : (
          /* Buyer Mobile Nav: Primary focus BUY, "Sell Gear" LAST among marketplace actions */
          <>
            <Link
              to="/buy"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/buy') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
                }`}
            >
              <ShoppingBag className="w-4 h-4 mb-0.5" />
              <span><TextRoll text="Buy" /></span>
            </Link>
            <Link
              to="/find-teammates"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/find-teammates') || isActive('/teams') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
                }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>Teams</span>
            </Link>
            <Link
              to="/sell"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/sell') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
                }`}
            >
              <Tag className="w-4 h-4 mb-0.5" />
              <span><TextRoll text="Sell" /></span>
            </Link>
          </>
        )}

        {user ? (
          <Link
            to="/profile"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/profile') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
              }`}
          >
            <UserIcon className="w-4 h-4 mb-0.5" />
            <span>Profile</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${isActive('/login') ? 'text-[#C6DE41]' : 'text-zinc-400 hover:text-white'
              }`}
          >
            <LogIn className="w-4 h-4 mb-0.5" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </>
  );
};

