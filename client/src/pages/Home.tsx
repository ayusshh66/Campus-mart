import { HomeScrollAccent } from '../components/motion/HomeScrollAccent';
import { AnimatedTooltip } from "../components/ui/animated-tooltip";
import "./HomeTheme.css";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { SmoothInput } from '../components/motion/SmoothInput';
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api, Product, College } from '../services/api';
import { LayeredText } from "../components/ui/layered-text";
import { ProductCard } from '../components/ProductCard';
import { resolveProductImageUrl, handleImageError } from '../utils/imageUtils';
import ASMRStaticBackground from "../components/ui/ASMRStaticBackground";
import "./HomeTheme.css";
import { Tilt3DCard } from "../components/ui/Tilt3DCard";
import {
  InteractiveHoverButton,
  InteractiveHoverLink,
} from "../components/ui/interactive-hover-button";
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
import {
  CardContainer,
  CardBody,
  CardItem,
} from "../components/ui/3d-card";

const RECOMMERCE_CATEGORIES = [
  {
    name: 'Scientific Calculators',
    icon: Calculator,
    label: 'Calculators',
    color: '#C6DE41',
    description: 'Casio fx-991EX, fx-991CW, fx-82MS',
    image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Drafters & Engineering Kits',
    icon: DraftingCompass,
    label: 'Engineering Tools',
    color: '#C6DE41',
    description: 'Mini drafters, roller scales, sheet holders',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Lab Coats & Practical Kits',
    icon: FlaskConical,
    label: 'Practical Kits',
    color: '#C6DE41',
    description: 'Chemistry coats, breadboards, multimeter',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Books & Academic Notes',
    icon: BookOpen,
    label: 'Textbooks & Notes',
    color: '#C6DE41',
    description: 'Standard textbooks, semester guides',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Tech & Electronics',
    icon: Cpu,
    label: 'Tech Gear',
    color: '#C6DE41',
    description: 'Keyboards, dongles, cables, monitors',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Campus Audio & Gear',
    icon: Headphones,
    label: 'Audio & Study',
    color: '#C6DE41',
    description: 'ANC headphones, study earbuds',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
];

// Single Floating Product Card for Hero Side Columns

const HeroProductCard: React.FC<{
  product: Product;
  floatY: number[];
  duration: number;
  delay: number;
  initialRotate: number;
}> = ({
  product,
  floatY,
  duration,
  delay,
  initialRotate,
}) => {
    const navigate = useNavigate();

    const img = resolveProductImageUrl(
      product.image_url ||
      (Array.isArray(product.images)
        ? product.images[0]
        : undefined)
    );

    return (
      <motion.div
        className="w-52 xl:w-56 cursor-pointer"
        initial={{ opacity: 0, y: 15 }}
        animate={{
          opacity: 1,
          y: floatY,
          rotate: [
            initialRotate,
            initialRotate +
            (initialRotate > 0 ? -1.2 : 1.2),
            initialRotate,
          ],
        }}
        transition={{
          opacity: {
            duration: 0.5,
            delay: delay * 0.5,
          },
          y: {
            duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          },
          rotate: {
            duration: duration * 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          },
        }}
        onClick={() => navigate(`/buy/${product.id}`)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            navigate(`/buy/${product.id}`);
          }
        }}
      >
        <CardContainer
          containerClassName="!p-0 w-full"
          className="w-full"
        >
          <CardBody className="!h-auto !w-full">
            <div
              className="bg-[#12160F] rounded-[24px] p-2.5 border border-[#C6DE41]/25 hover:border-[#C6DE41]/60 shadow-lg hover:shadow-[#C6DE41]/10 transition-all duration-300 text-left [transform-style:preserve-3d]"
            >
              {/* Product Image — 3D Depth */}
              <CardItem
                translateZ={40}
                className="!block w-full"
              >
                <div className="relative aspect-square w-full rounded-[18px] overflow-hidden bg-[#181D14]">
                  <img
                    src={img}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={handleImageError}
                  />

                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#090B09]/90 backdrop-blur-sm text-[10px] font-semibold text-white border border-[#C6DE41]/30">
                      {product.category?.split("&")[0]?.trim() ||
                        "Gear"}
                    </span>
                  </div>
                </div>
              </CardItem>

              {/* Product Information — Separate 3D Depth */}
              <CardItem
                translateZ={20}
                className="!block w-full"
              >
                <div className="pt-2 px-1">
                  <h4 className="text-[13px] font-semibold text-white truncate tracking-tight hover:text-[#C6DE41] transition-colors">
                    {product.name}
                  </h4>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[14px] font-bold text-white tracking-tight">
                      ₹{product.sell_price.toLocaleString("en-IN")}
                    </span>

                    <span className="text-[10px] font-semibold text-[#C6DE41] bg-[#C6DE41]/15 border border-[#C6DE41]/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-[#C6DE41]" />
                      Verified
                    </span>
                  </div>
                </div>
              </CardItem>
            </div>
          </CardBody>
        </CardContainer>
      </motion.div>
    );
  };


