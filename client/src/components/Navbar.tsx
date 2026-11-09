
import { TextRoll } from './motion/TextRoll';
import { SmoothInput } from './motion/SmoothInput';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { api, College } from '../services/api';
import { TEAMS_ENABLED } from '../config/features';
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
  RotateCcw,
} from 'lucide-react';

// Original spring animation settings
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
  label,
  to,
  active,
  setActive,
  current,
  children,
}) => {
  // Hide My Teams during the buy/sell-only release
  if (!TEAMS_ENABLED && label === 'My Teams') {
    return null;
  }

  // Show a disabled Teammates label
  
if (!TEAMS_ENABLED && label === 'Teammates') {
  return (
    <div
      aria-label="Teammates — Coming Soon"
      title="Hackathon matching is launching soon"
      className="flex cursor-not-allowed select-none flex-col items-center justify-center gap-0.5 px-2.5 py-1.5"
    >
      <span className="whitespace-nowrap text-[12px] font-medium leading-4 text-zinc-400 light:text-[#62695E] lg:text-[13px]">
        Teammates
      </span>

      <span className="whitespace-nowrap text-[9px] font-medium leading-3 tracking-wide text-[#C6DE41] light:text-[#526800]">
        Coming Soon
      </span>
    </div>
  );
}


  // Original dropdown behavior for other menus
  return (
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
          className={`block whitespace-nowrap rounded-full px-2.5 py-2 text-[12px] font-medium transition-colors lg:text-[13px] ${
            current
              ? 'text-[#C6DE41] font-semibold'
              : 'text-white dark:text-white light:text-[#171B13] hover:text-[#C6DE41] light:hover:text-[#7E9E0A]'
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
            className="overflow-hidden rounded-2xl border border-[#C6DE41]/30 light:border-[#DFE5D5] bg-[#0A0D08]/95 light:bg-[#FFFFFF]/98 shadow-xl backdrop-blur-md"
          >
            <motion.div
              layout
              className="flex w-max min-w-[185px] flex-col gap-1 p-4 text-sm"
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};


const HoveredLink: React.FC<{
  to: string;
  children: React.ReactNode;
}> = ({ to, children }) => (
  <Link
    to={to}
    className="rounded-lg px-3 py-2 text-zinc-300 dark:text-zinc-300 light:text-[#171B13] transition-colors hover:bg-[#C6DE41]/15 hover:text-[#C6DE41] light:hover:bg-[#C6DE41]/20 light:hover:text-[#7E9E0A]"
  >
    {children}
  </Link>
);

export const Navbar: React.FC = () => {
  const {
    user,
    logout,
    selectedCollegeId,
    setSelectedCollegeId,
    resetToHomeCollege,
    isBrowsingOtherCollege,
    marketplaceMode,
  } = useAuth();

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

  // Close campus selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        setShowCollegeModal(false);
      }
    };

    if (showCollegeModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCollegeModal]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }

    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }

    return false;
  };

  // Highlight Teammates for both team and individual posts
  const isTeammatesActive =
    isActive('/find-teammates') ||
    isActive('/teams') ||
    isActive('/find-students') ||
    isActive('/students') ||
    isActive('/my-teams');

  const activeCollege =
    colleges.find((c) => c.id === selectedCollegeId) ||
    (user ? user.college : colleges[0]);

  const filteredColleges = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  // Shared menu content works for Buyer and Seller modes
  const teammatesMenu = (
    <>
      <HoveredLink to="/find-teammates">
        Browse Team Openings
      </HoveredLink>

      <HoveredLink to="/teams/create">
        Create Team Post
      </HoveredLink>

      <div className="my-1 border-t border-white/10 light:border-[#DFE5D5]" />

      <HoveredLink to="/find-students">
        Browse Available Students
      </HoveredLink>

      <HoveredLink to="/students/create">
        Post Looking for Team
      </HoveredLink>

      {user && (
        <>
          <div className="my-1 border-t border-white/10 light:border-[#DFE5D5]" />

          <HoveredLink to="/my-teams">
            My Teams
          </HoveredLink>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Top Banner */}
      <div className="bg-[#090B09] dark:bg-[#090B09] light:bg-[#EEF2E6] text-white dark:text-white light:text-[#171B13] py-2 px-4 text-center text-xs font-medium tracking-tight border-b border-[#C6DE41]/20 dark:border-[#C6DE41]/20 light:border-[#DFE5D5] shadow-sm transition-colors duration-200">
        <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C6DE41] shadow-[0_0_8px_#C6DE41] shrink-0" />

          <span className="font-semibold text-white dark:text-white light:text-[#171B13]">
            CampusMart Recommerce:
          </span>

          <span className="text-white/90 dark:text-white/90 light:text-[#57614E]">
            Verified student-to-student handover with zero shipping fee
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b border-[#C6DE41]/20 dark:border-[#C6DE41]/20 light:border-[#DFE5D5] bg-[#090B09]/90 dark:bg-[#090B09]/90 light:bg-[#F7F8F2]/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Brand and Campus Selector */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 group shrink-0"
            >
              <span className="font-bold text-[20px] tracking-tightest text-white dark:text-white light:text-[#171B13]">
                CampusMart
              </span>

              <span className="w-2 h-2 rounded-full bg-[#C6DE41] mb-1 shadow-[0_0_8px_rgba(198,222,65,0.6)]" />
            </Link>

            {/* Campus Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCollegeModal(!showCollegeModal)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shadow-shop-pill ${
                  isBrowsingOtherCollege
                    ? 'bg-amber-900/30 border border-amber-500/40 text-white dark:text-white light:text-[#171B13]'
                    : 'bg-[#12160F] dark:bg-[#12160F] light:bg-[#FFFFFF] border border-[#C6DE41]/30 dark:border-[#C6DE41]/30 light:border-[#DFE5D5] text-white dark:text-white light:text-[#171B13] hover:border-[#C6DE41]/70'
                }`}
                title="Click to switch active campus"
              >
                <MapPin
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isBrowsingOtherCollege
                      ? 'text-amber-500'
                      : 'text-[#C6DE41]'
                  }`}
                />

                <span className="font-semibold text-white dark:text-white light:text-[#171B13]">
                  {activeCollege ? activeCollege.code : 'All Campuses'}
                </span>

                <span className="hidden xl:inline text-zinc-400 dark:text-zinc-400 light:text-[#78826F] text-[11px] max-w-[110px] truncate">
                  (
                  {activeCollege
                    ? activeCollege.name.split('-')[0].trim()
                    : 'Select'}
                  )
                </span>

                <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-zinc-400 light:text-[#78826F] shrink-0 ml-0.5" />
              </button>

              {/* Campus Selector Popover */}
              {showCollegeModal && (
                <div
                  ref={modalRef}
                  className="absolute left-0 mt-2 w-80 sm:w-96 bg-[#0E120A]/95 dark:bg-[#0E120A]/95 light:bg-[#FFFFFF]/98 rounded-[28px] shadow-2xl border border-[#C6DE41]/30 dark:border-[#C6DE41]/30 light:border-[#DFE5D5] p-5 z-50 text-white dark:text-white light:text-[#171B13] animate-fade-in backdrop-blur-md"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#C6DE41]/20 dark:border-[#C6DE41]/20 light:border-[#DFE5D5]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#C6DE41]/15 flex items-center justify-center text-[#C6DE41]">
                        <Building2 className="w-4 h-4" />
                      </div>

                      <div>
                        <h4 className="text-[13px] font-semibold text-white dark:text-white light:text-[#171B13]">
                          Select Campus
                        </h4>

                        <p className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-[#57614E]">
                          Browse listings specific to your college
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCollegeModal(false)}
                      className="p-1 rounded-full text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-[#171B13] hover:bg-white/10 light:hover:bg-black/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Campus Search */}
                  <div className="relative my-3">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <SmoothInput
                      type="text"
                      placeholder="Search college code or name..."
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[12px] rounded-full border border-[#C6DE41]/30 dark:border-[#C6DE41]/30 light:border-[#DFE5D5] bg-white/5 dark:bg-white/5 light:bg-[#F3F5EC] text-white dark:text-white light:text-[#171B13] placeholder:text-zinc-500 focus:outline-none focus:border-[#C6DE41]"
                    />
                  </div>

                  {/* Campus Options */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {filteredColleges.map((col) => {
                      const isSelected = activeCollege?.id === col.id;

                      const isUserHome =
                        user && user.college.id === col.id;

                      return (
                        <button
                          type="button"
                          key={col.id}
                          onClick={() => {
                            setSelectedCollegeId(col.id);
                            setShowCollegeModal(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-[16px] text-left text-[12px] transition-all ${
                            isSelected
                              ? 'bg-[#C6DE41]/20 text-[#C6DE41] font-semibold border border-[#C6DE41]/30'
                              : 'hover:bg-[#C6DE41]/10 text-zinc-300 dark:text-zinc-300 light:text-[#171B13] hover:text-white light:hover:text-[#7E9E0A]'
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white dark:text-white light:text-[#171B13]">
                                {col.code}
                              </span>

                              {isUserHome && (
                                <span className="px-1.5 py-0.2 text-[9px] font-medium rounded-full bg-[#C6DE41]/20 text-[#C6DE41] border border-[#C6DE41]/30">
                                  Home
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-[#57614E] line-clamp-1">
                              {col.name}
                            </span>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-[#C6DE41] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}

                    {filteredColleges.length === 0 && (
                      <p className="text-center text-[12px] text-zinc-400 dark:text-zinc-400 light:text-[#57614E] py-4">
                        No colleges match your query.
                      </p>
                    )}
                  </div>

                  {/* Reset Home Campus */}
                  {user && isBrowsingOtherCollege && (
                    <div className="pt-3 mt-2 border-t border-[#C6DE41]/20 dark:border-[#C6DE41]/20 light:border-[#DFE5D5] flex items-center justify-between">
                      <span className="text-[11px] text-amber-400 font-medium">
                        Browsing alternate campus
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          resetToHomeCollege();
                          setShowCollegeModal(false);
                        }}
                        className="text-[12px] font-medium text-[#C6DE41] hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />

                        <span>
                          Reset to {user.college.code}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav
            className="relative hidden items-center justify-center gap-0.5 rounded-full border border-[#C6DE41]/30 dark:border-[#C6DE41]/30 light:border-[#DFE5D5] bg-[#090B09] dark:bg-[#090B09] light:bg-[#FFFFFF] px-3 py-1.5 shadow-lg lg:flex transition-colors duration-200"
            onMouseLeave={() => setActiveMenu(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setActiveMenu(null);
              }
            }}
          >
            {marketplaceMode === 'SELLER' ? (
              /* Seller Mode Navigation */
              <>
                <MenuItem
                  label="Sell Gear"
                  to="/sell"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/sell')}
                >
                  <HoveredLink to="/sell">
                    Submit Item to Sell
                  </HoveredLink>

                  <HoveredLink to="/profile">
                    Track Payouts & Valuation
                  </HoveredLink>
                </MenuItem>

                <MenuItem
                  label="My Submissions"
                  to="/profile"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/profile')}
                >
                  <HoveredLink to="/profile">
                    Submission Review Status
                  </HoveredLink>

                  <HoveredLink to="/profile">
                    Payout Quotes
                  </HoveredLink>
                </MenuItem>

                {/* Seller Teammates Menu */}
                <MenuItem
                  label="Teammates"
                  to="/find-teammates"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isTeammatesActive}
                >
                  {teammatesMenu}
                </MenuItem>

                <MenuItem
                  label="Heroes"
                  to="/campus-heroes"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/campus-heroes')}
                >
                  <HoveredLink to="/campus-heroes">
                    Campus Hero Program
                  </HoveredLink>

                  {(user?.role === 'CAMPUS_HERO' ||
                    user?.role === 'ADMIN') && (
                    <HoveredLink to="/hero-dashboard">
                      Hero Operations
                    </HoveredLink>
                  )}
                </MenuItem>

                {user && (
                  <MenuItem
                    label="My Teams"
                    to="/my-teams"
                    active={activeMenu}
                    setActive={setActiveMenu}
                    current={isActive('/my-teams')}
                  >
                    <HoveredLink to="/my-teams">
                      My Team Applications
                    </HoveredLink>

                    <HoveredLink to="/find-teammates">
                      Find Teammates
                    </HoveredLink>
                  </MenuItem>
                )}

                {(user?.role === 'CAMPUS_HERO' ||
                  user?.role === 'ADMIN') && (
                  <Link
                    to="/hero-dashboard"
                    className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 dark:text-zinc-300 light:text-[#171B13] hover:text-[#C6DE41]"
                    title="Campus Hero Delivery Operations"
                  >
                    Hero Ops
                  </Link>
                )}

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 dark:text-zinc-300 light:text-[#171B13] hover:text-[#C6DE41]"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              /* Buyer Mode Navigation */
              <>
                <MenuItem
                  label="Explore"
                  to="/buy"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/buy')}
                >
                  <HoveredLink to="/buy">
                    Browse Campus Catalog
                  </HoveredLink>

                  <HoveredLink to="/sell">
                    Sell Your Gear
                  </HoveredLink>
                </MenuItem>

                {/* Buyer Teammates Menu */}
                <MenuItem
                  label="Teammates"
                  to="/find-teammates"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isTeammatesActive}
                >
                  {teammatesMenu}
                </MenuItem>

                <MenuItem
                  label="Heroes"
                  to="/campus-heroes"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/campus-heroes')}
                >
                  <HoveredLink to="/campus-heroes">
                    Campus Hero Program
                  </HoveredLink>

                  {(user?.role === 'CAMPUS_HERO' ||
                    user?.role === 'ADMIN') && (
                    <HoveredLink to="/hero-dashboard">
                      Hero Operations
                    </HoveredLink>
                  )}
                </MenuItem>

                {user && (
                  <MenuItem
                    label="My Teams"
                    to="/my-teams"
                    active={activeMenu}
                    setActive={setActiveMenu}
                    current={isActive('/my-teams')}
                  >
                    <HoveredLink to="/my-teams">
                      My Team Applications
                    </HoveredLink>

                    <HoveredLink to="/find-teammates">
                      Find Teammates
                    </HoveredLink>
                  </MenuItem>
                )}

                {(user?.role === 'CAMPUS_HERO' ||
                  user?.role === 'ADMIN') && (
                  <Link
                    to="/hero-dashboard"
                    className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 dark:text-zinc-300 light:text-[#171B13] hover:text-[#C6DE41]"
                    title="Campus Hero Delivery Operations"
                  >
                    Hero Ops
                  </Link>
                )}

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-zinc-300 dark:text-zinc-300 light:text-[#171B13] hover:text-[#C6DE41]"
                  >
                    Admin
                  </Link>
                )}

                <MenuItem
                  label="Sell Gear"
                  to="/sell"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/sell')}
                >
                  <HoveredLink to="/sell">
                    Sell Campus Essentials
                  </HoveredLink>
                </MenuItem>
              </>
            )}
          </nav>

          {/* Theme, Account and Login Controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                {/* User Profile */}
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C6DE41]/30 dark:border-[#C6DE41]/30 light:border-[#DFE5D5] bg-[#12160F] dark:bg-[#12160F] light:bg-[#FFFFFF] hover:border-[#C6DE41]/60 transition-all text-[12px] font-medium text-white dark:text-white light:text-[#171B13] shadow-shop-pill"
                >
                  <div className="w-6 h-6 rounded-full bg-[#C6DE41]/20 text-[#C6DE41] border border-[#C6DE41]/30 flex items-center justify-center font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <span className="hidden sm:inline font-semibold">
                    {user.name.split(' ')[0]}
                  </span>

                  <span className="px-1.5 py-0.2 rounded-full bg-[#C6DE41]/15 text-[10px] text-[#C6DE41] font-semibold">
                    {user.college.code}
                  </span>
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-[#C6DE41] hover:bg-[#C6DE41]/10 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-[13px] font-medium text-white dark:text-white light:text-[#171B13] hover:text-[#C6DE41] rounded-full transition-colors"
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

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-3 left-4 right-4 z-50 bg-[#090B09]/95 dark:bg-[#090B09]/95 light:bg-[#FFFFFF]/95 backdrop-blur-md border border-[#C6DE41]/30 dark:border-[#C6DE41]/30 light:border-[#DFE5D5] rounded-full px-4 py-2 flex items-center justify-around shadow-shop-float transition-colors duration-200">

        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            isActive('/')
              ? 'text-[#C6DE41] font-semibold'
              : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>

        {marketplaceMode === 'SELLER' ? (
          <>
            <Link
              to="/sell"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                isActive('/sell')
                  ? 'text-[#C6DE41] font-semibold'
                  : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
              }`}
            >
              <Tag className="w-4 h-4 mb-0.5" />
              <span>
                <TextRoll text="Sell" />
              </span>
            </Link>

            {TEAMS_ENABLED ? (
              <Link
                to="/find-teammates"
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  isTeammatesActive
                    ? 'text-[#C6DE41] font-semibold'
                    : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span>Teams</span>
              </Link>
            ) : (
              <div
                aria-label="Teams launching soon"
                title="Hackathon team matching is launching soon"
                className="flex cursor-not-allowed select-none flex-col items-center px-2 py-1 text-[10px] font-medium text-zinc-500 light:text-[#62695E]"
              >
                <Users className="mb-0.5 h-4 w-4" />
                <span>Teams</span>
                <span className="text-[9px] text-[#C6DE41] light:text-[#526800]">Soon</span>
              </div>
            )}
          </>
        ) : (
          <>
            <Link
              to="/buy"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                isActive('/buy')
                  ? 'text-[#C6DE41] font-semibold'
                  : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mb-0.5" />
              <span>
                <TextRoll text="Buy" />
              </span>
            </Link>

            {TEAMS_ENABLED ? (
              <Link
                to="/find-teammates"
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  isTeammatesActive
                    ? 'text-[#C6DE41] font-semibold'
                    : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span>Teams</span>
              </Link>
            ) : (
              <div
                aria-label="Teams launching soon"
                title="Hackathon team matching is launching soon"
                className="flex cursor-not-allowed select-none flex-col items-center px-2 py-1 text-[10px] font-medium text-zinc-500 light:text-[#62695E]"
              >
                <Users className="mb-0.5 h-4 w-4" />
                <span>Teams</span>
                <span className="text-[9px] text-[#C6DE41] light:text-[#526800]">Soon</span>
              </div>
            )}

            <Link
              to="/sell"
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                isActive('/sell')
                  ? 'text-[#C6DE41] font-semibold'
                  : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
              }`}
            >
              <Tag className="w-4 h-4 mb-0.5" />
              <span>
                <TextRoll text="Sell" />
              </span>
            </Link>
          </>
        )}

        {user ? (
          <Link
            to="/settings"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive('/settings')
                ? 'text-[#C6DE41] font-semibold'
                : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
            }`}
          >
            <UserIcon className="w-4 h-4 mb-0.5" />
            <span>Settings</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive('/login')
                ? 'text-[#C6DE41] font-semibold'
                : 'text-zinc-400 dark:text-zinc-400 light:text-[#57614E] hover:text-white light:hover:text-[#171B13]'
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
