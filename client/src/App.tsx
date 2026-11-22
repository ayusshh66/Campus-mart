import React from 'react';
import { Toaster } from 'sonner';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import { TEAMS_ENABLED } from './config/features';
import { SmoothScroll } from './components/SmoothScroll';

import './styles/admin-notifications.css';

// Shared components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Marketplace pages
import { GuestHome } from './pages/GuestHome';
import { BuyPage } from './pages/BuyPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SellPage } from './pages/SellPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Authentication pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Campus Hero pages
import { CampusHeroesPage } from './pages/CampusHeroesPage';
import { CampusHeroDashboardPage } from './pages/CampusHeroDashboardPage';

// Campus Hero Manager pages
import { HeroManagerLoginPage } from './pages/HeroManagerLoginPage';
import { HeroManagerDashboardPage } from './pages/HeroManagerDashboardPage';

// Admin page
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Hackathon pages — preserved for future release
import { FindTeammatesPage } from './pages/FindTeammatesPage';
import { CreateTeamPage } from './pages/CreateTeamPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { MyTeamsPage } from './pages/MyTeamsPage';
import { SoloPostsPage } from './pages/SoloPostsPage';
import { CreateSoloPostPage } from './pages/CreateSoloPostPage';

// ============================================
// SHARED LOADING SCREEN
// ============================================

const LoadingScreen: React.FC<{
  message?: string;
}> = ({
  message = 'Loading CampusMart...',
}) => {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C6DE41] border-t-transparent" />

      <p className="text-xs font-medium text-zinc-400">
        {message}
      </p>
    </div>
  );
};

// ============================================
// CAMPUS HERO MANAGER ROUTE PROTECTION
// ============================================

const HeroManagerRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingScreen message="Loading Manager Workspace..." />
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/hero-manager/login"
        replace
      />
    );
  }

  // The Manager Dashboard verifies active college
  // assignments through the backend before
  // displaying any private operational data.
  //
  // This also preserves access for previously
  // authorized managers and global admins.

  return <>{children}</>;
};

// ============================================
// ADMIN ROUTE PROTECTION
// ============================================

const AdminRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingScreen message="Loading Admin Workspace..." />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Dedicated managers cannot access Admin Panel.
  if (user.role === 'HERO_MANAGER') {
    return (
      <Navigate
        to="/hero-manager"
        replace
      />
    );
  }

  // Only global admins can access Admin Panel.
  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ============================================
// LOGGED-IN USER ROUTE PROTECTION
// ============================================

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Dedicated managers cannot access normal
  // marketplace user pages.
  if (user.role === 'HERO_MANAGER') {
    return (
      <Navigate
        to="/hero-manager"
        replace
      />
    );
  }

  return <>{children}</>;
};

// ============================================
// CAMPUS HERO ROUTE PROTECTION
// ============================================

const HeroRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingScreen message="Loading Campus Hero Workspace..." />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'HERO_MANAGER') {
    return (
      <Navigate
        to="/hero-manager"
        replace
      />
    );
  }

  // Only Campus Heroes and global admins
  // can access the individual Hero Dashboard.
  if (
    user.role !== 'CAMPUS_HERO' &&
    user.role !== 'ADMIN'
  ) {
    return (
      <Navigate
        to="/campus-heroes"
        replace
      />
    );
  }

  return <>{children}</>;
};

// ============================================
// MAIN APPLICATION ROUTES
// ============================================

