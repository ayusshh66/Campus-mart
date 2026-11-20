import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Headphones,
  Heart,
  Keyboard,
  Search,
  ShoppingBag,
  Tag,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Product } from '../services/api';
import { resolveProductImageUrl, handleImageError } from '../utils/imageUtils';
import './GuestHome.css';

/** The existing backend owns prices and inventory; this homepage only displays them. */

const SCENE_POSITIONS = ['scene-one', 'scene-two', 'scene-three', 'scene-four'] as const;
const FEATURE_MATCHERS = [/casio|calculat/i, /math|textbook|book|note/i, /keyb|electronic/i, /earbud|headphone|audio/i];
const money = (value: number) => `₹${Number(value).toLocaleString('en-IN')}`;

function pickHeroProducts(items: Product[]): Product[] {
  const all = items.filter((item) => item.is_active !== false);
  const picked: Product[] = [];
  const take = (match: RegExp) => {
    const item = all.find((p) => !picked.some((x) => x.id === p.id) && match.test(`${p.name} ${p.category}`));
    if (item) picked.push(item);
  };
  FEATURE_MATCHERS.forEach(take);
  all.forEach((p) => { if (picked.length < 4 && !picked.some((x) => x.id === p.id)) picked.push(p); });
  return picked.slice(0, 4);
}

function ItemFallback({ item }: { item: Product }) {
  const combined = `${item.name} ${item.category}`;
  const Icon = /calculat|casio/i.test(combined)
    ? Calculator
    : /book|math|note/i.test(combined)
      ? BookOpen
      : /earbud|audio|headphone/i.test(combined)
        ? Headphones
        : Keyboard;
  return <Icon aria-hidden="true" className="h-16 w-16 text-[#C6DE41]/75" strokeWidth={1.15} />;
}

const FloatingProduct: React.FC<{ product: Product; index: number; allowNavigation: boolean }> = ({ product, index, allowNavigation }) => {
  const reducedMotion = useReducedMotion();
  const imageUrl = resolveProductImageUrl(product.image_url || product.images?.[0]);
  const photo = imageUrl ? (
    <img src={imageUrl} alt={product.name} loading={index < 2 ? 'eager' : 'lazy'} onError={handleImageError} />
  ) : <ItemFallback item={product} />;

  const content = (
    <motion.div
      animate={reducedMotion ? {} : { y: [0, index % 2 ? 9 : -9, 0] }}
      transition={{ duration: 6.5 + index * 0.8, ease: 'easeInOut', repeat: Infinity }}
      className="cm-scene-card-inner"
    >
      <div className="cm-scene-photo">{photo}</div>
      <div className="cm-scene-info">
        <strong title={product.name}>{product.name}</strong>
        {allowNavigation && <span>{money(product.sell_price)}</span>}
      </div>
      {allowNavigation && <Heart aria-hidden="true" className="cm-scene-heart" size={20} strokeWidth={1.9} />}
    </motion.div>
  );

  return (
    <div className={`cm-scene-card ${SCENE_POSITIONS[index]}`}>
      {allowNavigation ? (
        <Link to={`/buy/${product.id}`} aria-label={`View ${product.name}`} className="cm-scene-link">
          {content}
        </Link>
      ) : content}
    </div>
  );
};


const RouteCard: React.FC<{
  to: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}> = ({ to, title, subtitle, icon: Icon }) => (
  <Link to={to} className="cm-route-card group">
    <span className="cm-route-icon">
      <Icon className="h-[25px] w-[25px]" strokeWidth={1.9} />
    </span>

    <span className="cm-route-copy">
      <strong>{title}</strong>
      <small>{subtitle}</small>
    </span>

    <span className="cm-route-arrow">
      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
    </span>
  </Link>
);


