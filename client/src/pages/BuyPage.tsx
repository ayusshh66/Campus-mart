import { SmoothInput } from '../components/motion/SmoothInput';
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Product, College } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import ScrollReveal from "../components/motion/ScrollReveal";
import { Tilt3DCard } from "../components/ui/Tilt3DCard";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion } from "framer-motion";
import KineticFabricBackground from "../components/ui/KineticFabricBackground";
import {
  MapPin,
  Tag,
  Search,
  X,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const CATEGORY_FILTERS = [
  'All',
  'Scientific Calculators',
  'Drafters & Engineering Kits',
  'Lab Equipment',
  'Books & Academic',
  'Tech & Electronics',
  'Campus Audio & Gear'
];

export const BuyPage: React.FC = () => {
  
useEffect(() => {
  const lenis = new Lenis({
    autoRaf: true,
    smoothWheel: true,
    lerp: 0.085,
    wheelMultiplier: 0.9,
    anchors: true,
  });

  return () => lenis.destroy();
}, []);

  const { user, selectedCollegeId, setSelectedCollegeId, resetToHomeCollege, isBrowsingOtherCollege } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filters State
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const [collegesRes, productsRes] = await Promise.all([
          api.getColleges(),
          api.getProducts(selectedCollegeId || undefined),
        ]);
        setColleges(collegesRes);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCollegeId, user]);

  // Sync search param if category changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  const activeCollege = colleges.find((c) => c.id === selectedCollegeId) || (user ? user.college : colleges[0]);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Category match
      if (selectedCategory !== 'All') {
        const lowerCat = selectedCategory.toLowerCase();
        const pCat = p.category.toLowerCase();
        if (!pCat.includes(lowerCat) && !lowerCat.includes(pCat)) {
          // Additional fuzzy category match for calculators & drafters
          if (lowerCat.includes('calc') && !pCat.includes('calc') && !p.name.toLowerCase().includes('casio') && !p.name.toLowerCase().includes('calculator')) {
            return false;
          }
          if (lowerCat.includes('draft') && !pCat.includes('draft') && !p.name.toLowerCase().includes('drafter')) {
            return false;
          }
        }
      }

      // In stock match
      if (onlyInStock && !p.is_available) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => a.sell_price - b.sell_price);
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => b.sell_price - a.sell_price);
    }

    return result;
  }, [products, selectedCategory, onlyInStock, searchQuery, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setOnlyInStock(false);
    setSortBy('featured');
    searchParams.delete('category');
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  const isFiltered = searchQuery !== '' || selectedCategory !== 'All' || onlyInStock || sortBy !== 'featured';

  return (
    <div className="campus-explore-dark relative isolate min-h-screen w-full bg-[#090B09] text-white">
      <KineticFabricBackground />
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#C6DE41]/20 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12160F] border border-[#C6DE41]/30 text-white text-[11px] font-semibold shadow-sm mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C6DE41]" />
              <span>Verified Campus Inventory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Explore Campus Catalog
            </h1>
            <p className="text-[13px] text-zinc-300 mt-1 tracking-tight">
              Peer-verified academic essentials ready for handover at{' '}
              <strong className="text-white">{activeCollege?.code || 'your college'}</strong>.
              {isBrowsingOtherCollege && user && (
                <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  Browsing {activeCollege?.code} (Home: {user.college.code})
                </span>
              )}
            </p>
          </div>

          {/* Dynamic Campus Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#C6DE41]/30 bg-[#12160F] text-[12px] font-medium text-white shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-[#C6DE41] shrink-0" />
              <span className="text-zinc-300">Campus:</span>
              <select
                value={selectedCollegeId || (user ? user.college.id : colleges[0]?.id || '')}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#12160F] text-white">
                    {c.code} {user && c.id === user.college.id ? '(Home Campus)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {isBrowsingOtherCollege && (
              <button
                onClick={resetToHomeCollege}
                className="p-2 rounded-full border border-amber-500/40 bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 text-[12px] font-medium transition-colors flex items-center gap-1 shadow-sm"
                title="Return to your registered home campus catalog"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="space-y-4 bg-[#12160F] p-4 sm:p-5 rounded-[28px] border border-[#C6DE41]/25 shadow-lg backdrop-blur-md">

          {/* Search Input & Sort Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Pill Search Input */}
            <div className="relative flex-grow w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <SmoothInput
                type="text"
                placeholder="Search by product name, model (e.g. Casio fx-991, Drafter), category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-full border border-[#C6DE41]/30 bg-[#090B09] text-[13px] !text-white !caret-[#C6DE41] placeholder:text-zinc-500 focus:outline-none focus:border-[#C6DE41] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Controls: In-Stock Toggle & Sort Dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              {/* In Stock toggle pill */}
              <button
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all flex items-center gap-1.5 shrink-0 ${onlyInStock
                    ? 'bg-[#C6DE41] text-[#090B09] border-[#C6DE41] shadow-[0_0_12px_rgba(198,222,65,0.3)]'
                    : 'bg-[#181D14] text-zinc-300 border-white/10 hover:border-[#C6DE41]/40'
                  }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${onlyInStock ? 'text-[#090B09]' : 'text-[#C6DE41]'}`} />
                <span>In Stock Only</span>
              </button>

              {/* Price sort dropdown */}
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#C6DE41]/25 bg-[#181D14] text-[12px] font-medium text-white">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#C6DE41] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-[#12160F] text-white">Featured First</option>
                  <option value="price_asc" className="bg-[#12160F] text-white">Price: Low to High</option>
                  <option value="price_desc" className="bg-[#12160F] text-white">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills Slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all shrink-0 ${selectedCategory === cat
                    ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_12px_rgba(198,222,65,0.3)]'
                    : 'bg-[#181D14] text-zinc-300 hover:text-white hover:bg-[#222A1C] border border-white/10 hover:border-[#C6DE41]/40'
                  }`}
              >
                {cat === 'All' ? 'All Items' : cat.split('&')[0].trim()}
              </button>
            ))}

            {isFiltered && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 text-[12px] font-medium text-rose-300 hover:bg-rose-500/15 rounded-full transition-colors flex items-center gap-1 shrink-0 ml-auto"
              >
                <X className="w-3 h-3" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          {/* Results summary bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-normal tracking-tight gap-3 flex-wrap">
            <span>
              Showing <strong className="text-white font-semibold">{filteredProducts.length}</strong> verified items for{' '}
              <strong className="text-white font-semibold">{activeCollege?.code || 'Campus'}</strong>
            </span>
            <span className="flex items-center gap-1 text-[#C6DE41] font-semibold">
              <CheckCircle2 className="w-3 h-3 text-[#C6DE41]" />
              Physical quality inspected
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-88 bg-[#12160F] rounded-[28px] border border-white/10 p-3 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-[#12160F]/95 rounded-[28px] border border-dashed border-[#C6DE41]/35 max-w-lg mx-auto shadow-lg">
            <div className="w-14 h-14 rounded-full bg-[#C6DE41]/15 text-[#C6DE41] flex items-center justify-center mx-auto mb-4 border border-[#C6DE41]/30">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-[17px] font-semibold text-white mb-1 tracking-tight">
              No items match your filter
            </h3>
            <p className="text-[13px] text-zinc-400 mb-6 leading-relaxed tracking-tight">
              {searchQuery
                ? `No products matching "${searchQuery}". Try a different keyword or reset filters.`
                : 'Be the first student on your campus to list this gear and help your batchmates.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2.5 rounded-full border border-white/20 bg-[#181D14] text-[12px] font-medium text-white hover:bg-[#222A1C] transition-colors"
                >
                  Reset Filters
                </button>
              )}
              <Link
                to="/sell"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[12px] shadow-[0_0_12px_rgba(198,222,65,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                <Tag className="w-4 h-4" />
                <span>Sell Pre-Loved Gear</span>
              </Link>
            </div>
          </div>
        ) : (

          
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredProducts.map((product, index) => (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 45, filter: "blur(6px)" }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.7,
        delay: Math.min(index % 3, 2) * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Tilt3DCard>
        <ProductCard
          product={product}
          userCollegeCode={activeCollege?.code}
        />
      </Tilt3DCard>
    </motion.div>
  ))}
</div>


        )}
      </div>
    </div>
  );
};