const AppRoutes: React.FC = () => {
  const location = useLocation();

  const { user, isLoading } = useAuth();

  const pathname =
    location.pathname
      .replace(/\/+$/, '')
      .toLowerCase() || '/';

  // Dedicated Manager pages.
  const isHeroManagerPage =
    pathname === '/hero-manager' ||
    pathname === '/hero-manager/login';

  // Temporarily disable all hackathon pages.
  const isHackathonRoute =
    /^\/(?:find-teammates|teams|my-teams|find-students|students)(?:\/|$)/i.test(
      pathname
    );

  // ==========================================
  // RESTRICT DEDICATED MANAGER ACCOUNTS
  // ==========================================

  // Wait for session restoration before
  // determining account permissions.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090B09]">
        <LoadingScreen />
      </div>
    );
  }

  // Managers must remain inside their
  // dedicated Manager Operations Panel.
  if (
    user?.role === 'HERO_MANAGER' &&
    !isHeroManagerPage
  ) {
    return (
      <Navigate
        to="/hero-manager"
        replace
      />
    );
  }

  // Block direct access to paused
  // hackathon-related routes.
  if (!TEAMS_ENABLED && isHackathonRoute) {
    return <Navigate to="/buy" replace />;
  }

  return (
    <div
      className="
        min-h-screen
        flex
        flex-col

        bg-[#090B09]
        dark:bg-[#090B09]
        light:bg-[#F7F8F2]

        text-[#F5F7F0]
        dark:text-[#F5F7F0]
        light:text-[#171B13]

        selection:bg-[#C6DE41]
        selection:text-[#090B09]

        transition-colors
        duration-200
      "
    >
      {/* ======================================
          GLOBAL NAVBAR
      ====================================== */}

      {!isHeroManagerPage && <Navbar />}

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main
        className={`flex-grow min-w-0 ${
          isHeroManagerPage
            ? 'pb-0'
            : 'pb-20 md:pb-0'
        }`}
      >
        <Routes>

          {/* ==================================
              HOMEPAGE
          ================================== */}

          <Route
            path="/"
            element={<GuestHome />}
          />

          {/* ==================================
              MARKETPLACE
          ================================== */}

          <Route
            path="/buy"
            element={<BuyPage />}
          />

          <Route
            path="/buy/:productId"
            element={<ProductDetailPage />}
          />

          <Route
            path="/sell"
            element={
              <ProtectedRoute>
                <SellPage />
              </ProtectedRoute>
            }
          />

          {/* ==================================
              USER ACCOUNT
          ================================== */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* ==================================
              NORMAL AUTHENTICATION
          ================================== */}

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

          {/* ==================================
              CAMPUS HERO PUBLIC PAGE
          ================================== */}

          <Route
            path="/campus-heroes"
            element={<CampusHeroesPage />}
          />

          {/* ==================================
              CAMPUS HERO DASHBOARD
          ================================== */}

          <Route
            path="/hero-dashboard"
            element={
              <HeroRoute>
                <CampusHeroDashboardPage />
              </HeroRoute>
            }
          />

          {/* Preserve previous Hero Dashboard URLs */}

          <Route
            path="/hero/dashboard"
            element={
              <Navigate
                to="/hero-dashboard"
                replace
              />
            }
          />

          <Route
            path="/campus-hero-dashboard"
            element={
              <Navigate
                to="/hero-dashboard"
                replace
              />
            }
          />

          {/* ==================================
              CAMPUS HERO MANAGER LOGIN
          ================================== */}

          <Route
            path="/hero-manager/login"
            element={<HeroManagerLoginPage />}
          />

          {/* ==================================
              CAMPUS HERO MANAGER DASHBOARD
          ================================== */}

          <Route
            path="/hero-manager"
            element={
              <HeroManagerRoute>
                <HeroManagerDashboardPage />
              </HeroManagerRoute>
            }
          />

          {/* ==================================
              GLOBAL ADMIN PANEL
          ================================== */}

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* ==================================
              HACKATHON FEATURES
              Preserved for future release
          ================================== */}

          {TEAMS_ENABLED && (
            <>
              <Route
                path="/find-teammates"
                element={<FindTeammatesPage />}
              />

              <Route
                path="/teams/create"
                element={
                  <ProtectedRoute>
                    <CreateTeamPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teams/:id"
                element={<TeamDetailPage />}
              />

              <Route
                path="/my-teams"
                element={
                  <ProtectedRoute>
                    <MyTeamsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/find-students"
                element={<SoloPostsPage />}
              />

              <Route
                path="/students/create"
                element={
                  <ProtectedRoute>
                    <CreateSoloPostPage />
                  </ProtectedRoute>
                }
              />
            </>
          )}

          {/* ==================================
              INVALID ROUTE FALLBACK
          ================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to={
                  user?.role === 'HERO_MANAGER'
                    ? '/hero-manager'
                    : '/'
                }
                replace
              />
            }
          />

        </Routes>
      </main>

      {/* ======================================
          GLOBAL FOOTER
      ====================================== */}

      {!isHeroManagerPage && <Footer />}
    </div>
  );
};

// ============================================
// ROOT APPLICATION
// ============================================

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SmoothScroll>
          <AuthProvider>

            <AppRoutes />

            {/* Global toast notifications */}

            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={5000}
              visibleToasts={3}
              offset={{
                top: 90,
                right: 20,
              }}
            />

          </AuthProvider>
        </SmoothScroll>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;