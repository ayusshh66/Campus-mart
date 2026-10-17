import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Product, College } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { 
  ShoppingBag, 
  Tag, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle,
  Clock,
  Banknote
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, selectedCollegeId, setSelectedCollegeId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collegesRes, productsRes] = await Promise.all([
          api.getColleges(),
          api.getProducts(selectedCollegeId || undefined),
        ]);
        setColleges(collegesRes);
        setProducts(productsRes.data.slice(0, 3)); // Display initial 2-3 products
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCollegeId, user]);

  const activeCollege = user
    ? user.college
    : colleges.find((c) => c.id === selectedCollegeId) || colleges[0];

  return (
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-16 pb-12 md:pb-20 hero-gradient border-b border-campus-light/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            
            {/* Campus Tag Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-campus-primary/30 shadow-subtle mb-6 animate-pulse">
              <MapPin className="w-4 h-4 text-campus-primary shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-campus-dark">
                {user ? `Your Campus: ${user.college.code}` : (
                  <span className="flex items-center gap-2">
                    Browsing Campus:
                    <select
                      value={selectedCollegeId || (colleges[0]?.id || '')}
                      onChange={(e) => setSelectedCollegeId(e.target.value)}
                      className="bg-transparent font-bold text-campus-primary focus:outline-none cursor-pointer"
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name.split('-')[0].trim()}
                        </option>
                      ))}
                    </select>
                  </span>
                )}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-campus-dark tracking-tight leading-[1.1] mb-6">
              Buy & Sell. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-primary to-teal-700">
                Only on Your Campus.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
              A simple recommerce marketplace built for college students. Admin-fixed prices, verified conditions, and direct on-campus delivery.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                to="/buy"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-sm sm:text-base shadow-hero hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buy Something</span>
              </Link>
              <Link
                to="/sell"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-campus-soft text-campus-dark border border-slate-200 font-bold text-sm sm:text-base shadow-subtle hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <Tag className="w-4 h-4 text-campus-primary" />
                <span>Sell Something</span>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="mt-10 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/60 w-full max-w-lg text-xs text-slate-500 font-medium">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-campus-primary mb-1" />
                <span>Admin Verified</span>
              </div>
              <div className="flex flex-col items-center">
                <Banknote className="w-5 h-5 text-campus-primary mb-1" />
                <span>Fixed Fair Prices</span>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="w-5 h-5 text-campus-primary mb-1" />
                <span>On-Campus Handover</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Available on Your Campus Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-campus-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Campus Essentials</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-dark tracking-tight">
              Available on your campus
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Curated items currently available or circulating at{' '}
              <span className="font-semibold text-campus-dark">{activeCollege?.code || 'your college'}</span>.
            </p>
          </div>
          <Link
            to="/buy"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-campus-primary hover:text-campus-primary-hover group"
          >
            <span>View all products</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                userCollegeCode={activeCollege?.code}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-campus-soft/70 border border-campus-light rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-primary">Simple & Transparent</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-dark mt-1">
              How CampusMart Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              No endless bargaining or risky off-campus meets. The platform handles verification, fair pricing, and logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-100 relative">
              <span className="text-4xl font-extrabold text-campus-primary/20 block mb-3">01</span>
              <h3 className="text-lg font-bold text-campus-dark mb-2">Submit an item</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Choose a product from our accepted catalog, snap a couple of photos, and submit your sell request in 30 seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-100 relative">
              <span className="text-4xl font-extrabold text-campus-primary/20 block mb-3">02</span>
              <h3 className="text-lg font-bold text-campus-dark mb-2">We review & price it</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Admin approves the item and fixes the fair payout amount. You know exactly what you’ll receive with zero haggling.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-100 relative">
              <span className="text-4xl font-extrabold text-campus-primary/20 block mb-3">03</span>
              <h3 className="text-lg font-bold text-campus-dark mb-2">Students buy it</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Once approved, the item becomes instantly available to your batchmates and college community for smooth handoff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Hero Highlight Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-campus-dark to-[#094d41] text-white p-8 sm:p-12 overflow-hidden shadow-card">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
          
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-primary/20 border border-campus-primary/40 text-campus-light text-xs font-bold mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-campus-primary" />
              <span>Campus Representative Program</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              🦸 CAMPUS HEROES
            </h2>

            <p className="text-base sm:text-lg text-slate-200 mb-2 font-medium">
              Want to represent CampusMart in your college?
            </p>
            <p className="text-sm text-slate-300 mb-8 max-w-lg leading-relaxed">
              Help students buy & sell essentials, coordinate safe handovers on campus, and become the go-to leader for recommerce.
            </p>

            <Link
              to="/campus-heroes"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-sm shadow-hero hover:shadow-lg transition-all"
            >
              <span>Become a Campus Hero</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
