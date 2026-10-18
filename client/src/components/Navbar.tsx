import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, College } from '../services/api';
import { 
  ShoppingBag, 
  Tag, 
  ShieldCheck, 
  User as UserIcon, 
  MapPin, 
  LogOut, 
  LogIn, 
  ShieldAlert,
  Home,
  Truck,
  Users,
  Sparkles,
  ChevronDown,
  Search,
  X,
  Check,
  Building2,
  RotateCcw
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, selectedCollegeId, setSelectedCollegeId, resetToHomeCollege, isBrowsingOtherCollege } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState<College[]>([]);
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
      {/* Desktop & Tablet Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Interactive Campus Selector */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-campus-primary to-campus-dark flex items-center justify-center text-white shadow-md shadow-campus-primary/25 group-hover:scale-105 transition-transform duration-200">
                <span className="font-extrabold text-lg tracking-tight">C</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-campus-dark tracking-tight leading-tight group-hover:text-campus-primary transition-colors">
                  Campus<span className="text-campus-primary">Mart</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Verified Recommerce</span>
              </div>
            </Link>

            {/* Interactive Campus Selector Button */}
            <div className="relative">
              <button
                onClick={() => setShowCollegeModal(!showCollegeModal)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-sm ${
                  isBrowsingOtherCollege
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-campus-soft/80 border-campus-primary/30 text-campus-dark hover:bg-campus-light/60 hover:border-campus-primary'
                }`}
                title="Click to switch active campus"
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${isBrowsingOtherCollege ? 'text-amber-600' : 'text-campus-primary'}`} />
                <span className="font-bold text-campus-dark">
                  {activeCollege ? activeCollege.code : 'Select Campus'}
                </span>
                <span className="hidden lg:inline text-slate-500 font-normal text-[11px] max-w-[130px] truncate">
                  ({activeCollege ? activeCollege.name.split('-')[0].trim() : 'All'})
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
              </button>

              {/* Campus Selector Popover */}
              {showCollegeModal && (
                <div
                  ref={modalRef}
                  className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-card-hover border border-slate-200/90 p-4 z-50 animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-campus-soft flex items-center justify-center text-campus-primary">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Select Your College Campus</h4>
                        <p className="text-[11px] text-slate-400">Browse verified listings exclusive to your campus</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCollegeModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Campus Input */}
                  <div className="relative my-3">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search college name or code..."
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
                    />
                  </div>

                  {/* College Options List */}
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
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
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-campus-soft text-campus-primary font-bold border border-campus-primary/30'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{col.code}</span>
                              {isUserHome && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                                  Home Campus
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 line-clamp-1">{col.name}</span>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-campus-primary shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}

                    {filteredColleges.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4">No colleges match your query.</p>
                    )}
                  </div>

                  {/* Reset to Home Campus Action */}
                  {user && isBrowsingOtherCollege && (
                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-amber-800 font-medium">Browsing another campus</span>
                      <button
                        onClick={() => {
                          resetToHomeCollege();
                          setShowCollegeModal(false);
                        }}
                        className="text-xs font-bold text-campus-primary hover:underline flex items-center gap-1"
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

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <Link
              to="/buy"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/buy')
                  ? 'bg-campus-soft text-campus-primary'
                  : 'text-slate-600 hover:text-campus-dark hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-campus-primary" />
              <span>Buy Gear</span>
            </Link>

            <Link
              to="/sell"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/sell')
                  ? 'bg-campus-soft text-campus-primary'
                  : 'text-slate-600 hover:text-campus-dark hover:bg-slate-50'
              }`}
            >
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Sell & Cash Out</span>
            </Link>

            <Link
              to="/find-teammates"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/find-teammates') || isActive('/teams')
                  ? 'bg-campus-soft text-campus-primary'
                  : 'text-slate-600 hover:text-campus-dark hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>Teammates</span>
            </Link>

            <Link
              to="/campus-heroes"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/campus-heroes')
                  ? 'bg-campus-soft text-campus-primary'
                  : 'text-slate-600 hover:text-campus-dark hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Campus Heroes</span>
            </Link>

            {user && (
              <Link
                to="/my-teams"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive('/my-teams')
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                My Teams
              </Link>
            )}

            {(user?.role === 'CAMPUS_HERO' || user?.role === 'ADMIN') && (
              <Link
                to="/hero-dashboard"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isActive('/hero-dashboard')
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Campus Hero Delivery Operations"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Hero Ops</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isActive('/admin')
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right: Auth Profile / Login Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-campus-primary/50 bg-white hover:bg-campus-soft/50 transition-all text-xs font-bold text-slate-800 shadow-subtle"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-campus-primary to-campus-dark text-white flex items-center justify-center font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-bold">{user.name.split(' ')[0]}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-bold">
                    {user.college.code}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-campus-dark hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-xs font-bold text-white bg-campus-primary hover:bg-campus-primary-hover shadow-sm hover:shadow-md shadow-campus-primary/25 rounded-xl transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Clean Safe Fixed Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold rounded-xl transition-colors ${
            isActive('/') ? 'text-campus-primary' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/buy"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold rounded-xl transition-colors ${
            isActive('/buy') ? 'text-campus-primary' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Buy</span>
        </Link>
        <Link
          to="/sell"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold rounded-xl transition-colors ${
            isActive('/sell') ? 'text-campus-primary' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-5 h-5 mb-0.5" />
          <span>Sell</span>
        </Link>
        <Link
          to="/find-teammates"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold rounded-xl transition-colors ${
            isActive('/find-teammates') || isActive('/teams') ? 'text-campus-primary' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Teams</span>
        </Link>
        <Link
          to="/campus-heroes"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold rounded-xl transition-colors ${
            isActive('/campus-heroes') ? 'text-campus-primary' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Heroes</span>
        </Link>
        {user ? (
          <Link
            to="/profile"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold rounded-xl transition-colors ${
              isActive('/profile') ? 'text-campus-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold rounded-xl transition-colors ${
              isActive('/login') ? 'text-campus-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-5 h-5 mb-0.5" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </>
  );
};
