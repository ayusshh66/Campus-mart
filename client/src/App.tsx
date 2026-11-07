
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

// Shared components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Marketplace pages
import { GuestHome } from './pages/GuestHome';
import { BuyPage } from './pages/BuyPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SellPage } from './pages/SellPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Campus Hero pages
import { CampusHeroesPage } from './pages/CampusHeroesPage';
import { CampusHeroDashboardPage } from './pages/CampusHeroDashboardPage';

// Admin page
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Hackathon pages — preserved for future release
import { FindTeammatesPage } from './pages/FindTeammatesPage';
import { CreateTeamPage } from './pages/CreateTeamPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { MyTeamsPage } from './pages/MyTeamsPage';
import { SoloPostsPage } from './pages/SoloPostsPage';
import { CreateSoloPostPage } from './pages/CreateSoloPostPage';

// Admin route protection
const AdminRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading CampusMart...
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Logged-in user protection
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading CampusMart...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Campus Hero protection
const HeroRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-campus-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    user.role !== 'CAMPUS_HERO' &&
    user.role !== 'ADMIN'
  ) {
    return <Navigate to="/campus-heroes" replace />;
  }

  return <>{children}</>;
};

// Main application routes
const AppRoutes: React.FC = () => {
  const location = useLocation();

  // Temporarily disable all hackathon-related pages.
  const isHackathonRoute =
    /^\/(?:find-teammates|teams|my-teams|find-students|students)(?:\/|$)/i.test(
      location.pathname
    );

  if (!TEAMS_ENABLED && isHackathonRoute) {
    return <Navigate to="/buy" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090B09] dark:bg-[#090B09] light:bg-[#F7F8F2] text-[#F5F7F0] dark:text-[#F5F7F0] light:text-[#171B13] selection:bg-[#C6DE41] selection:text-[#090B09] transition-colors duration-200">

      <Navbar />

      <main className="flex-grow pb-20 md:pb-0">
        <Routes>

          {/* SAME HOMEPAGE FOR EVERYONE */}
          <Route
            path="/"
            element={<GuestHome />}
          />

          {/* Marketplace */}
          <Route path="/buy" element={<BuyPage />} />

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

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Campus Heroes */}
          <Route
            path="/campus-heroes"
            element={<CampusHeroesPage />}
          />

          <Route
            path="/hero-dashboard"
            element={
              <HeroRoute>
                <CampusHeroDashboardPage />
              </HeroRoute>
            }
          />

          <Route
            path="/hero/dashboard"
            element={
              <HeroRoute>
                <CampusHeroDashboardPage />
              </HeroRoute>
            }
          />

          <Route
            path="/campus-hero-dashboard"
            element={
              <HeroRoute>
                <CampusHeroDashboardPage />
              </HeroRoute>
            }
          />

          {/* Admin */}
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

          {/* Hackathon features — future release */}
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

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </main>

      <Footer />
    </div>
  );
};

// Root application

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SmoothScroll>
          <AuthProvider>
            <AppRoutes />

            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={5000}
              offset={{ top: 90, right: 20 }}
            />
          </AuthProvider>
        </SmoothScroll>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
