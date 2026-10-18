import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  Clock,
  Banknote,
  Search,
  Users,
  Compass,
  Cpu,
  Calculator,
  Compass as DraftingCompass,
  BookOpen,
  FlaskConical,
  Headphones,
  CheckCircle,
  Check,
  Truck,
  RotateCcw
} from 'lucide-react';

const RECOMMERCE_CATEGORIES = [
  {
    name: 'Scientific Calculators',
    icon: Calculator,
    description: 'Casio fx-991EX, fx-991CW, fx-82MS',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    name: 'Drafters & Engineering Kits',
    icon: DraftingCompass,
    description: 'Mini drafters, roller scales, sheet holders',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    name: 'Lab Coats & Practical Kits',
    icon: FlaskConical,
    description: 'Chemistry coats, breadboards, multimeter',
    color: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    name: 'Books & Academic Notes',
    icon: BookOpen,
    description: 'Standard textbooks, semester guides',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    name: 'Tech & Electronics',
    icon: Cpu,
    description: 'Keyboards, dongles, cables, monitors',
    color: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    name: 'Campus Audio & Gear',
    icon: Headphones,
    description: 'ANC headphones, study earbuds',
    color: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

export const Home: React.FC = () => {
  const { user, selectedCollegeId, setSelectedCollegeId, resetToHomeCollege, isBrowsingOtherCollege } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collegesRes, productsRes] = await Promise.all([
          api.getColleges(),
          api.getProducts(selectedCollegeId || undefined),
        ]);
        setColleges(collegesRes);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCollegeId, user]);

  const activeCollege = colleges.find((c) => c.id === selectedCollegeId) || (user ? user.college : colleges[0]);

  // Dynamic filter for featured products
  const featuredProducts = useMemo(() => {
    if (selectedCategoryTab === 'All') {
      return products.slice(0, 6);
    }
    return products
      .filter((p) => p.category.toLowerCase().includes(selectedCategoryTab.toLowerCase()))
      .slice(0, 6);
  }, [products, selectedCategoryTab]);

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      
      {/* Recommerce Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-14 pb-14 md:pb-20 hero-gradient border-b border-campus-light/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            
            {/* Cashify-style Trust Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-campus-primary/30 shadow-subtle mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-campus-primary animate-ping" />
              <span className="text-xs font-bold text-campus-dark">
                Campus-Exclusive Recommerce Network
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-emerald-700">100% Quality Inspected</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-campus-dark tracking-tight leading-[1.12] mb-6">
              Buy & Sell Campus Gear. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-primary via-teal-600 to-campus-dark">
                Right Inside Your College.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
              No off-campus stranger meetups. No price haggling. Cashify-style transparent fixed valuation, rigorous quality inspection, and immediate in-campus delivery.
            </p>

            {/* Dual Cashify-Inspired Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-8">
              <Link
                to="/buy"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-campus-primary hover:bg-campus-primary-hover text-white font-extrabold text-sm sm:text-base shadow-hero hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Buy Verified Gear</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/sell"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-campus-soft text-campus-dark border-2 border-campus-primary/30 hover:border-campus-primary font-extrabold text-sm sm:text-base shadow-subtle hover:shadow transition-all flex items-center justify-center gap-2.5 group"
              >
                <Tag className="w-5 h-5 text-campus-primary group-hover:rotate-12 transition-transform" />
                <span>Sell & Instant Cashout</span>
              </Link>
            </div>

            {/* Campus Selector Bar inside Hero */}
            <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-card border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-campus-primary shrink-0" />
                <span className="text-slate-500 font-medium">Viewing Campus:</span>
                <span className="font-extrabold text-campus-dark text-sm">
                  {activeCollege?.code || 'Select College'}
                </span>
                {isBrowsingOtherCollege && user && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Home: {user.college.code}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={selectedCollegeId || (user ? user.college.id : colleges[0]?.id || '')}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-campus-dark focus:outline-none focus:ring-2 focus:ring-campus-primary/30 cursor-pointer"
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.code} — {col.name.split('-')[0].trim()}
                    </option>
                  ))}
                </select>

                {isBrowsingOtherCollege && (
                  <button
                    onClick={resetToHomeCollege}
                    className="p-1.5 rounded-xl text-amber-700 hover:bg-amber-50 border border-amber-200 text-xs"
                    title="Reset to home campus"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Recommerce Trust Points */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-200/80 w-full max-w-2xl text-xs text-slate-600 font-semibold">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-campus-primary shrink-0" />
                <span>Admin Inspected</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Banknote className="w-4 h-4 text-campus-primary shrink-0" />
                <span>Fixed Fair Pricing</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Truck className="w-4 h-4 text-campus-primary shrink-0" />
                <span>In-Campus Delivery</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-campus-primary shrink-0" />
                <span>0% Fraud Risk</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Product Categories Section (Cashify Recommerce Category Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2 text-campus-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Campus Essentials Categories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-campus-dark tracking-tight">
              What are you looking to buy or sell?
            </h2>
          </div>
          <Link
            to="/buy"
            className="text-xs sm:text-sm font-bold text-campus-primary hover:text-campus-primary-hover flex items-center gap-1 group"
          >
            <span>Explore all categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {RECOMMERCE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => navigate(`/buy?category=${encodeURIComponent(cat.name)}`)}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover-recommerce-glow transition-all text-left flex flex-col justify-between h-40 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-campus-primary transition-colors leading-snug">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Available on Your Campus Section with Live Filter Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-campus-primary font-bold text-xs uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Live Campus Inventory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-campus-dark tracking-tight">
              Available at {activeCollege?.code || 'Your College'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Admin-verified pre-loved items ready for safe handover on campus.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {['All', 'Calculator', 'Drafter', 'Books', 'Tech'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategoryTab === tab
                    ? 'bg-campus-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Essentials' : tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto">
            <Tag className="w-10 h-10 text-campus-primary mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No items listed under this category</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Have a pre-loved item to sell to fellow students?
            </p>
            <Link
              to="/sell"
              className="px-4 py-2 bg-campus-primary text-white text-xs font-bold rounded-xl inline-block"
            >
              Sell This Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                userCollegeCode={activeCollege?.code}
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/buy"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-campus-dark font-extrabold text-xs shadow-subtle hover:bg-campus-soft hover:border-campus-primary transition-all"
          >
            <span>View Full {activeCollege?.code || 'Campus'} Catalog ({products.length} items)</span>
            <ArrowRight className="w-4 h-4 text-campus-primary" />
          </Link>
        </div>
      </section>

      {/* Cashify Recommerce Comparison vs Generic Classifieds */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-campus-soft/80 border border-campus-light rounded-3xl p-6 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-primary">
              Why CampusMart Recommerce
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-campus-dark mt-1">
              Built for Campus Life. 0% Sketchy.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Unlike open classifieds where strangers negotiate endlessly and meet in parking lots, CampusMart is strictly student-powered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black mb-4 text-base">
                  01
                </div>
                <h3 className="font-extrabold text-base text-campus-dark mb-2">Instant Fair Valuation</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No awkward lowball messages or haggling. Sellers answer 3 quick condition questions and get a transparent price quote.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-campus-primary flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Admin Guaranteed Quote</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black mb-4 text-base">
                  02
                </div>
                <h3 className="font-extrabold text-base text-campus-dark mb-2">Diagnostic Quality Inspection</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every calculator, drafter, or component undergoes a verified physical and operational check so buyers never receive broken gear.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-teal-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Multi-Point Check</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black mb-4 text-base">
                  03
                </div>
                <h3 className="font-extrabold text-base text-campus-dark mb-2">Safe In-Campus Handover</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No travelling outside college gates. Student Campus Heroes coordinate secure drop-offs right at the canteen, library, or hostel gate.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Zero Stranger Risk</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find Teammates & Campus Heroes Callout Dual Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Teammate Finder Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-card relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold mb-3">
                <Users className="w-3.5 h-3.5" />
                <span>Hackathon Teammate Matching</span>
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">
                Building for SIH or Devfolio?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Connect with AI engineers, frontend developers, and UI/UX designers across BPIT, MAIT, MSIT, and USAR with cross-college eligibility filters.
              </p>
            </div>
            <div className="relative z-10">
              <Link
                to="/find-teammates"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <span>Find Teammates Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Campus Hero Program Banner */}
          <div className="bg-gradient-to-br from-campus-dark via-[#094d41] to-emerald-950 text-white rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-card relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-primary/20 border border-campus-primary/40 text-campus-light text-xs font-bold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-campus-primary" />
                <span>Campus Hero Network</span>
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">
                Represent CampusMart at Your College
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Lead verified gear handovers, earn incentives on every completed task, and become the recommerce leader of your campus.
              </p>
            </div>
            <div className="relative z-10">
              <Link
                to="/campus-heroes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs shadow-md transition-all"
              >
                <span>Apply as Campus Hero</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
