import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Truck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Desktop & Tablet Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & College Indicator */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-campus-primary to-campus-dark flex items-center justify-center text-white shadow-md shadow-campus-primary/20 group-hover:scale-105 transition-transform duration-200">
                <span className="font-extrabold text-xl tracking-tight">C</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-campus-dark tracking-tight leading-tight group-hover:text-campus-primary transition-colors">
                  Campus<span className="text-campus-primary">Mart</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Recommerce</span>
              </div>
            </Link>

            {/* Prominent College Badge */}
            {user ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-light/60 border border-campus-primary/30 text-campus-dark font-medium text-xs shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-campus-primary shrink-0" />
                <span className="font-bold text-campus-dark">{user.college.code}</span>
                <span className="text-slate-500 text-[11px] truncate max-w-[140px]">({user.college.name.split('-')[0].trim()})</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>College Recommerce</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/buy"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/buy')
                  ? 'bg-campus-soft text-campus-primary font-bold'
                  : 'text-slate-600 hover:text-campus-dark hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Buy
            </Link>
            <Link
              to="/sell"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/sell')
                  ? 'bg-campus-soft text-campus-primary font-bold'
                  : 'text-slate-600 hover:text-campus-dark hover:bg-slate-50'
              }`}
            >
              <Tag className="w-4 h-4" />
              Sell
            </Link>
            <Link
              to="/campus-heroes"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/campus-heroes')
                  ? 'bg-campus-soft text-campus-primary font-bold'
                  : 'text-slate-600 hover:text-campus-dark hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Campus Heroes
            </Link>

            {(user?.role === 'CAMPUS_HERO' || user?.role === 'ADMIN') && (
              <Link
                to="/hero-dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  isActive('/hero-dashboard')
                    ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
                title="Campus Hero Operations Center"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hero Operations</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Admin Portal
              </Link>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-campus-primary/40 bg-white hover:bg-campus-soft/50 transition-all text-sm font-medium text-slate-700"
                >
                  <div className="w-7 h-7 rounded-full bg-campus-primary text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-semibold">{user.name.split(' ')[0]}</span>
                  <span className="text-xs text-campus-primary font-bold">📍 {user.college.code}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-campus-dark hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-bold text-white bg-campus-primary hover:bg-campus-primary-hover shadow-sm hover:shadow shadow-campus-primary/30 rounded-lg transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-2 text-xs font-semibold rounded-lg transition-colors ${
            isActive('/') ? 'text-campus-primary' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/buy"
          className={`flex flex-col items-center py-1 px-2 text-xs font-semibold rounded-lg transition-colors ${
            isActive('/buy') ? 'text-campus-primary' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Buy</span>
        </Link>
        <Link
          to="/sell"
          className={`flex flex-col items-center py-1 px-2 text-xs font-semibold rounded-lg transition-colors ${
            isActive('/sell') ? 'text-campus-primary' : 'text-slate-500'
          }`}
        >
          <Tag className="w-5 h-5 mb-0.5" />
          <span>Sell</span>
        </Link>
        <Link
          to="/campus-heroes"
          className={`flex flex-col items-center py-1 px-2 text-xs font-semibold rounded-lg transition-colors ${
            isActive('/campus-heroes') ? 'text-campus-primary' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Heroes</span>
        </Link>
        {user ? (
          <Link
            to="/profile"
            className={`flex flex-col items-center py-1 px-2 text-xs font-semibold rounded-lg transition-colors ${
              isActive('/profile') ? 'text-campus-primary' : 'text-slate-500'
            }`}
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center py-1 px-2 text-xs font-semibold rounded-lg transition-colors ${
              isActive('/login') ? 'text-campus-primary' : 'text-slate-500'
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
