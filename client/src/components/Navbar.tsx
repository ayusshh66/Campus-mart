
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../services/api';
import type { College } from '../services/api';
import { TEAMS_ENABLED } from '../config/features';

// Original CampusMart spring dropdown animation
const menuTransition = {
  type: 'spring' as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

type DesktopMenuProps = {
  label: string;
  to: string;
  active: string | null;
  setActive: (item: string | null) => void;
  current: boolean;
  children: React.ReactNode;
};

// ============================================
// DESKTOP ANIMATED MENU
// ============================================

const DesktopMenu: React.FC<DesktopMenuProps> = ({
  label,
  to,
  active,
  setActive,
  current,
  children,
}) => (
  <div
    className="relative"
    onMouseEnter={() => setActive(label)}
    onFocus={() => setActive(label)}
  >
    <Link
      to={to}
      aria-current={current ? 'page' : undefined}
      aria-expanded={active === label}
      className={`block whitespace-nowrap rounded-full px-2.5 py-2 text-[12px] font-medium transition-colors xl:text-[13px] ${
        current
          ? 'font-semibold text-[#C6DE41]'
          : 'text-white hover:text-[#C6DE41] light:text-[#171B13] light:hover:text-[#7E9E0A]'
      }`}
    >
      {label}
    </Link>

    {active === label && (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={menuTransition}
        className="absolute left-1/2 top-full z-[80] -translate-x-1/2 pt-4"
      >
        <motion.div
          layoutId="campusmart-navbar-active"
          transition={menuTransition}
          className="overflow-hidden rounded-2xl border border-[#C6DE41]/30 bg-[#0A0D08]/95 shadow-xl backdrop-blur-md light:border-[#DFE5D5] light:bg-white/95"
        >
          <div className="flex w-max min-w-[190px] flex-col gap-1 p-3 text-[12px]">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </div>
);

const DropdownLink: React.FC<{
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="rounded-lg px-3 py-2.5 text-zinc-300 transition-colors hover:bg-[#C6DE41]/15 hover:text-[#C6DE41] light:text-[#171B13] light:hover:bg-[#C6DE41]/20 light:hover:text-[#7E9E0A]"
  >
    {children}
  </Link>
);

// ============================================
// MAIN NAVBAR
// ============================================

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

  const navigate = useNavigate();
  const location = useLocation();

  const [colleges, setColleges] = useState<College[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [collegeOpen, setCollegeOpen] = useState<
    'mobile' | 'desktop' | null
  >(null);

  const [collegeSearch, setCollegeSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const desktopCollegeRef = useRef<HTMLDivElement>(null);
  const mobileCollegeRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // ============================================
  // LOAD CAMPUSES
  // ============================================

  useEffect(() => {
    let mounted = true;

    api.getColleges()
      .then((items) => {
        if (mounted) setColleges(items);
      })
      .catch((error) =>
        console.error('Could not load colleges:', error)
      );

    return () => {
      mounted = false;
    };
  }, []);

  // Close menus after route changes
  useEffect(() => {
    setActiveMenu(null);
    setCollegeOpen(null);
    setMobileMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        collegeOpen === 'desktop' &&
        !desktopCollegeRef.current?.contains(target)
      ) {
        setCollegeOpen(null);
      }

      if (
        collegeOpen === 'mobile' &&
        !mobileCollegeRef.current?.contains(target)
      ) {
        setCollegeOpen(null);
      }

      if (!accountRef.current?.contains(target)) {
        setAccountOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCollegeOpen(null);
        setMobileMenuOpen(false);
        setAccountOpen(false);
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [collegeOpen]);

  // Close mobile overlay when changing to desktop
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)');

    const onResize = () => {
      if (media.matches) {
        setMobileMenuOpen(false);

        if (collegeOpen === 'mobile') {
          setCollegeOpen(null);
        }
      }
    };

    media.addEventListener('change', onResize);

    return () =>
      media.removeEventListener('change', onResize);
  }, [collegeOpen]);

  // ============================================
  // SHARED VALUES
  // ============================================

  const activeCollege =
    colleges.find(
      (college) => college.id === selectedCollegeId
    ) ||
    user?.college ||
    colleges[0];

  const matchingColleges = colleges.filter((college) =>
    `${college.code} ${college.name}`
      .toLowerCase()
      .includes(collegeSearch.trim().toLowerCase())
  );

  const isActive = (to: string) =>
    to === '/'
      ? location.pathname === '/'
      : location.pathname === to ||
        location.pathname.startsWith(`${to}/`);

  const isAdmin = user?.role === 'ADMIN';

  const isHero =
    user?.role === 'CAMPUS_HERO' || isAdmin;

  const isManager =
    String(user?.role) === 'HERO_MANAGER';

  const doLogout = () => {
    setMobileMenuOpen(false);
    setAccountOpen(false);
    logout();
    navigate('/login');
  };

  const chooseCollege = (id: string) => {
    setSelectedCollegeId(id);
    setCollegeOpen(null);
    setCollegeSearch('');
  };

  // ============================================
  // SHARED CAMPUS PICKER
  // ============================================

  const collegePicker = () => (
    <div className="absolute left-0 top-full z-[120] mt-2 w-[min(90vw,350px)] rounded-[22px] border border-[#C6DE41]/30 bg-[#0E120A]/95 p-4 text-white shadow-2xl backdrop-blur-lg light:border-[#DFE5D5] light:bg-white light:text-[#171B13]">

      <div className="mb-3 flex items-center gap-2">
        <Building2
          size={18}
          className="text-[#C6DE41]"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Select Campus
          </p>

          <p className="text-[11px] text-zinc-400 light:text-[#57614E]">
            Browse college-specific listings
          </p>
        </div>

        <button
          type="button"
          aria-label="Close campus selector"
          onClick={() => setCollegeOpen(null)}
        >
          <X size={17} />
        </button>
      </div>

      <label className="relative mb-3 block">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />

        <input
          value={collegeSearch}
          onChange={(event) =>
            setCollegeSearch(event.target.value)
          }
          placeholder="Search college..."
          className="w-full rounded-full border border-[#C6DE41]/25 bg-[#090B09] py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-[#C6DE41] light:bg-[#F3F5EC] light:text-[#171B13]"
        />
      </label>

      <div className="max-h-60 space-y-1 overflow-y-auto">
        {matchingColleges.map((college) => (
          <button
            key={college.id}
            type="button"
            onClick={() => chooseCollege(college.id)}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
              activeCollege?.id === college.id
                ? 'bg-[#C6DE41]/15 text-[#C6DE41]'
                : 'text-zinc-300 hover:bg-[#C6DE41]/10 light:text-[#171B13]'
            }`}
          >
            <span className="min-w-0">
              <span className="block font-bold">
                {college.code}
                {user?.college.id === college.id
                  ? ' · Home'
                  : ''}
              </span>

              <span className="block truncate text-[11px] text-zinc-400 light:text-[#57614E]">
                {college.name}
              </span>
            </span>

            {activeCollege?.id === college.id && (
              <Check
                size={16}
                className="shrink-0"
              />
            )}
          </button>
        ))}

        {matchingColleges.length === 0 && (
          <p className="py-4 text-center text-xs text-zinc-400">
            No matching colleges
          </p>
        )}
      </div>

      {user && isBrowsingOtherCollege && (
        <button
          type="button"
          onClick={() => {
            resetToHomeCollege();
            setCollegeOpen(null);
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 border-t border-white/10 pt-3 text-xs font-semibold text-[#C6DE41] light:border-[#DFE5D5]"
        >
          <RotateCcw size={13} />
          Reset to {user.college.code}
        </button>
      )}
    </div>
  );

  // ============================================
  // MOBILE HAMBURGER MENU ITEMS
  // No Teammates here
  // ============================================

  const mobileLinks = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
    },
    {
      to: '/buy',
      label: 'Explore Campus Catalog',
      icon: ShoppingBag,
    },
    {
      to: '/sell',
      label: 'Sell Gear',
      icon: Tag,
    },
    {
      to: '/campus-heroes',
      label: 'Campus Heroes',
      icon: ShieldCheck,
    },

    ...(isHero
      ? [
          {
            to: '/hero-dashboard',
            label: 'Hero Operations',
            icon: ShieldCheck,
          },
        ]
      : []),

    ...(isAdmin
      ? [
          {
            to: '/hero-manager',
            label: 'Hero Manager',
            icon: Users,
          },
          {
            to: '/admin',
            label: 'Admin Dashboard',
            icon: LayoutDashboard,
          },
        ]
      : []),

    ...(isManager
      ? [
          {
            to: '/hero-manager',
            label: 'Manager Dashboard',
            icon: LayoutDashboard,
          },
        ]
      : []),

    ...(user
      ? [
          {
            to: '/profile',
            label: 'View Profile',
            icon: UserRound,
          },
          {
            to: '/settings',
            label: 'Account Settings',
            icon: Settings,
          },
        ]
      : [
          {
            to: '/login',
            label: 'Log In',
            icon: LogIn,
          },
        ]),
  ];

  // ============================================
  // MOBILE BOTTOM NAVIGATION
  // Home | Buy | Heroes | Sell | Settings
  // ============================================

  const bottomLinks = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
    },
    {
      to: '/buy',
      label: 'Buy',
      icon: ShoppingBag,
    },
    {
      to: '/campus-heroes',
      label: 'Heroes',
      icon: ShieldCheck,
    },
    {
      to: '/sell',
      label: 'Sell',
      icon: Tag,
    },
    user
      ? {
          to: '/settings',
          label: 'Settings',
          icon: Settings,
        }
      : {
          to: '/login',
          label: 'Login',
          icon: LogIn,
        },
  ];

  // ============================================
  // DESKTOP DROPDOWN CONTENT
  // ============================================

  const teammatesLinks = (
    <>
      <DropdownLink to="/find-teammates">
        Browse Team Openings
      </DropdownLink>

      <DropdownLink to="/teams/create">
        Create Team Post
      </DropdownLink>

      <DropdownLink to="/find-students">
        Browse Available Students
      </DropdownLink>

      <DropdownLink to="/students/create">
        Post Looking for Team
      </DropdownLink>

      {user && (
        <DropdownLink to="/my-teams">
          My Teams
        </DropdownLink>
      )}
    </>
  );

  const heroesLinks = (
    <>
      <DropdownLink to="/campus-heroes">
        Campus Hero Program
      </DropdownLink>

      {isHero && (
        <DropdownLink to="/hero-dashboard">
          Hero Operations
        </DropdownLink>
      )}
    </>
  );

  const adminLinks = isAdmin && (
    <>
      <DesktopMenu
        label="Hero Manager"
        to="/hero-manager"
        active={activeMenu}
        setActive={setActiveMenu}
        current={isActive('/hero-manager')}
      >
        <DropdownLink to="/hero-manager">
          Manager Dashboard
        </DropdownLink>

        <DropdownLink to="/hero-manager?tab=heroes">
          Manage Campus Heroes
        </DropdownLink>

        <DropdownLink to="/hero-manager?tab=assignments">
          Task Assignments
        </DropdownLink>

        <DropdownLink to="/hero-manager?tab=access">
          Manage Manager Access
        </DropdownLink>
      </DesktopMenu>

      <Link
        to="/admin"
        className={`whitespace-nowrap rounded-full px-2.5 py-2 text-xs hover:text-[#C6DE41] light:text-[#171B13] ${
          isActive('/admin')
            ? 'text-[#C6DE41]'
            : 'text-zinc-300'
        }`}
      >
        Admin
      </Link>
    </>
  );

  return (
    <>
      {/* =====================================
          TOP ANNOUNCEMENT
          Desktop only
      ===================================== */}

      <div className="hidden border-b border-[#C6DE41]/20 bg-[#090B09] px-4 py-2 text-center text-xs text-white light:border-[#DFE5D5] light:bg-[#EEF2E6] light:text-[#171B13] xl:block">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#C6DE41] shadow-[0_0_8px_#C6DE41]" />

        <strong>CampusMart Recommerce:</strong>{' '}
        Verified student-to-student handover with zero shipping fee
      </div>

      {/* =====================================
          MOBILE TOP HEADER
          Single header — no duplicate
      ===================================== */}

      <header className="sticky top-0 z-[90] w-full min-w-0 border-b border-[#C6DE41]/20 bg-[#090B09]/95 text-white backdrop-blur-md light:border-[#DFE5D5] light:bg-[#F7F8F2]/95 light:text-[#171B13] xl:hidden">

        <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between gap-2 px-3 sm:px-5">

          <div className="flex min-w-0 items-center gap-2">

            {/* Logo */}

            <Link
              to="/"
              className="flex shrink-0 items-center gap-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-[16px] font-extrabold tracking-tight min-[390px]:text-[18px]">
                CampusMart
              </span>

              <span className="h-2 w-2 rounded-full bg-[#C6DE41] shadow-[0_0_8px_#C6DE41]" />
            </Link>

            {/* Mobile campus selector */}

            <div
              className="relative shrink-0"
              ref={mobileCollegeRef}
            >
              <button
                type="button"
                aria-label="Select campus"
                aria-expanded={collegeOpen === 'mobile'}
                onClick={() => {
                  setCollegeOpen(
                    collegeOpen === 'mobile'
                      ? null
                      : 'mobile'
                  );
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 rounded-full border border-[#C6DE41]/30 bg-[#12160F] px-2 py-1.5 text-[10px] light:bg-white"
              >
                <MapPin
                  size={12}
                  className="text-[#C6DE41]"
                />

                <span className="max-w-[40px] truncate font-semibold">
                  {activeCollege?.code || 'Campus'}
                </span>

                <ChevronDown
                  size={11}
                  className="text-zinc-400"
                />
              </button>

              {collegeOpen === 'mobile' &&
                collegePicker()}
            </div>
          </div>

          {/* Theme and menu */}

          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />

            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="campusmart-mobile-menu"
              onClick={() => {
                setMobileMenuOpen((open) => !open);
                setCollegeOpen(null);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C6DE41]/30 bg-[#12160F] text-[#C6DE41] light:bg-white"
            >
              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>
          </div>
        </div>

        {/* =================================
            MOBILE ANIMATED HAMBURGER
        ================================= */}

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="campusmart-mobile-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-x-0 top-[60px] z-[110] h-[calc(100dvh-60px)] bg-black/75"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.nav
                aria-label="Mobile menu"
                initial={{
                  opacity: 0,
                  y: -14,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                  scale: 0.98,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 27,
                }}
                onClick={(event) =>
                  event.stopPropagation()
                }
                className="mx-auto mt-2 max-h-[calc(100dvh-90px)] w-[calc(100%-24px)] max-w-md overflow-y-auto rounded-[24px] border border-[#C6DE41]/25 bg-[#11150F] p-4 shadow-2xl light:border-[#DFE5D5] light:bg-white"
              >

                {/* Logged-in user info */}

                {user && (
                  <div className="mb-3 flex items-center gap-3 border-b border-white/10 pb-4 light:border-[#DFE5D5]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C6DE41] font-bold text-[#090B09]">
                      {user.name.charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {user.name}
                      </p>

                      <p className="truncate text-[11px] text-zinc-400">
                        {user.college.code}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation links */}

                <div className="space-y-1">
                  {mobileLinks.map(
                    ({ to, label, icon: Icon }) => (
                      <Link
                        key={`${to}-${label}`}
                        to={to}
                        onClick={() =>
                          setMobileMenuOpen(false)
                        }
                        aria-current={
                          isActive(to)
                            ? 'page'
                            : undefined
                        }
                        className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors ${
                          isActive(to)
                            ? 'bg-[#C6DE41]/15 font-semibold text-[#C6DE41]'
                            : 'text-zinc-200 hover:bg-white/5 light:text-[#171B13]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={18} />
                          {label}
                        </span>

                        <ArrowRight
                          size={14}
                          className="opacity-40"
                        />
                      </Link>
                    )
                  )}
                </div>

                {/* Logout / Sign up */}

                {user ? (
                  <button
                    type="button"
                    onClick={doLogout}
                    className="mt-4 flex w-full items-center gap-3 border-t border-white/10 px-3 pt-4 text-sm text-rose-300 light:border-[#DFE5D5]"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="mt-4 flex justify-center rounded-xl bg-[#C6DE41] px-4 py-3 text-sm font-bold text-[#090B09]"
                  >
                    Create Account
                  </Link>
                )}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =====================================
          DESKTOP HEADER
          Preserves dropdown animation
      ===================================== */}

      <header className="sticky top-0 z-[70] hidden w-full border-b border-[#C6DE41]/20 bg-[#090B09]/95 text-white backdrop-blur-md light:border-[#DFE5D5] light:bg-[#F7F8F2]/95 light:text-[#171B13] xl:block">

        <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between gap-3 px-4 xl:px-6">

          {/* Brand and campus */}

          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5"
            >
              <span className="text-[19px] font-extrabold tracking-tight">
                CampusMart
              </span>

              <span className="h-2 w-2 rounded-full bg-[#C6DE41] shadow-[0_0_8px_#C6DE41]" />
            </Link>

            <div
              className="relative"
              ref={desktopCollegeRef}
            >
              <button
                type="button"
                onClick={() =>
                  setCollegeOpen(
                    collegeOpen === 'desktop'
                      ? null
                      : 'desktop'
                  )
                }
                aria-expanded={
                  collegeOpen === 'desktop'
                }
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  isBrowsingOtherCollege
                    ? 'border-amber-500/40 bg-amber-900/30'
                    : 'border-[#C6DE41]/30 bg-[#12160F] hover:border-[#C6DE41]/70 light:bg-white'
                }`}
              >
                <MapPin
                  size={14}
                  className="text-[#C6DE41]"
                />

                <span className="font-semibold">
                  {activeCollege?.code || 'Campus'}
                </span>

                <span className="hidden max-w-[110px] truncate text-zinc-400 2xl:inline">
                  {activeCollege?.name}
                </span>

                <ChevronDown
                  size={12}
                  className="text-zinc-400"
                />
              </button>

              {collegeOpen === 'desktop' &&
                collegePicker()}
            </div>
          </div>

          {/* =================================
              DESKTOP MENU
          ================================= */}

          <nav
            aria-label="Desktop navigation"
            className="relative flex shrink-0 items-center justify-center gap-0.5 rounded-full border border-[#C6DE41]/30 bg-[#090B09] px-2 py-1.5 shadow-lg light:border-[#DFE5D5] light:bg-white"
            onMouseLeave={() =>
              setActiveMenu(null)
            }
          >

            {/* Buyer / Seller specific links */}

            {marketplaceMode === 'SELLER' ? (
              <>
                <DesktopMenu
                  label="Sell Gear"
                  to="/sell"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/sell')}
                >
                  <DropdownLink to="/sell">
                    Submit Item to Sell
                  </DropdownLink>

                  <DropdownLink to="/profile">
                    Track Payouts & Valuation
                  </DropdownLink>
                </DesktopMenu>

                <DesktopMenu
                  label="My Submissions"
                  to="/profile"
                  active={activeMenu}
                  setActive={setActiveMenu}
                  current={isActive('/profile')}
                >
                  <DropdownLink to="/profile">
                    Submission Review Status
                  </DropdownLink>

                  <DropdownLink to="/profile">
                    Payout Quotes
                  </DropdownLink>
                </DesktopMenu>
              </>
            ) : (
              <DesktopMenu
                label="Explore"
                to="/buy"
                active={activeMenu}
                setActive={setActiveMenu}
                current={isActive('/buy')}
              >
                <DropdownLink to="/buy">
                  Browse Campus Catalog
                </DropdownLink>

                <DropdownLink to="/sell">
                  Sell Your Gear
                </DropdownLink>
              </DesktopMenu>
            )}

            {/* Teammates remains desktop-only */}

            {TEAMS_ENABLED ? (
              <DesktopMenu
                label="Teammates"
                to="/find-teammates"
                active={activeMenu}
                setActive={setActiveMenu}
                current={isActive('/find-teammates')}
              >
                {teammatesLinks}
              </DesktopMenu>
            ) : (
              <div
                className="flex cursor-not-allowed select-none flex-col items-center justify-center gap-0.5 px-2.5 py-1.5"
                aria-label="Teammates — Coming Soon"
              >
                <span className="whitespace-nowrap text-[12px] text-zinc-400">
                  Teammates
                </span>

                <span className="whitespace-nowrap text-[9px] font-semibold text-[#C6DE41]">
                  Coming Soon
                </span>
              </div>
            )}

            {/* Heroes */}

            <DesktopMenu
              label="Heroes"
              to="/campus-heroes"
              active={activeMenu}
              setActive={setActiveMenu}
              current={isActive('/campus-heroes')}
            >
              {heroesLinks}
            </DesktopMenu>

            {/* Hero Operations */}

            {isHero && (
              <Link
                to="/hero-dashboard"
                className={`rounded-full px-2 py-2 text-xs hover:text-[#C6DE41] ${
                  isActive('/hero-dashboard')
                    ? 'text-[#C6DE41]'
                    : 'text-zinc-300 light:text-[#171B13]'
                }`}
              >
                Hero Ops
              </Link>
            )}

            {/* Admin and Manager */}

            {adminLinks}

            {/* Buyer's Sell Gear link */}

            {marketplaceMode !== 'SELLER' && (
              <DesktopMenu
                label="Sell Gear"
                to="/sell"
                active={activeMenu}
                setActive={setActiveMenu}
                current={isActive('/sell')}
              >
                <DropdownLink to="/sell">
                  Sell Campus Essentials
                </DropdownLink>
              </DesktopMenu>
            )}
          </nav>

          {/* =================================
              ACCOUNT AND THEME
          ================================= */}

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />

            {user ? (
              <>
                <div
                  ref={accountRef}
                  className="relative"
                  onMouseEnter={() => {
                    setAccountOpen(true);
                    setActiveMenu(null);
                  }}
                  onMouseLeave={() =>
                    setAccountOpen(false)
                  }
                >

                  {/* User pill */}

                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    onClick={() => {
                      setAccountOpen(
                        (value) => !value
                      );

                      setActiveMenu(null);
                    }}
                    className="flex items-center gap-2 rounded-full border border-[#C6DE41]/30 bg-[#12160F] px-3 py-1.5 text-xs hover:border-[#C6DE41]/60 light:bg-white"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C6DE41]/30 bg-[#C6DE41]/20 text-[11px] font-bold text-[#C6DE41]">
                      {user.name
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <span className="hidden max-w-[80px] truncate font-semibold xl:inline">
                      {user.name.split(' ')[0]}
                    </span>

                    <span className="rounded-full bg-[#C6DE41]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#C6DE41]">
                      {user.college.code}
                    </span>

                    <ChevronDown
                      size={12}
                      className={`text-zinc-400 transition-transform ${
                        accountOpen
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>

                  {/* Animated account dropdown */}

                  {accountOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.85,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                      }}
                      transition={menuTransition}
                      className="absolute right-0 top-full z-[100] pt-4"
                    >
                      <motion.div
                        layout
                        className="flex w-[215px] flex-col gap-1 rounded-2xl border border-[#C6DE41]/30 bg-[#0A0D08]/95 p-3 shadow-xl backdrop-blur-md light:border-[#DFE5D5] light:bg-white/95"
                      >
                        <DropdownLink
                          to="/profile"
                          onClick={() =>
                            setAccountOpen(false)
                          }
                        >
                          <span className="flex items-center gap-2">
                            <UserRound size={16} />
                            View Profile
                          </span>
                        </DropdownLink>

                        <div className="my-1 border-t border-white/10 light:border-[#DFE5D5]" />

                        <DropdownLink
                          to="/settings"
                          onClick={() =>
                            setAccountOpen(false)
                          }
                        >
                          <span className="flex items-center gap-2">
                            <Settings size={16} />
                            Account Settings
                          </span>
                        </DropdownLink>
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Logout */}

                <button
                  type="button"
                  onClick={doLogout}
                  title="Log out"
                  aria-label="Log out"
                  className="rounded-full p-2 text-zinc-400 hover:bg-[#C6DE41]/10 hover:text-[#C6DE41]"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <Link
                  to="/login"
                  className="px-2 py-2 hover:text-[#C6DE41]"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  className="rounded-full bg-[#C6DE41] px-4 py-2 font-bold text-[#090B09] hover:bg-[#D7EF59]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================
          MOBILE BOTTOM NAVIGATION

          Home | Buy | Heroes | Sell | Settings

          No Teams / Teammates
      ===================================== */}

      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-3 left-1/2 z-[80] flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-[#C6DE41]/30 bg-[#090B09]/95 px-2 py-2.5 text-white shadow-[0_8px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl light:border-[#DFE5D5] light:bg-white/95 xl:hidden"
      >
        {bottomLinks.map(
          ({ to, label, icon: Icon }) => {
            const current = isActive(to);

            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                aria-current={
                  current ? 'page' : undefined
                }
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors ${
                  current
                    ? 'font-semibold text-[#C6DE41]'
                    : 'text-zinc-400 hover:text-[#C6DE41] light:text-[#57614E]'
                }`}
              >
                <Icon size={18} />

                <span className="whitespace-nowrap">
                  {label}
                </span>
              </Link>
            );
          }
        )}
      </nav>
    </>
  );
};

export default Navbar;
