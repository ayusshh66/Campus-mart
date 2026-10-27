import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { BuyPage } from './pages/BuyPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SellPage } from './pages/SellPage';
import { CampusHeroesPage } from './pages/CampusHeroesPage';
import { CampusHeroDashboardPage } from './pages/CampusHeroDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FindTeammatesPage } from './pages/FindTeammatesPage';
import { CreateTeamPage } from './pages/CreateTeamPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { MyTeamsPage } from './pages/MyTeamsPage';

// Protected Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs text-slate-400">Loading CampusMart...</div>;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Protected User Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs text-slate-400">Loading CampusMart...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Protected Campus Hero Route Guard - Strictly for approved Campus Heroes and Admins
const HeroRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-campus-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'CAMPUS_HERO' && user.role !== 'ADMIN') {
    return <Navigate to="/campus-heroes" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#090B09] text-[#F5F7F0] selection:bg-[#C6DE41] selection:text-[#090B09]">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/buy/:productId" element={<ProductDetailPage />} />
          <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
          <Route path="/campus-heroes" element={<CampusHeroesPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          
          {/* Find Teammates & Hackathon Matching */}
          <Route path="/find-teammates" element={<FindTeammatesPage />} />
          <Route path="/teams/create" element={<ProtectedRoute><CreateTeamPage /></ProtectedRoute>} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/my-teams" element={<ProtectedRoute><MyTeamsPage /></ProtectedRoute>} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Campus Hero Operations Dashboard - Restricted to Approved Heroes & Admins */}
          <Route path="/hero-dashboard" element={<HeroRoute><CampusHeroDashboardPage /></HeroRoute>} />
          <Route path="/hero/dashboard" element={<HeroRoute><CampusHeroDashboardPage /></HeroRoute>} />
          <Route path="/campus-hero-dashboard" element={<HeroRoute><CampusHeroDashboardPage /></HeroRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
