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
      {/* Top Banner - Shop App Style Notice */}
      <div className="bg-shop-ink text-white py-2 px-4 text-center text-xs font-medium tracking-tight border-b border-white/10 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-shop-violet shadow-[0_0_8px_#5433EB] shrink-0" />
          <span className="text-white font-semibold">CampusMart Recommerce:</span>
          <span className="text-white/90">Verified student-to-student handover with zero shipping fee</span>
        </div>
      </div>

      {/* Main Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-shop-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Interactive Campus Selector */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-1.5 group shrink-0">
              <span className="font-bold text-[20px] tracking-tightest text-shop-ink">
                CampusMart
              </span>
              <span className="w-2 h-2 rounded-full bg-shop-violet mb-1" />
            </Link>

            {/* Interactive Campus Selector Button */}
            <div className="relative">
              <button
                onClick={() => setShowCollegeModal(!showCollegeModal)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shadow-shop-pill ${
                  isBrowsingOtherCollege
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-white border border-shop-border text-shop-ink hover:border-shop-violet/50'
                }`}
                title="Click to switch active campus"
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${isBrowsingOtherCollege ? 'text-amber-600' : 'text-shop-violet'}`} />
                <span className="font-semibold text-shop-ink">
                  {activeCollege ? activeCollege.code : 'All Campuses'}
                </span>
                <span className="hidden lg:inline text-shop-muted text-[11px] max-w-[110px] truncate">
                  ({activeCollege ? activeCollege.name.split('-')[0].trim() : 'Select'})
                </span>
                <ChevronDown className="w-3 h-3 text-shop-muted shrink-0 ml-0.5" />
              </button>

              {/* Campus Selector Popover */}
              {showCollegeModal && (
                <div
                  ref={modalRef}
                  className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-[28px] shadow-shop-float border border-shop-border p-5 z-50 animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-shop-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-shop-canvas flex items-center justify-center text-shop-violet">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-shop-ink">Select Campus</h4>
                        <p className="text-[11px] text-shop-muted">Browse listings specific to your college</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCollegeModal(false)}
                      className="p-1 rounded-full text-shop-muted hover:text-shop-ink hover:bg-shop-canvas transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Campus Input */}
                  <div className="relative my-3">
                    <Search className="w-3.5 h-3.5 text-shop-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search college code or name..."
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[12px] rounded-full border border-shop-border focus:outline-none focus:border-shop-violet"
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
                          className={`w-full flex items-center justify-between p-2.5 rounded-[16px] text-left text-[12px] transition-all ${
                            isSelected
                              ? 'bg-shop-canvas text-shop-ink font-semibold'
                              : 'hover:bg-shop-canvas text-shop-muted hover:text-shop-ink'
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-shop-ink">{col.code}</span>
                              {isUserHome && (
                                <span className="px-1.5 py-0.2 text-[9px] font-medium rounded-full bg-emerald-50 text-emerald-700">
                                  Home
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-shop-muted line-clamp-1">{col.name}</span>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-shop-violet shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}

                    {filteredColleges.length === 0 && (
                      <p className="text-center text-[12px] text-shop-muted py-4">No colleges match your query.</p>
                    )}
                  </div>

                  {/* Reset to Home Campus Action */}
                  {user && isBrowsingOtherCollege && (
                    <div className="pt-3 mt-2 border-t border-shop-border flex items-center justify-between">
                      <span className="text-[11px] text-amber-800">Browsing alternate campus</span>
                      <button
                        onClick={() => {
                          resetToHomeCollege();
                          setShowCollegeModal(false);
                        }}
                        className="text-[12px] font-medium text-shop-violet hover:underline flex items-center gap-1"
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
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/buy"
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                isActive('/buy')
                  ? 'bg-shop-canvas text-shop-ink'
                  : 'text-shop-muted hover:text-shop-ink hover:bg-white'
              }`}
            >
              <span>Explore</span>
            </Link>

            <Link
              to="/sell"
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                isActive('/sell')
                  ? 'bg-shop-canvas text-shop-ink'
                  : 'text-shop-muted hover:text-shop-ink hover:bg-white'
              }`}
            >
              <span>Sell Gear</span>
            </Link>

            <Link
              to="/find-teammates"
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                isActive('/find-teammates') || isActive('/teams')
                  ? 'bg-shop-canvas text-shop-ink'
                  : 'text-shop-muted hover:text-shop-ink hover:bg-white'
              }`}
            >
              <span>Teammates</span>
            </Link>

            <Link
              to="/campus-heroes"
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                isActive('/campus-heroes')
                  ? 'bg-shop-canvas text-shop-ink'
                  : 'text-shop-muted hover:text-shop-ink hover:bg-white'
              }`}
            >
              <span>Heroes</span>
            </Link>

            {user && (
              <Link
                to="/my-teams"
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  isActive('/my-teams')
                    ? 'bg-shop-canvas text-shop-ink'
                    : 'text-shop-muted hover:text-shop-ink'
                }`}
              >
                My Teams
              </Link>
            )}

            {(user?.role === 'CAMPUS_HERO' || user?.role === 'ADMIN') && (
              <Link
                to="/hero-dashboard"
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all flex items-center gap-1 border ${
                  isActive('/hero-dashboard')
                    ? 'bg-shop-ink text-white border-shop-ink'
                    : 'bg-white text-shop-ink border-shop-border hover:border-shop-violet'
                }`}
                title="Campus Hero Delivery Operations"
              >
                <Truck className="w-3 h-3 text-shop-violet" />
                <span>Hero Ops</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all flex items-center gap-1 border ${
                  isActive('/admin')
                    ? 'bg-shop-violet text-white border-shop-violet'
                    : 'bg-white text-shop-ink border-shop-border hover:border-shop-violet'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-shop-violet" />
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-shop-border bg-white hover:border-shop-violet/40 transition-all text-[12px] font-medium text-shop-ink shadow-shop-pill"
                >
                  <div className="w-6 h-6 rounded-full bg-shop-canvas text-shop-ink border border-shop-border flex items-center justify-center font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-semibold">{user.name.split(' ')[0]}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-shop-canvas text-[10px] text-shop-muted">
                    {user.college.code}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-shop-muted hover:text-shop-ink hover:bg-shop-canvas rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-[13px] font-medium text-shop-ink hover:text-shop-violet rounded-full transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-[13px] font-medium text-white bg-shop-violet hover:bg-shop-violet-hover rounded-full transition-all shadow-shop-pill hover:shadow-shop-violet"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Shop Pill Rail) */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-50 bg-white/95 backdrop-blur-md border border-shop-border rounded-full px-4 py-2 flex items-center justify-around shadow-shop-float">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            isActive('/') ? 'text-shop-violet' : 'text-shop-muted hover:text-shop-ink'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/buy"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            isActive('/buy') ? 'text-shop-violet' : 'text-shop-muted hover:text-shop-ink'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span>Buy</span>
        </Link>
        <Link
          to="/sell"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            isActive('/sell') ? 'text-shop-violet' : 'text-shop-muted hover:text-shop-ink'
          }`}
        >
          <Tag className="w-4 h-4 mb-0.5" />
          <span>Sell</span>
        </Link>
        <Link
          to="/find-teammates"
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            isActive('/find-teammates') || isActive('/teams') ? 'text-shop-violet' : 'text-shop-muted hover:text-shop-ink'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Teams</span>
        </Link>
        {user ? (
          <Link
            to="/profile"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive('/profile') ? 'text-shop-violet' : 'text-shop-muted hover:text-shop-ink'
            }`}
          >
            <UserIcon className="w-4 h-4 mb-0.5" />
            <span>Profile</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
              isActive('/login') ? 'text-shop-violet' : 'text-shop-muted hover:text-shop-ink'
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

