import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Product, College } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { 
  ShoppingBag, 
  MapPin, 
  Tag, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Search,
  X,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';

const CATEGORY_FILTERS = [
  'All',
  'Calculators',
  'Drafters & Engineering Kits',
  'Lab Equipment',
  'Books & Academic',
  'Electronics & Peripherals',
  'Audio & Accessories'
];

export const BuyPage: React.FC = () => {
  const { user, selectedCollegeId, setSelectedCollegeId, resetToHomeCollege, isBrowsingOtherCollege } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filters State
  const initialCategory = searchParams.get('category') || 'All';
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // Keep search params in sync if category changes
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
          if (lowerCat.includes('drafter') && !pCat.includes('draft') && !p.name.toLowerCase().includes('drafter')) {
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
    setSearchParams(searchParams);
  };

  const isFiltered = searchQuery !== '' || selectedCategory !== 'All' || onlyInStock || sortBy !== 'featured';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-soft border border-campus-primary/30 text-campus-dark text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-campus-primary" />
            <span>Verified Campus Recommerce Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-campus-dark tracking-tight">
            Buy Verified Gear on Campus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Student-circulating calculators, lab kits, drafters & electronics at{' '}
            <strong className="text-campus-dark">{activeCollege?.code || 'your college'}</strong>.
            {isBrowsingOtherCollege && user && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Browsing other campus (Home: {user.college.code})
              </span>
            )}
          </p>
        </div>

        {/* Dynamic Campus Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-campus-primary shrink-0" />
            <span className="text-slate-400">Campus:</span>
            <select
              value={selectedCollegeId || (user ? user.college.id : colleges[0]?.id || '')}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="bg-transparent font-bold text-campus-primary focus:outline-none cursor-pointer"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} {user && c.id === user.college.id ? '(My Home Campus)' : ''}
                </option>
              ))}
            </select>
          </div>

          {isBrowsingOtherCollege && (
            <button
              onClick={resetToHomeCollege}
              className="p-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center gap-1"
              title="Return to your registered home campus catalog"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Cashify-Style Search & Filter Controls Toolbar */}
      <div className="my-6 space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle">
        
        {/* Search Input & Sort Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Real-time search query input */}
          <div className="relative flex-grow w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, model (e.g. Casio fx-991, Drafter), category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: In-Stock Toggle & Sort Dropdown */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            {/* In Stock toggle button */}
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                onlyInStock
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${onlyInStock ? 'text-white' : 'text-slate-400'}`} />
              <span>In Stock Only</span>
            </button>

            {/* Price sort dropdown */}
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-campus-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          {isFiltered && (
            <button
              onClick={resetAllFilters}
              className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 shrink-0 ml-auto"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Results summary bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> items for{' '}
            <strong className="text-campus-dark font-bold">{activeCollege?.code || 'Campus'}</strong>
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-campus-primary" />
            Verified & inspected by admin
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-slate-100 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 max-w-lg mx-auto shadow-subtle">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No items match your filter
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            {searchQuery
              ? `No products matching "${searchQuery}". Try a different keyword or reset filters.`
              : 'Be the first student on your campus to list this gear and help your batchmates.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {isFiltered && (
              <button
                onClick={resetAllFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            )}
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs shadow-md shadow-campus-primary/20 transition-all"
            >
              <Tag className="w-4 h-4" />
              <span>Sell Pre-Loved Gear</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              userCollegeCode={activeCollege?.code}
            />
          ))}
        </div>
      )}
    </div>
  );
};
