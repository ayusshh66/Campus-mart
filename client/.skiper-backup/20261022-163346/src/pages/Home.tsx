import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api, Product, College } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { resolveProductImageUrl, handleImageError } from '../utils/imageUtils';
import { 
  ShoppingBag, 
  Tag, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Search,
  Users,
  Cpu,
  Calculator,
  Compass as DraftingCompass,
  BookOpen,
  FlaskConical,
  Headphones,
  Check,
  Truck,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Code2,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const RECOMMERCE_CATEGORIES = [
  {
    name: 'Scientific Calculators',
    icon: Calculator,
    label: 'Calculators',
    color: '#10B981',
    description: 'Casio fx-991EX, fx-991CW, fx-82MS',
    image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Drafters & Engineering Kits',
    icon: DraftingCompass,
    label: 'Engineering Tools',
    color: '#3B82F6',
    description: 'Mini drafters, roller scales, sheet holders',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Lab Coats & Practical Kits',
    icon: FlaskConical,
    label: 'Practical Kits',
    color: '#F59E0B',
    description: 'Chemistry coats, breadboards, multimeter',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Books & Academic Notes',
    icon: BookOpen,
    label: 'Textbooks & Notes',
    color: '#8B5CF6',
    description: 'Standard textbooks, semester guides',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Tech & Electronics',
    icon: Cpu,
    label: 'Tech Gear',
    color: '#06B6D4',
    description: 'Keyboards, dongles, cables, monitors',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Campus Audio & Gear',
    icon: Headphones,
    label: 'Audio & Study',
    color: '#EC4899',
    description: 'ANC headphones, study earbuds',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  }
];

// Single Floating Product Card for Hero Side Columns
const HeroProductCard: React.FC<{
  product: Product;
  floatY: number[];
  duration: number;
  delay: number;
  initialRotate: number;
}> = ({ product, floatY, duration, delay, initialRotate }) => {
  const navigate = useNavigate();
  const img = resolveProductImageUrl(product.image_url || (Array.isArray(product.images) ? product.images[0] : undefined));

  return (
    <motion.div
      className="w-52 xl:w-56 cursor-pointer"
      initial={{ opacity: 0, y: 15 }}
      animate={{
        opacity: 1,
        y: floatY,
        rotate: [initialRotate, initialRotate + (initialRotate > 0 ? -1.2 : 1.2), initialRotate],
      }}
      transition={{
        opacity: { duration: 0.5, delay: delay * 0.5 },
        y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
        rotate: { duration: duration * 1.1, repeat: Infinity, ease: 'easeInOut', delay },
      }}
      whileHover={{ scale: 1.04, y: -4, rotate: 0, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/buy/${product.id}`)}
    >
      <div className="bg-white rounded-[24px] p-2.5 border border-slate-200 shadow-lg hover:shadow-xl transition-all text-left">
        <div className="relative aspect-square w-full rounded-[18px] overflow-hidden bg-slate-100">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-medium text-slate-950 shadow-sm">
              {product.category?.split('&')[0]?.trim() || 'Gear'}
            </span>
          </div>
        </div>
        <div className="pt-2 px-1">
          <h4 className="text-[13px] font-semibold text-slate-950 truncate tracking-tight hover:text-violet-600 transition-colors">
            {product.name}
          </h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[14px] font-bold text-slate-950 tracking-tight">
              ₹{product.sell_price.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Home: React.FC = () => {
  const { user, selectedCollegeId } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Up to 4 distinct real products for hero layout
  const floatingProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buy?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/buy');
    }
  };

  return (
    <div className="space-y-16 md:space-y-20 pb-20 overflow-x-hidden">
      
      {/* =========================================================================
          HERO SECTION — 3-COLUMN RESPONSIVE LAYOUT (Shop-inspired)
      ========================================================================= */}
      <section className="relative pt-6 md:pt-10 pb-12 md:pb-16 overflow-hidden border-b border-slate-200">
        {/* Subtle radial glow centered behind wordmark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[350px] bg-violet-600/5 rounded-full blur-[100px] -translate-y-10" />
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Responsive 3-Column Layout: Products | Center Content | Products */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center min-h-[460px]">
            
            {/* Left Products Column (Desktop) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 items-end justify-center">
              {floatingProducts[0] && (
                <HeroProductCard
                  product={floatingProducts[0]}
                  floatY={[0, -6, 0]}
                  duration={7.2}
                  delay={0}
                  initialRotate={-2}
                />
              )}
              {floatingProducts[1] && (
                <HeroProductCard
                  product={floatingProducts[1]}
                  floatY={[0, -7, 0]}
                  duration={8.4}
                  delay={1.2}
                  initialRotate={2.5}
                />
              )}
            </div>

            {/* Center Content Column */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center text-center px-2">
              {/* Campus Indicator Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6 text-[12px]">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                <span className="font-semibold text-slate-950">
                  {activeCollege ? activeCollege.code : 'All Campuses'}
                </span>
                <span className="text-slate-200">|</span>
                <span className="text-slate-500">Verified Student Recommerce</span>
              </div>

              {/* Large CampusMart Wordmark */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-950 tracking-tight leading-tight">
                CampusMart<span className="text-violet-600">.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-[14px] sm:text-[16px] text-slate-500 max-w-md mx-auto tracking-tight mt-3 leading-relaxed">
                Pre-loved college essentials verified by students. Fair fixed pricing, in-campus handovers, zero stranger risk.
              </p>

              {/* Central Pill Search Bar */}
              <form 
                onSubmit={handleSearchSubmit}
                className="mt-6 w-full max-w-lg mx-auto bg-white rounded-full p-1.5 pl-5 flex items-center border border-black/10 shadow-lg focus-within:border-violet-600 focus-within:shadow-violet-600 transition-all duration-300 group"
              >
                <Search className="w-5 h-5 text-slate-500 group-focus-within:text-violet-600 transition-colors shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you shopping for today?"
                  className="w-full bg-transparent text-[14px] sm:text-[15px] text-slate-950 placeholder:text-slate-500 focus:outline-none tracking-tight font-normal"
                />
                <button
                  type="submit"
                  title="Search items"
                  className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shrink-0 shadow-violet-600 hover:scale-105 active:scale-95 transition-all ml-1.5"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Category Pills Row Under Search */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {RECOMMERCE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => navigate(`/buy?category=${encodeURIComponent(cat.name)}`)}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-950 text-[11px] sm:text-[12px] font-medium tracking-tight shadow-sm hover:border-violet-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 group"
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Products Column (Desktop) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 items-start justify-center">
              {floatingProducts[2] && (
                <HeroProductCard
                  product={floatingProducts[2]}
                  floatY={[0, -7, 0]}
                  duration={6.8}
                  delay={0.6}
                  initialRotate={-1.5}
                />
              )}
              {floatingProducts[3] && (
                <HeroProductCard
                  product={floatingProducts[3]}
                  floatY={[0, -6, 0]}
                  duration={8.6}
                  delay={1.8}
                  initialRotate={2}
                />
              )}
            </div>

          </div>

          {/* Mobile Product Carousel: Placed BELOW heading and search */}
          {floatingProducts.length > 0 && (
            <div className="lg:hidden mt-8 pt-4 border-t border-slate-200/60">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[12px] font-semibold text-slate-950 tracking-tight">Featured On Campus</span>
                <Link to="/buy" className="text-[12px] font-medium text-violet-600 hover:underline flex items-center gap-0.5">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="overflow-x-auto pb-2 flex items-center gap-3.5 no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
                {floatingProducts.map((product) => {
                  const img = resolveProductImageUrl(product.image_url || (Array.isArray(product.images) ? product.images[0] : undefined));
                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/buy/${product.id}`)}
                      className="shrink-0 w-36 bg-white rounded-[22px] p-2.5 border border-slate-200 shadow-lg text-left cursor-pointer active:scale-95 transition-transform"
                    >
                      <div className="aspect-square w-full rounded-[16px] overflow-hidden bg-slate-100 mb-2">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                      <p className="text-[12px] font-semibold text-slate-950 truncate tracking-tight">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[13px] font-bold text-slate-950">₹{product.sell_price.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-full">Verified</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* =========================================================================
          SECTION 1 — CATEGORY GRID TILES (Shop 4-Column Photo Grid)
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold text-slate-950 tracking-tight">
              Browse Categories
            </h2>
            <ChevronRight className="w-4 h-4 text-slate-950" />
          </div>
          <Link
            to="/buy"
            className="text-[13px] font-medium text-violet-600 hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {RECOMMERCE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                onClick={() => navigate(`/buy?category=${encodeURIComponent(cat.name)}`)}
                className="group relative rounded-[28px] overflow-hidden bg-white border border-slate-200 shadow-lg hover:shadow-xl cursor-pointer flex flex-col justify-between h-48 transition-all hover:-translate-y-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background image preview */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>

                {/* Top Category Icon */}
                <div className="relative z-10 p-3 flex justify-between items-start">
                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm">
                    <Icon className="w-4 h-4 text-slate-950" />
                  </div>
                </div>

                {/* Bottom Overlay Label Chip */}
                <div className="relative z-10 p-3">
                  <div className="inline-block px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm text-left">
                    <h3 className="text-[12px] font-semibold text-slate-950 tracking-tight leading-tight">
                      {cat.label}
                    </h3>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2 — LIVE CAMPUS INVENTORY (Real Data & Filter Tabs)
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-violet-600 text-[12px] font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Verified Gear</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Available at {activeCollege?.code || 'Campus'}
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 tracking-tight">
              Inspected student items ready for instant peer handover.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {['All', 'Calculator', 'Drafter', 'Books', 'Tech'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 ${
                  selectedCategoryTab === tab
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-white text-slate-500 hover:text-slate-950 border border-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Gear' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid or Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-white rounded-[28px] border border-slate-200 p-3 animate-shimmer" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[28px] border border-dashed border-slate-200 max-w-md mx-auto">
            <Tag className="w-10 h-10 text-violet-600 mx-auto mb-3" />
            <h3 className="text-[15px] font-semibold text-slate-950">No items listed under this category</h3>
            <p className="text-[12px] text-slate-500 mt-1 mb-4">
              Have pre-loved items to sell to your college peers?
            </p>
            <Link
              to="/sell"
              className="px-4 py-2 bg-violet-600 text-white text-[12px] font-medium rounded-full inline-block shadow-sm hover:bg-violet-700 transition-colors"
            >
              Sell An Item Now
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

        {/* View Full Catalog CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/buy"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-950 font-semibold text-[13px] shadow-sm hover:border-violet-600 transition-all"
          >
            <span>View Full {activeCollege?.code || 'Campus'} Catalog ({products.length} items)</span>
            <ArrowRight className="w-4 h-4 text-violet-600" />
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — VISUALLY DISTINCT HACKATHON TEAMMATE FINDER
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-[28px] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/20 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[11px] font-medium">
                <Users className="w-3.5 h-3.5 text-violet-200" />
                <span>Hackathon Teammate Matching</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
                Building for Smart India Hackathon or Devfolio?
              </h3>
              <p className="text-[14px] text-slate-500 max-w-xl leading-relaxed tracking-tight">
                Stop struggling to find AI engineers, frontend developers, and UI/UX designers before project deadlines. Filter by college eligibility and review applicant portfolios in one click.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {['Frontend (React/Vite)', 'AI / LLM Engineers', 'UI/UX Designers', 'Backend & Cloud', 'Hardware / IoT'].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-slate-500"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to="/find-teammates"
                className="px-6 py-3.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[13px] text-center shadow-violet-600 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Browse Team Openings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/teams/create"
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-[13px] text-center border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <span>Create Team Post</span>
                <Code2 className="w-4 h-4 opacity-70" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — HOW ADMIN-CONTROLLED BUYING & SELLING WORKS
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[12px] font-semibold text-violet-600 uppercase tracking-wider">
            Recommerce Protocol
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 mt-1 tracking-tight">
            How CampusMart Protects You
          </h2>
          <p className="text-[13px] text-slate-500 mt-2 tracking-tight">
            Unlike unmoderated chat groups where strangers negotiate endlessly, every transaction is peer-verified.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-950 font-bold flex items-center justify-center text-[14px] mb-4">
                01
              </div>
              <h3 className="font-semibold text-[16px] text-slate-950 mb-1.5 tracking-tight">
                Instant Fair Valuation
              </h3>
              <p className="text-[13px] text-slate-500 leading-relaxed tracking-tight">
                No lowball offers. Sellers answer standard condition diagnostic questions to generate transparent, fixed cashout quotes.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Guaranteed Pricing</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-950 font-bold flex items-center justify-center text-[14px] mb-4">
                02
              </div>
              <h3 className="font-semibold text-[16px] text-slate-950 mb-1.5 tracking-tight">
                Physical Quality Check
              </h3>
              <p className="text-[13px] text-slate-500 leading-relaxed tracking-tight">
                Every calculator display, drafter arm, or electronics kit is verified for operational integrity before reaching any buyer.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] font-medium text-violet-600 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-violet-600" />
              <span>Multi-Point Peer Inspection</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-950 font-bold flex items-center justify-center text-[14px] mb-4">
                03
              </div>
              <h3 className="font-semibold text-[16px] text-slate-950 mb-1.5 tracking-tight">
                Safe In-Campus Handover
              </h3>
              <p className="text-[13px] text-slate-500 leading-relaxed tracking-tight">
                Zero off-campus travelling. Student Campus Heroes coordinate safe drop-offs inside college at the canteen or library.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Student Exclusive</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — CAMPUS HERO CTA BANNER
      ========================================================================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[28px] p-8 sm:p-10 border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Earn on Campus
            </span>
            <h3 className="text-2xl font-bold text-slate-950 tracking-tight">
              Become a Campus Hero for {activeCollege?.code || 'Your College'}
            </h3>
            <p className="text-[13px] text-slate-500 max-w-lg tracking-tight">
              Lead safe handovers on campus, earn cash incentives on every delivery, and build leadership credentials.
            </p>
          </div>
          <Link
            to="/campus-heroes"
            className="px-6 py-3 rounded-full bg-slate-950 hover:bg-black text-white font-semibold text-[13px] shrink-0 shadow-sm transition-all"
          >
            Apply as Campus Hero
          </Link>
        </div>
      </section>

    </div>
  );
};
