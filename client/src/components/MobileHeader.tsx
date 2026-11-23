
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Home,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Users,
  UserRound,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  MapPin,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../services/api';
import type { College } from '../services/api';
import { TEAMS_ENABLED } from '../config/features';

export const MobileHeader: React.FC = () => {
  const {
    user,
    logout,
    marketplaceMode,
    setMarketplaceMode,
    selectedCollegeId,
    setSelectedCollegeId,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [campusOpen, setCampusOpen] = useState(false);

  useEffect(() => {
    api.getColleges()
      .then(setColleges)
      .catch((error) =>
        console.error('Could not load colleges:', error)
      );
  }, []);

  useEffect(() => {
    setOpen(false);
    setCampusOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open && !campusOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setCampusOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);

    return () =>
      window.removeEventListener('keydown', closeOnEscape);
  }, [open, campusOpen]);

  const activeCollege =
    colleges.find((college) =>
      college.id === selectedCollegeId
    ) || user?.college;

  const isHero =
    user?.role === 'CAMPUS_HERO' ||
    user?.role === 'ADMIN';

  const isAdmin = user?.role === 'ADMIN';

  const isManager =
    String(user?.role) === 'HERO_MANAGER';

  const isCurrent = (to: string) =>
    location.pathname === to ||
    (to !== '/' &&
      location.pathname.startsWith(`${to}/`));

  const logoutNow = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home', to: '/', icon: Home },
    {
      label: 'Explore Campus Catalog',
      to: '/buy',
      icon: ShoppingBag,
    },
    {
      label: 'Sell Your Gear',
      to: '/sell',
      icon: Tag,
    },
    {
      label: 'Campus Heroes',
      to: '/campus-heroes',
      icon: ShieldCheck,
    },
    ...(isHero
      ? [{
          label: 'Hero Operations',
          to: '/hero-dashboard',
          icon: ShieldCheck,
        }]
      : []),
    ...(isAdmin
      ? [{
          label: 'Admin Dashboard',
          to: '/admin',
          icon: LayoutDashboard,
        }]
      : []),
    ...(isAdmin || isManager
      ? [{
          label: 'Campus Hero Manager',
          to: '/hero-manager',
          icon: Users,
        }]
      : []),
    ...(user
      ? [
          {
            label: 'View Profile',
            to: '/profile',
            icon: UserRound,
          },
          {
            label: 'Account Settings',
            to: '/settings',
            icon: Settings,
          },
        ]
      : [
          {
            label: 'Log In',
            to: '/login',
            icon: LogIn,
          },
        ]),
  ];

  return (
    <header className="sticky top-0 z-[100] w-full min-w-0 border-b border-[#C6DE41]/20 bg-[#090B09] text-white light:border-[#DFE5D5] light:bg-[#F7F8F2] light:text-[#171B13] lg:hidden">

      {/* Compact mobile navbar */}
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between gap-2 px-3 sm:px-5">

        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex shrink-0 items-center gap-1"
          >
            <span className="text-[17px] font-extrabold tracking-tight max-[360px]:text-[15px]">
              CampusMart
            </span>
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#C6DE41] shadow-[0_0_8px_#C6DE41]" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setCampusOpen((value) => !value);
              setOpen(false);
            }}
            aria-label="Choose campus"
            aria-expanded={campusOpen}
            className="flex min-w-0 shrink-0 items-center gap-1 rounded-full border border-[#C6DE41]/25 bg-[#12160F] px-2 py-1.5 text-[11px] light:bg-white"
          >
            <MapPin size={13} className="text-[#C6DE41]" />
            <span className="max-w-[45px] truncate font-semibold">
              {activeCollege?.code || 'Campus'}
            </span>
            <ChevronDown size={11} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center">
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen((value) => !value);
              setCampusOpen(false);
            }}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="campusmart-mobile-menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C6DE41]/30 bg-[#12160F] text-[#C6DE41] light:bg-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Campus selector */}
      <AnimatePresence>
        {campusOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute inset-x-3 top-[66px] z-[120] mx-auto max-w-md rounded-2xl border border-[#C6DE41]/25 bg-[#12160F] p-4 shadow-2xl light:bg-white"
          >
            <h3 className="mb-3 text-sm font-bold">
              Select Campus
            </h3>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {colleges.map((college) => (
                <button
                  type="button"
                  key={college.id}
                  onClick={() => {
                    setSelectedCollegeId(college.id);
                    setCampusOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-xs ${
                    activeCollege?.id === college.id
                      ? 'bg-[#C6DE41]/15 text-[#C6DE41]'
                      : 'text-stone-300 hover:bg-white/5 light:text-[#171B13]'
                  }`}
                >
                  <span className="min-w-0">
                    <strong>{college.code}</strong>
                    <span className="ml-2 text-stone-400">
                      {college.name}
                    </span>
                  </span>

                  {activeCollege?.id === college.id && (
                    <span className="shrink-0 text-[#C6DE41]">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="campusmart-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-[60px] z-[110] bg-black/75"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 27,
              }}
              aria-label="Mobile navigation"
              onClick={(event) => event.stopPropagation()}
              className="mx-auto mt-2 max-h-[calc(100dvh-85px)] w-[calc(100%-24px)] max-w-md overflow-y-auto rounded-[24px] border border-[#C6DE41]/25 bg-[#11150F] p-4 shadow-2xl light:border-[#DFE5D5] light:bg-white"
            >

              {user && (
                <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4 light:border-[#DFE5D5]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C6DE41] text-lg font-bold text-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-stone-400">
                      {user.college.code} · {user.role}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {menuItems.map(({ label, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors ${
                      isCurrent(to)
                        ? 'bg-[#C6DE41]/15 font-semibold text-[#C6DE41]'
                        : 'text-stone-200 hover:bg-white/5 light:text-[#171B13]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={18} />
                      {label}
                    </span>
                    <ArrowRight size={14} className="opacity-50" />
                  </Link>
                ))}

                {/* Paused team feature */}
                {!TEAMS_ENABLED && (
                  <div className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-stone-500">
                    <span className="flex items-center gap-3">
                      <Users size={18} />
                      Teammates
                    </span>

                    <span className="text-[10px] font-semibold text-[#C6DE41]">
                      Coming Soon
                    </span>
                  </div>
                )}

                {TEAMS_ENABLED && (
                  <Link
                    to="/find-teammates"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm"
                  >
                    <Users size={18} />
                    Teammates
                  </Link>
                )}
              </div>

              {/* Marketplace mode */}
              {user && (
                <div className="mt-4 border-t border-white/10 pt-4 light:border-[#DFE5D5]">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Marketplace Mode
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {(['BUYER', 'SELLER'] as const).map(
                      (mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={async () => {
                            try {
                              await setMarketplaceMode(mode);
                            } catch (error) {
                              console.error(
                                'Could not change mode:',
                                error
                              );
                            }
                          }}
                          className={`rounded-xl border px-3 py-3 text-xs font-bold ${
                            marketplaceMode === mode
                              ? 'border-[#C6DE41] bg-[#C6DE41] text-[#090B09]'
                              : 'border-white/15 text-stone-300 light:text-[#171B13]'
                          }`}
                        >
                          {mode === 'BUYER'
                            ? 'Buyer Mode'
                            : 'Seller Mode'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {user && (
                <button
                  type="button"
                  onClick={logoutNow}
                  className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-3 text-sm text-rose-300"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              )}

              {!user && (
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
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
  );
};