const scrollReveal = {
  initial: {
    opacity: 0,
    y: 55,
    filter: "blur(8px)",
  },
  whileInView: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  viewport: {
    once: true,
    amount: 0.12,
  },
  transition: {
    duration: 0.85,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};


export const Home: React.FC = () => {
  const { user, selectedCollegeId } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Smooth scrolling — homepage only
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);


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
    <div className="campus-home-dark relative isolate min-h-screen bg-[#090B09]">
      <ASMRStaticBackground />
      <div className="relative z-10 space-y-12 md:space-y-16 pb-12 md:pb-16 overflow-x-hidden">

        {/* =========================================================================
          HERO SECTION — 3-COLUMN RESPONSIVE LAYOUT (Shop-inspired)
      ========================================================================= */}
        <section className="relative pt-6 md:pt-10 pb-12 md:pb-16 overflow-hidden border-b border-white/10">
          {/* Subtle radial glow centered behind wordmark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[600px] h-[350px] bg-[#C6DE41]/10 rounded-full blur-[110px] -translate-y-10" />
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
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12160F] border border-[#C6DE41]/40 shadow-[0_0_12px_rgba(198,222,65,0.15)] mb-6 text-[12px]">
                  <span className="w-2 h-2 rounded-full bg-[#C6DE41] shadow-[0_0_6px_#C6DE41] animate-pulse" />
                  <span className="font-semibold text-white">
                    {activeCollege ? activeCollege.code : 'All Campuses'}
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-300">Verified Student Recommerce</span>
                </div>

                {/* Large CampusMart Wordmark */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                  CampusMart<span className="text-[#C6DE41]">.</span>
                </h1>

                {/* Subheadline */}
                <p className="text-[14px] sm:text-[16px] text-slate-300 max-w-md mx-auto tracking-tight mt-3 leading-relaxed">
                  Pre-loved college essentials verified by students. Fair fixed pricing, in-campus handovers, zero stranger risk.
                </p>

                {/* Central Pill Search Bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="mt-6 w-full max-w-lg mx-auto bg-white/5 backdrop-blur-md rounded-full p-1.5 pl-5 flex items-center border border-white/20 shadow-lg focus-within:border-[#C6DE41] focus-within:shadow-[0_0_22px_rgba(198,222,65,0.4)] transition-all duration-300 group"
                >
                  <Search className="w-5 h-5 text-slate-300 group-focus-within:text-[#C6DE41] transition-colors shrink-0 mr-2.5" />
                  <SmoothInput
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What are you shopping for today?"
                    className="w-full min-w-0 bg-transparent text-[14px] sm:text-[15px] !text-white !caret-[#C6DE41] !placeholder:text-slate-400 focus:outline-none tracking-tight font-normal"
                  />
                  <button
                    type="submit"
                    title="Search items"
                    className="w-11 h-11 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all ml-1.5 shadow-[0_0_12px_rgba(198,222,65,0.3)]"
                  >
                    <ArrowRight className="w-4 h-4 text-[#090B09]" />
                  </button>
                </form>

                {/* Category Pills Row Under Search */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {RECOMMERCE_CATEGORIES.map((cat) => (
                    <InteractiveHoverButton
                      key={cat.name}
                      text={cat.label}
                      chip
                      onClick={() =>
                        navigate(`/buy?category=${encodeURIComponent(cat.name)}`)
                      }
                      className="min-h-9 px-4 py-1.5 text-[12px] shadow-sm !bg-[#12160F] !text-white !border-white/15 hover:!border-[#C6DE41]/60"
                    />
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
                  <span className="text-[12px] font-semibold text-white tracking-tight">Featured On Campus</span>
                  <Link to="/buy" className="text-[12px] font-medium text-[#C6DE41] hover:underline flex items-center gap-0.5">
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
                        className="shrink-0 w-36 bg-[#12160F] rounded-[22px] p-2.5 border border-[#C6DE41]/25 shadow-lg text-left cursor-pointer active:scale-95 transition-transform"
                      >
                        <div className="aspect-square w-full rounded-[16px] overflow-hidden bg-[#181D14] mb-2">
                          <img
                            src={img}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        </div>
                        <p className="text-[12px] font-semibold text-white truncate tracking-tight">{product.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[13px] font-bold text-white">₹{product.sell_price.toLocaleString('en-IN')}</span>
                          <span className="text-[9px] font-semibold text-[#C6DE41] bg-[#C6DE41]/15 px-1 py-0.5 rounded-full border border-[#C6DE41]/30">Verified</span>
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
        <section className="home-glass-section max-w-[1200px] mx-auto rounded-[28px] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-semibold text-white tracking-tight">
                Browse Categories
              </h2>
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
            <Link
              to="/buy"
              className="text-[13px] font-medium text-[#C6DE41] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

            {RECOMMERCE_CATEGORIES.map((cat) => (

              <AnimatedTooltip
                key={cat.name}
                variant="cora"
                content={cat.description}
                accentColor="#C6DE41"
                shapeColor="#C6DE41"
                textColor="#090B09"
              >

                <motion.button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/buy?category=${encodeURIComponent(cat.name)}`
                    )
                  }
                  className="px-3.5 py-2 rounded-full bg-[#12160F] border border-white/15 text-slate-100 text-[12px] font-medium tracking-tight shadow-sm hover:border-[#C6DE41]/60 hover:bg-[#1A2215] transition-colors inline-flex items-center gap-2 group"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_#C6DE41]"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.label}</span>
                </motion.button>
              </AnimatedTooltip>
            ))}

          </div>
        </section>

        {/* =========================================================================
          SECTION 2 — LIVE CAMPUS INVENTORY (Real Data & Filter Tabs)
      ========================================================================= */}
        <section className="home-glass-section max-w-[1200px] mx-auto rounded-[28px] px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[#C6DE41] text-[12px] font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C6DE41]" />
                <span>Campus Verified Gear</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Available at {activeCollege?.code || 'Campus'}
              </h2>
              <p className="text-[13px] text-slate-300 mt-1 tracking-tight">
                Inspected student items ready for instant peer handover.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {['All', 'Calculator', 'Drafter', 'Books', 'Tech'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedCategoryTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 ${selectedCategoryTab === tab
                    ? 'bg-[#C6DE41] text-[#090B09] font-bold shadow-[0_0_12px_rgba(198,222,65,0.3)]'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white border border-white/15'
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
                <div key={i} className="h-80 bg-[#12160F] rounded-[28px] border border-white/10 p-3 animate-shimmer" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="p-12 text-center bg-[#12160F]/95 rounded-[28px] border border-dashed border-[#C6DE41]/30 max-w-md mx-auto">
              <Tag className="w-10 h-10 text-[#C6DE41] mx-auto mb-3" />
              <h3 className="text-[15px] font-semibold text-white">No items listed under this category</h3>
              <p className="text-[12px] text-slate-300 mt-1 mb-4">
                Have pre-loved items to sell to your college peers?
              </p>
              <Link
                to="/sell"
                className="px-4 py-2 bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[12px] rounded-full inline-block shadow-[0_0_12px_rgba(198,222,65,0.3)] transition-all"
              >
                Sell An Item Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {featuredProducts.map((product) => (
                <CardContainer
                  key={product.id}
                  containerClassName="!p-0 w-full h-full"
                  className="w-full h-full"
                >
                  <CardBody className="!w-full !h-full">
                    <CardItem
                      translateZ={35}
                      className="!block w-full h-full"
                    >
                      <ProductCard
                        product={product}
                        userCollegeCode={activeCollege?.code}
                      />
                    </CardItem>
                  </CardBody>
                </CardContainer>
              ))}

            </div>
          )}

          {/* View Full Catalog CTA */}
          <div className="mt-10 text-center">
            <Link
              to="/buy"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-[13px] shadow-sm hover:bg-white/15 hover:border-[#C6DE41] hover:text-[#C6DE41] transition-all"
            >
              <span>View Full {activeCollege?.code || 'Campus'} Catalog ({products.length} items)</span>
              <ArrowRight className="w-4 h-4 text-[#C6DE41]" />
            </Link>
          </div>
        </section>




        {/* =========================================================================
          SECTION 3 — VISUALLY DISTINCT HACKATHON TEAMMATE FINDER
      ========================================================================= */}
        <motion.section
          {...scrollReveal}
          className="max-w-[1200px] mx-auto px-4 sm:px-6"
        ><div className="bg-transparent text-white rounded-[28px] p-8 sm:p-12 relative overflow-hidden border border-white/10">            {/* Subtle background glow */}

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-[250px]">
              <div className="lg:col-span-7 space-y-4">


                <div className="w-full max-w-full">
                  <h3 className="sr-only">
                    Building Team for Smart India Hackathon or Devfolio?
                  </h3>

                  <LayeredText
                    lines={[
                      { top: "\u00A0", bottom: "BUILDING TEAM FOR" },
                      { top: "BUILDING TEAM FOR", bottom: "SMART INDIA" },
                      { top: "SMART INDIA", bottom: "HACKATHON" },
                      { top: "HACKATHON", bottom: "OR DEVFOLIO?" },
                      { top: "OR DEVFOLIO?", bottom: "\u00A0" },
                    ]}
                    fontSize="36px"
                    fontSizeMd="21px"
                    lineHeight={36}
                    lineHeightMd={24}
                    className="text-white !py-2"
                  />
                </div>


              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">

                <div className="lg:col-span-5 flex flex-col gap-3 justify-center w-full min-w-0">
                  <InteractiveHoverLink
                    to="/find-teammates"
                    text="Browse Team Openings"
                    variant="primary"
                    icon={<ArrowRight className="h-4 w-4" />}
                    className="w-full"
                  />
                  <InteractiveHoverLink
                    to="/teams/create"
                    text="Create Team Post"
                    variant="secondary"
                    icon={<Code2 className="h-4 w-4" />}
                    className="w-full"
                  />


                </div>
              </div>
            </div>



          </div>
        </motion.section>        {/* =========================================================================
          SECTION 4 — HOW ADMIN-CONTROLLED BUYING & SELLING WORKS
      ========================================================================= */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[12px] font-semibold text-[#C6DE41] uppercase tracking-wider">
              Recommerce Protocol
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
              How CampusMart Protects You
            </h2>
            <p className="text-[13px] text-slate-300 mt-2 tracking-tight">
              Unlike unmoderated chat groups where strangers negotiate endlessly, every transaction is peer-verified.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <Tilt3DCard>
              <div className="home-info-card rounded-[28px] p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[14px] mb-4">
                    01
                  </div>

                  <h3 className="font-semibold text-[16px] text-white mb-1.5 tracking-tight">
                    Instant Fair Valuation
                  </h3>

                  <p className="text-[13px] text-slate-300 leading-relaxed tracking-tight">
                    No lowball offers. Sellers answer standard condition
                    diagnostic questions to generate transparent, fixed
                    cashout quotes.
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/10 text-[11px] font-medium text-[#C6DE41] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C6DE41]" />
                  <span>Admin Guaranteed Pricing</span>
                </div>
              </div>
            </Tilt3DCard>

            {/* Card 2 */}
            <Tilt3DCard>
              <div className="home-info-card rounded-[28px] p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[14px] mb-4">
                    02
                  </div>

                  <h3 className="font-semibold text-[16px] text-white mb-1.5 tracking-tight">
                    Physical Quality Check
                  </h3>

                  <p className="text-[13px] text-slate-300 leading-relaxed tracking-tight">
                    Every calculator display, drafter arm, or electronics kit
                    is verified for operational integrity before reaching
                    any buyer.
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/10 text-[11px] font-medium text-[#C6DE41] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C6DE41]" />
                  <span>Multi-Point Peer Inspection</span>
                </div>
              </div>
            </Tilt3DCard>

            {/* Card 3 */}
            <Tilt3DCard>
              <div className="home-info-card rounded-[28px] p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[14px] mb-4">
                    03
                  </div>

                  <h3 className="font-semibold text-[16px] text-white mb-1.5 tracking-tight">
                    Safe In-Campus Handover
                  </h3>

                  <p className="text-[13px] text-slate-300 leading-relaxed tracking-tight">
                    Zero off-campus travelling. Student Campus Heroes
                    coordinate safe drop-offs inside college at the
                    canteen or library.
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/10 text-[11px] font-medium text-emerald-500 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>100% Student Exclusive</span>
                </div>
              </div>
            </Tilt3DCard>

          </div>

        </section>

        {/* =========================================================================
          SECTION 5 — CAMPUS HERO CTA BANNER
      ========================================================================= */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="home-info-card rounded-[28px] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">

              <h3 className="text-2xl font-bold text-white tracking-tight">
                Become a Campus Hero for {activeCollege?.code || 'Your College'}
              </h3>
              <p className="text-[13px] text-slate-300 max-w-lg tracking-tight">
                Lead safe handovers on campus, earn cash incentives on every delivery, and build leadership credentials.
              </p>
            </div>

            <InteractiveHoverLink
              to="/campus-heroes"
              text="Apply as Campus Hero"
              variant="secondary"
              icon={<ArrowRight className="h-4 w-4" />}
              className="!w-fit min-w-[235px] shrink-0"
            />

          </div>
        </section>

      </div>
    </div>
  );
};