export const GuestHome: React.FC = () => {
  const { selectedCollegeId } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(false);
    api.getProducts(selectedCollegeId || undefined)
      .then((result) => { if (alive) setProducts(result.data || []); })
      .catch((error) => { if (alive) { setLoadError(true); console.error('Homepage products:', error); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedCollegeId]);

  const heroProducts = useMemo(() => pickHeroProducts(products), [products]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = query.trim();
    navigate(cleaned ? `/buy?search=${encodeURIComponent(cleaned)}` : '/buy');
  };

  return (
    <div className="cm-landing relative isolate overflow-hidden bg-[#090B09] dark:bg-[#090B09] light:bg-[#F7F8F2] text-[#F5F7F0] dark:text-[#F5F7F0] light:text-[#171B13] transition-colors duration-200">
      <div className="cm-ambient cm-ambient-left" aria-hidden="true" />
      <div className="cm-ambient cm-ambient-right" aria-hidden="true" />
      <div className="cm-grain" aria-hidden="true" />

      <div className="cm-landing-content relative z-10 mx-auto max-w-[1420px] px-5 sm:px-8 lg:px-12">
        <section className="cm-top-grid" aria-label="CampusMart marketplace">
          <div className="cm-hero-copy">
              <h1>Your Campus.<br />Your <span>Next Find.</span></h1>
                <p>Pre-loved essentials. Fair prices. A stronger campus.</p>
                <form className="cm-hero-search" onSubmit={submitSearch} role="search">
                  <Search className="h-6 w-6 shrink-0 text-[#F5F7F0]" aria-hidden="true" />
                  <input
                    aria-label="Search campus items"
                    placeholder="Search for items..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <button aria-label="Search products" type="submit"><ArrowRight size={25} /></button>
                </form>
          </div>

          <div className="cm-product-scene" aria-label="Featured campus products">
            <span className="cm-scene-glow" aria-hidden="true" />
            {heroProducts.map((product, index) => (
              <FloatingProduct key={product.id} product={product} index={index} allowNavigation />
            ))}
            {loading && heroProducts.length === 0 && (
              <div className="cm-scene-loading" role="status">Loading campus gear...</div>
            )}
            {!loading && heroProducts.length === 0 && (
              <div className="cm-scene-empty">
                <ShoppingBag size={38} className="text-[#C6DE41]" />
                <strong>Discover campus gear</strong>
                <span>{loadError ? 'Catalog unavailable right now' : 'New listings coming soon'}</span>
              </div>
            )}
            <span className="cm-scribble cm-scribble-one" aria-hidden="true">↗</span>
            <span className="cm-scribble cm-scribble-two" aria-hidden="true">✳</span>
            <span className="cm-quality-note" aria-hidden="true">Quality<br />Gear<br />Lower<br />Prices</span>
          </div>
        </section>

        <section className="cm-quick-links" aria-label="Choose what you want to do">
            <RouteCard to="/buy" title="Buy" subtitle="Find what you need" icon={ShoppingBag} />
              <RouteCard to="/sell" title="Sell" subtitle="Give gear a new home" icon={Tag} />
              <RouteCard to="/teams/create" title="Make a Team" subtitle="Find your next team (coming soon)" icon={Users} />
              
        </section>

        <section className="cm-teammate-banner" aria-label="Find people to build with">
            
         
<div className="cm-team-image" aria-hidden="true">
  <img
    className="cm-team-photo"
    src="/images/campusmart-team-visual.webp"
    alt=""
    loading="lazy"
  />
</div>

          <span className="cm-team-icon" aria-hidden="true"><Users size={25} /></span>
          <div className="cm-team-content">
            <h2>Find people to <span>build with.</span></h2>
            <Link to="/find-teammates" className="cm-team-button">
              coming soon <ArrowRight className="h-[19px] w-[19px]" />
            </Link>
          </div>
        </section>

        <p className="cm-guest-hint">Explore freely. <Link to="/signup">Sign up</Link> to sell, buy or create teams.</p>
      </div>
    </div>
  );
};
