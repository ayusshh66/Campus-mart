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

const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9]">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/buy/:productId" element={<ProductDetailPage />} />
          <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
          <Route path="/campus-heroes" element={<CampusHeroesPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Campus Hero Operations Dashboard */}
          <Route path="/hero-dashboard" element={<ProtectedRoute><CampusHeroDashboardPage /></ProtectedRoute>} />
          <Route path="/campus-hero-dashboard" element={<ProtectedRoute><CampusHeroDashboardPage /></ProtectedRoute>} />

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
