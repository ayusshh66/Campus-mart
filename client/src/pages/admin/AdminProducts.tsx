import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAdminError,
  useAdminFeedback,
} from '../../hooks/useAdminNotifications';
import { api, Product } from '../../services/api';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  ChevronDown,
  FileImage,
  FilterX,
  ImagePlus,
  Info,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';

type QualityOption = {
  label: string;
  description?: string;
  deduction: number;
};
type QualityQuestion = {
  id: string;
  question: string;
  options: QualityOption[];
};
type CatalogProduct = Product & {
  images: string[];
  quality_questions: QualityQuestion[];
};
type ProductForm = {
  name: string;
  category: string;
  description: string;
  images: string[];
  buy_price: number;
  upto_buy_price: number;
  sell_price: number;
  is_buying_enabled: boolean;
  is_active: boolean;
  quality_questions: QualityQuestion[];
};
type Feedback = { kind: 'success' | 'error'; message: string } | null;
type CatalogFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type BuyingFilter = 'ALL' | 'BUYING' | 'PAUSED';

interface Props {
  /** Retained for compatibility with the previous AdminDashboard. */
  onAddClick?: () => void;
  forceNewForm?: boolean;
  onSaved?: () => void;
  onCloseForm?: () => void;
}

const calculatorQuestions: QualityQuestion[] = [
  {
    id: 'q_power',
    question: 'Does the calculator power on and work correctly?',
    options: [
      { label: 'Works perfectly', description: 'All keys, display and functions work', deduction: 0 },
      { label: 'Minor issue', description: 'Weak battery or worn keys', deduction: 40 },
      { label: 'Major issue', description: 'Display or power requires repair', deduction: 120 },
    ],
  },
  {
    id: 'q_screen',
    question: 'What is the screen and body condition?',
    options: [
      { label: 'Like new', description: 'No noticeable scratches', deduction: 0 },
      { label: 'Light wear', description: 'Small cosmetic scratches', deduction: 30 },
      { label: 'Visible damage', description: 'Deep scratches or marks', deduction: 70 },
    ],
  },
  {
    id: 'q_cover',
    question: 'Is the original cover or accessory included?',
    options: [
      { label: 'Included', deduction: 0 },
      { label: 'Missing', deduction: 50 },
    ],
  },
];

const bookQuestions: QualityQuestion[] = [
  {
    id: 'q_binding',
    question: 'What is the condition of the cover and binding?',
    options: [
      { label: 'Like new', deduction: 0 },
      { label: 'Light wear', deduction: 15 },
      { label: 'Visible wear', deduction: 35 },
    ],
  },
  {
    id: 'q_marks',
    question: 'Are there highlights or handwritten notes?',
    options: [
      { label: 'No markings', deduction: 0 },
      { label: 'Some pencil marks', deduction: 15 },
      { label: 'Frequent pen markings', deduction: 30 },
    ],
  },
  {
    id: 'q_pages',
    question: 'Are all pages present and intact?',
    options: [
      { label: 'Complete', deduction: 0 },
      { label: 'Loose or damaged pages', deduction: 25 },
    ],
  },
];

const DEFAULT_CATEGORIES = [
  'Calculator', 'Books', 'Electronics', 'Lab Equipment',
  'Drafters & Engineering Kits', 'Stationery', 'Other',
];

const currency = (value: number | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const safeJSONList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

// Existing Prisma backend stores both arrays as JSON-encoded TEXT.
const normalizeProduct = (item: Product): CatalogProduct => ({
  ...item,
  images: safeJSONList<string>((item as any).images),
  quality_questions: safeJSONList<QualityQuestion>((item as any).quality_questions),
});

const emptyForm = (): ProductForm => ({
  name: '',
  category: 'Calculator',
  description: '',
  images: [],
  buy_price: 500,
  upto_buy_price: 650,
  sell_price: 750,
  is_buying_enabled: true,
  is_active: true,
  quality_questions: calculatorQuestions.map((q) => ({
    ...q, options: q.options.map((option) => ({ ...option })),
  })),
});

const fromProduct = (p: CatalogProduct): ProductForm => ({
  name: p.name,
  category: p.category,
  description: p.description,
  images: p.images.length ? [...p.images] : p.image_url ? [p.image_url] : [],
  buy_price: Number(p.buy_price) || 0,
  upto_buy_price: Number(p.upto_buy_price ?? p.buy_price) || 0,
  sell_price: Number(p.sell_price) || 0,
  is_buying_enabled: Boolean(p.is_buying_enabled),
  is_active: Boolean(p.is_active),
  quality_questions: p.quality_questions.map((q) => ({
    ...q, options: q.options.map((o) => ({ ...o })),
  })),
});

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#0B0D0A] px-3.5 py-2.5 text-sm text-[#F5F7F0] outline-none placeholder:text-[#656C61] focus:border-[#C6DE41]/70';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#B4BBAE]';
const panelClass = 'rounded-2xl border border-white/10 bg-[#181D14] p-4 sm:p-5';

const metricItems = (
  total: number,
  active: number,
  accepting: number,
  paused: number
) => [
    { title: 'Total SKU Listings', value: total, caption: 'Products in the master catalog', color: '#C6DE41', denominator: total },
    { title: 'Active on Storefront', value: active, caption: 'Visible student listings', color: '#C6DE41', denominator: total },
    { title: 'Active Buyback Engine', value: accepting, caption: 'Currently accepting sell requests', color: '#C6DE41', denominator: total },
    { title: 'Buying Paused', value: paused, caption: 'Products not accepting new intake', color: '#FBBF24', denominator: total },
  ];

export const AdminProducts: React.FC<Props> = ({ forceNewForm = false, onSaved, onCloseForm }) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] =
    useAdminError('Unable to load product catalog'); const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<CatalogFilter>('ALL');
  const [buyingFilter, setBuyingFilter] = useState<BuyingFilter>('ALL');
  const [editorOpen, setEditorOpen] = useState(forceNewForm);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [formError, setFormError] =
    useAdminError('Product configuration error'); const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<CatalogProduct | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [feedback, setFeedback] =
    useAdminFeedback<Feedback>();
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await api.admin.getProducts();
      setProducts(result.map(normalizeProduct));
    } catch (error: any) {
      setLoadError(error?.message || 'Could not load the product catalog.');
    } finally {
      setLoading(false);
    }
  }, [setLoadError]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const categories = useMemo(() =>
    Array.from(new Set([...DEFAULT_CATEGORIES, ...products.map((p) => p.category)]))
      .filter(Boolean).sort((a, b) => a.localeCompare(b)), [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const haystack = `${p.name} ${p.category} ${p.description}`.toLowerCase();
    if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
    if (category !== 'ALL' && p.category !== category) return false;
    if (statusFilter === 'ACTIVE' && !p.is_active) return false;
    if (statusFilter === 'INACTIVE' && p.is_active) return false;
    if (buyingFilter === 'BUYING' && !p.is_buying_enabled) return false;
    if (buyingFilter === 'PAUSED' && p.is_buying_enabled) return false;
    return true;
  }), [products, search, category, statusFilter, buyingFilter]);

  const activeCount = products.filter((p) => p.is_active).length;
  const buyingCount = products.filter((p) => p.is_buying_enabled && p.is_active).length;
  const pausedCount = products.filter((p) => !p.is_buying_enabled).length;

  const showSuccess = (message: string) => setFeedback({ kind: 'success', message });
  const showError = (message: string) => setFeedback({ kind: 'error', message });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setUrlInput('');
    setFormError(null);
    setEditorOpen(true);
  };
  const openEdit = (p: CatalogProduct) => {
    setEditing(p);
    setForm(fromProduct(p));
    setUrlInput('');
    setFormError(null);
    setEditorOpen(true);
  };
  const closeEditor = () => {
    if (saving || uploading) return;
    setEditorOpen(false);
    setFormError(null);
    if (forceNewForm && onCloseForm) onCloseForm();
  };

  const updateForm = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const imageUrls = form.images.map((url) => url.trim()).filter(Boolean);
    if (form.name.trim().length < 2) return setFormError('Enter a product name with at least two characters.');
    if (!form.category.trim()) return setFormError('Choose a product category.');
    if (!form.description.trim()) return setFormError('Enter a product description.');
    if (!imageUrls.length) return setFormError('Upload or add at least one product image.');
    if (![form.buy_price, form.upto_buy_price, form.sell_price].every((n) => Number.isFinite(n) && n > 0)) {
      return setFormError('All three prices must be greater than zero.');
    }
    if (form.buy_price > form.upto_buy_price) return setFormError('Base Buy Price cannot exceed Maximum Buy Price.');
    for (const question of form.quality_questions) {
      if (!question.question.trim() || question.options.length < 2) {
        return setFormError('Each quality question needs text and at least two answer options.');
      }
      if (question.options.some((option) => !option.label.trim() || !Number.isFinite(option.deduction) || option.deduction < 0)) {
        return setFormError('Quality answer labels are required and deductions cannot be negative.');
      }
    }
    const payload = {
      name: form.name.trim(), category: form.category.trim(), description: form.description.trim(),
      image_url: imageUrls[0], images: imageUrls,
      buy_price: form.buy_price, upto_buy_price: form.upto_buy_price, sell_price: form.sell_price,
      is_active: form.is_active, is_buying_enabled: form.is_buying_enabled,
      quality_questions: form.quality_questions,
    };
    setSaving(true);
    try {
      if (editing) await api.admin.updateProduct(editing.id, payload);
      else await api.admin.createProduct(payload);
      setEditorOpen(false);
      showSuccess(`Product ${editing ? 'updated' : 'created'} successfully.`);
      await loadProducts();
      onSaved?.();
    } catch (error: any) {
      setFormError(error?.message || 'Unable to save the product.');
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setFormError(null);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) throw new Error('Please select image files only.');
        const result = await api.uploadImage(file);
        if (!result?.url) throw new Error(`Upload succeeded without a URL for ${file.name}.`);
        urls.push(result.url);
      }
      setForm((current) => ({ ...current, images: [...current.images, ...urls] }));
    } catch (error: any) {
      if (urls.length) setForm((current) => ({ ...current, images: [...current.images, ...urls] }));
      setFormError(error?.message || 'Image upload failed. Please retry.');
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const value = urlInput.trim();
    if (!value) return;
    if (!value.startsWith('/') && !/^https?:\/\//i.test(value)) {
      setFormError('Image URL must start with https://, http://, or /.');
      return;
    }
    updateForm('images', [...form.images, value]);
    setUrlInput('');
    setFormError(null);
  };

  const updateQuestion = (index: number, update: Partial<QualityQuestion>) => {
    const next = form.quality_questions.map((q, i) => i === index ? { ...q, ...update } : q);
    updateForm('quality_questions', next);
  };
  const updateOption = (qi: number, oi: number, update: Partial<QualityOption>) => {
    const next = form.quality_questions.map((q, i) => i === qi ? {
      ...q,
      options: q.options.map((option, j) => j === oi ? { ...option, ...update } : option),
    } : q);
    updateForm('quality_questions', next);
  };
  const addQuestion = () => updateForm('quality_questions', [
    ...form.quality_questions,
    {
      id: `q_${Date.now()}`, question: '', options: [
        { label: '', deduction: 0 }, { label: '', deduction: 0 },
      ]
    },
  ]);
  const loadTemplate = (kind: 'calculator' | 'book') => {
    if (form.quality_questions.length && !window.confirm('Replace the current quality questions with this template?')) return;
    const source = kind === 'book' ? bookQuestions : calculatorQuestions;
    updateForm('quality_questions', source.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) })));
  };

  const toggle = async (p: CatalogProduct, field: 'is_active' | 'is_buying_enabled', value: boolean) => {
    setBusyId(p.id);
    try {
      await api.admin.updateProduct(p.id, { [field]: value });
      await loadProducts();
      showSuccess(`${p.name}: ${field === 'is_active' ? (value ? 'listing activated' : 'listing deactivated') : (value ? 'buying enabled' : 'buying paused')}.`);
    } catch (error: any) {
      showError(error?.message || 'Unable to update the product.');
    } finally {
      setBusyId(null);
    }
  };
  const deactivate = async () => {
    if (!confirmDeactivate || confirmPhrase !== 'DEACTIVATE') return;
    const p = confirmDeactivate;
    setBusyId(p.id);
    try {
      await api.admin.updateProduct(p.id, { is_active: false });
      await loadProducts();
      setConfirmDeactivate(null);
      setConfirmPhrase('');
      showSuccess(`${p.name} has been deactivated.`);
    } catch (error: any) {
      showError(error?.message || 'Unable to deactivate product.');
    } finally {
      setBusyId(null);
    }
  };
  const clearFilters = () => { setSearch(''); setCategory('ALL'); setStatusFilter('ALL'); setBuyingFilter('ALL'); };

  const exportCSV = () => {
    const cells = (values: Array<string | number | boolean>) => values.map((v) => {
      const raw = String(v);
      // Prevent CSV spreadsheet formula injection from student-controlled text.
      const safe = /^[\s]*[=+@-]/.test(raw) && typeof v === 'string' ? `\'${raw}` : raw;
      return `"${safe.replace(/"/g, '""')}"`;
    }).join(',');
    const lines = [
      cells(['ID', 'Product', 'Category', 'Base buy price', 'Maximum buy price', 'Selling price', 'Active', 'Buying enabled']),
      ...filtered.map((p) => cells([p.id, p.name, p.category, p.buy_price, p.upto_buy_price ?? p.buy_price, p.sell_price, Boolean(p.is_active), Boolean(p.is_buying_enabled)])),
    ];
    const blob = new Blob(['\ufeff', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campusmart-product-catalog.csv';
    document.body.appendChild(link);
    link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6 text-[#F5F7F0]">
      {/* Catalog header: matches Stitch catalog-management screen. */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#C6DE41]">
            Catalog Operations <span className="mx-1 text-[#777F70]">•</span> CampusMart Marketplace
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[34px]">Product Catalog</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#AAB2A4]">
            Manage campus inventory, valuations, quality checks, and student storefront availability.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button type="button" onClick={exportCSV} disabled={!filtered.length} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#1C211A] px-4 py-3 text-xs font-bold transition hover:bg-[#293026] disabled:opacity-40">
            <ArrowDownToLine className="h-4 w-4" /> Export Catalog (CSV)
          </button>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#C6DE41] px-5 py-3 text-xs font-extrabold text-[#0B0D08] transition hover:bg-[#D7EF59]">
            <Plus className="h-4 w-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Live database metrics – no hardcoded example values from the Stitch export. */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metricItems(products.length, activeCount, buyingCount, pausedCount).map((metric) => (
          <div key={metric.title} className="flex min-h-[156px] flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#181D14] p-4 sm:p-5">
            <div className="text-[11px] font-semibold text-[#B5BDAE]">{metric.title}</div>
            <div>
              <div className="text-3xl font-extrabold tabular-nums tracking-tight">{loading ? '—' : metric.value}</div>
              <p className="mt-1 min-h-[30px] text-[11px] leading-4 text-[#929C8D]">{metric.caption}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#30362E]">
                <div className="h-full rounded-full transition-all" style={{ width: `${metric.denominator ? (metric.value / metric.denominator) * 100 : 0}%`, background: metric.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#181D14] p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E9689]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalog by title, category or description" aria-label="Search products" className={`${inputClass} h-11 pl-9`} />
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category" className={`${inputClass} h-11 w-full sm:w-auto sm:min-w-[150px]`}>
          <option value="ALL">All Categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CatalogFilter)} aria-label="Filter by listing status" className={`${inputClass} h-11 w-full sm:w-auto sm:min-w-[155px]`}>
          <option value="ALL">Storefront: All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
        </select>
        <select value={buyingFilter} onChange={(event) => setBuyingFilter(event.target.value as BuyingFilter)} aria-label="Filter by buying status" className={`${inputClass} h-11 w-full sm:w-auto sm:min-w-[150px]`}>
          <option value="ALL">Intake Status: All</option><option value="BUYING">Accepting</option><option value="PAUSED">Paused</option>
        </select>
        <button type="button" onClick={clearFilters} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#292F27] px-4 text-xs font-semibold text-[#D5D9D0] transition hover:bg-[#384034]">
          <FilterX className="h-4 w-4" /> Reset
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#ABB4A5]">
        <span>Showing <strong className="text-white">{loading ? '—' : filtered.length}</strong> of {products.length} products</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C6DE41]" /> Data loaded from CampusMart admin API</span>
      </div>

      {feedback && (
        <div role={feedback.kind === 'error' ? 'alert' : 'status'} className={`fixed right-4 top-24 z-[145] flex w-[min(380px,calc(100vw-2rem))] items-start justify-between gap-3 rounded-xl border bg-[#1B2419] p-4 text-sm shadow-2xl ${feedback.kind === 'success' ? 'border-[#C6DE41]/40 text-[#D9ED83]' : 'border-rose-400/40 text-rose-200'}`}>
          <div className="flex items-start gap-2">{feedback.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}{feedback.message}</div>
          <button aria-label="Dismiss message" type="button" onClick={() => setFeedback(null)} className="shrink-0"><X className="h-4 w-4" /></button>
        </div>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-[#181D14] p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-rose-300" />
          <p className="mb-4 text-sm text-rose-200">{loadError}</p>
          <button type="button" onClick={() => void loadProducts()} className="inline-flex items-center gap-2 rounded-xl bg-[#C6DE41] px-4 py-2 text-xs font-bold text-[#090B09]"><RefreshCcw className="h-4 w-4" /> Retry</button>
        </div>
      ) : loading ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#181D14] p-4" aria-label="Loading products">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="mb-3 flex animate-pulse items-center gap-3 border-b border-white/5 pb-3"><div className="h-12 w-12 rounded-lg bg-[#343B2E]" /><div className="h-4 flex-1 rounded bg-[#343B2E]" /><div className="hidden h-4 w-16 rounded bg-[#343B2E] sm:block" /></div>)}
        </div>
      ) : !filtered.length ? (
        <div className="rounded-2xl border border-white/10 bg-[#181D14] p-10 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-[#C6DE41]" />
          <h3 className="text-lg font-bold">No products match your filters</h3>
          <p className="mt-1 text-sm text-[#9AA493]">{products.length ? 'Try resetting the search or status filters.' : 'Create your first catalog product to get started.'}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={clearFilters} className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold">Clear Filters</button>
            {!products.length && <button type="button" onClick={openCreate} className="rounded-lg bg-[#C6DE41] px-4 py-2 text-xs font-bold text-[#090B09]">Add Product</button>}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop: Stitch-style information-dense catalog table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-[#181D14] md:block">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[970px] w-full text-left text-xs">
                <thead className="bg-[#0D100D] text-[10px] uppercase tracking-[0.05em] text-[#BBC3B2]">
                  <tr>
                    <th className="px-4 py-4 font-bold">Product Identification</th>
                    <th className="px-3 py-4 text-right font-bold">Base Buy</th>
                    <th className="px-3 py-4 text-right font-bold">Max Buy</th>
                    <th className="px-3 py-4 text-right font-bold">Storefront Price</th>
                    <th className="px-3 py-4 text-center font-bold">Buying</th>
                    <th className="px-3 py-4 text-center font-bold">Listing</th>
                    <th className="px-4 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((p) => <tr key={p.id} className="transition-colors hover:bg-[#252B22]">
                    <td className="px-4 py-3"><div className="flex min-w-[250px] items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#30382D]">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <FileImage className="m-auto mt-3 h-6 w-6 text-[#81897D]" />}
                      </div>
                      <div className="min-w-0"><div className="max-w-[340px] truncate text-[13px] font-semibold text-[#F5F7F0]" title={p.name}>{p.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#9DA694]"><span className="rounded bg-white/10 px-1.5 py-0.5">{p.category}</span><span className="font-mono opacity-70">{p.id.slice(0, 8)}</span></div>
                      </div></div></td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{currency(p.buy_price)}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-[#C6DE41]">{currency(p.upto_buy_price ?? p.buy_price)}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{currency(p.sell_price)}</td>
                    <td className="px-3 py-3 text-center"><button disabled={busyId === p.id} type="button" aria-label={`${p.is_buying_enabled ? 'Pause' : 'Enable'} buying for ${p.name}`} onClick={() => void toggle(p, 'is_buying_enabled', !p.is_buying_enabled)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition disabled:opacity-40 ${p.is_buying_enabled ? 'bg-[#C6DE41]/15 text-[#C6DE41]' : 'bg-amber-500/10 text-amber-300'}`}>{p.is_buying_enabled ? '● Accepting' : '● Paused'}</button></td>
                    <td className="px-3 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.is_active ? 'bg-[#D9E4D3]/10 text-[#DEE7D7]' : 'bg-white/5 text-[#8F988B]'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-1.5">
                      <button disabled={busyId === p.id} onClick={() => openEdit(p)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 font-bold transition hover:border-[#C6DE41]/40 hover:text-[#C6DE41]"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      {p.is_active ? <button disabled={busyId === p.id} title={`Deactivate ${p.name}`} aria-label={`Deactivate ${p.name}`} onClick={() => { setConfirmDeactivate(p); setConfirmPhrase(''); }} className="rounded-lg border border-white/10 p-1.5 text-[#AAB4A3] hover:border-rose-400/40 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                        : <button disabled={busyId === p.id} onClick={() => void toggle(p, 'is_active', true)} title={`Reactivate ${p.name}`} aria-label={`Reactivate ${p.name}`} className="rounded-lg border border-white/10 p-1.5 text-[#C6DE41] hover:border-[#C6DE41]/50"><RotateCcw className="h-3.5 w-3.5" /></button>}
                    </div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile: readable cards, same live actions */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((p) => <div key={p.id} className="rounded-xl border border-white/10 bg-[#181D14] p-4">
              <div className="mb-3 flex gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#2A3324]">{p.image_url && <img src={p.image_url} className="h-full w-full object-cover" alt="" />}</div><div className="min-w-0"><h3 className="font-bold">{p.name}</h3><span className="text-xs text-[#929C8D]">{p.category}</span></div></div>
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 py-3 text-xs"><div><div className="mb-1 text-[10px] text-[#9AA493]">Base</div>{currency(p.buy_price)}</div><div><div className="mb-1 text-[10px] text-[#9AA493]">Max</div>{currency(p.upto_buy_price ?? p.buy_price)}</div><div><div className="mb-1 text-[10px] text-[#9AA493]">Selling</div>{currency(p.sell_price)}</div></div>
              <div className="flex flex-wrap items-center justify-between gap-2"><button disabled={busyId === p.id} type="button" onClick={() => void toggle(p, 'is_buying_enabled', !p.is_buying_enabled)} className="rounded-lg border border-white/10 px-2.5 py-2 text-[11px] font-bold">{p.is_buying_enabled ? 'Buying: Accepting' : 'Buying: Paused'}</button><span className="text-xs text-[#ABB4A5]">{p.is_active ? 'Active' : 'Inactive'}</span><button onClick={() => openEdit(p)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Edit</button>{p.is_active ? <button onClick={() => { setConfirmDeactivate(p); setConfirmPhrase(''); }} className="text-xs text-rose-300">Deactivate</button> : <button onClick={() => void toggle(p, 'is_active', true)} className="text-xs text-[#C6DE41]">Reactivate</button>}</div>
            </div>)}
          </div>
        </>
      )}

      {/* Stitch's add/edit drawer: wide, full height, scrollable body with fixed actions. */}
      {editorOpen && <div className="fixed inset-0 z-[120] flex justify-end" role="presentation">
        <div className="absolute inset-0 bg-black/75" onClick={closeEditor} />
        <section role="dialog" aria-modal="true" aria-labelledby="product-editor-title" className="relative flex h-full w-full max-w-[760px] flex-col border-l border-white/15 bg-[#12160F] text-[#F5F7F0] shadow-2xl">
          <div className="shrink-0 border-b border-white/10 bg-[#1A1E19] px-5 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#C6DE41]"><span className="rounded bg-[#C6DE41] px-2 py-1 text-[#15200B]">Catalog Item Configuration</span> CampusMart</div>
                <h2 id="product-editor-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">{editing ? `Edit Product: ${editing.name}` : 'Add New Catalog Product'}</h2>
                <p className="mt-1 text-[11px] text-[#A9B2A2]">{editing ? `Product ID: ${editing.id.slice(0, 12)}` : 'Configure the item before publishing it to the student storefront.'}</p>
              </div>
              <button type="button" onClick={closeEditor} aria-label="Close product editor" className="rounded-lg p-2 text-[#AFB8A8] hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
          </div>

          <form id="campusmart-product-editor-form" onSubmit={saveProduct} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-7">
              {formError && <div role="alert" className="flex gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{formError}</div>}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#D5ED73]"><SlidersHorizontal className="h-4 w-4" /> Product Information</h3>
                <div className={panelClass}>
                  <div className="mb-4"><label className={labelClass} htmlFor="catalog-product-name">Product Name & Series</label><input id="catalog-product-name" required minLength={2} value={form.name} onChange={(event) => updateForm('name', event.target.value)} className={inputClass} placeholder="e.g. Casio FX-991ES Plus" /></div>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="catalog-category">Category</label><select id="catalog-category" value={form.category} onChange={(event) => updateForm('category', event.target.value)} className={inputClass}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></div><div><label className={labelClass} htmlFor="catalog-active">Listing Visibility</label><select id="catalog-active" value={form.is_active ? 'active' : 'inactive'} onChange={(event) => updateForm('is_active', event.target.value === 'active')} className={inputClass}><option value="active">Active / Visible</option><option value="inactive">Inactive / Hidden</option></select></div></div>
                  <div><label className={labelClass} htmlFor="catalog-description">Description</label><textarea id="catalog-description" required rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} className={`${inputClass} resize-y`} placeholder="Product specifications and important details" /></div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#D5ED73]"><FileImage className="h-4 w-4" /> Product Showcase Gallery</h3>
                <div className={panelClass}>
                  <p className="mb-4 text-xs text-[#A5AEA0]">The first image is the primary storefront photo. Drag-free controls allow choosing another primary image.</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {form.images.map((url, index) => <div key={`${url}-${index}`} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-white/15 bg-[#30372B]">
                      <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                      {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-[#C6DE41] px-1.5 py-0.5 text-[9px] font-bold text-[#090B09]">Primary</span>}
                      <div className="absolute right-1 top-1 flex gap-1">
                        {index > 0 && <button type="button" title="Make primary" aria-label={`Make image ${index + 1} primary`} onClick={() => updateForm('images', [url, ...form.images.filter((_, i) => i !== index)])} className="rounded bg-black/80 p-1 text-white hover:text-[#C6DE41]"><Check className="h-3 w-3" /></button>}
                        <button type="button" title="Remove image" aria-label={`Remove image ${index + 1}`} onClick={() => updateForm('images', form.images.filter((_, i) => i !== index))} className="rounded bg-black/80 p-1 text-white hover:text-rose-300"><X className="h-3 w-3" /></button>
                      </div>
                    </div>)}
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-[#10150E] text-[#BCC5B6] hover:border-[#C6DE41]/70">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                      <span className="text-[10px] font-semibold">{uploading ? 'Uploading' : 'Upload'}</span>
                      <input type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => { void uploadImages(event.target.files); event.target.value = ''; }} className="sr-only" />
                    </label>
                  </div>
                  <div className="flex gap-2"><input aria-label="Image URL" value={urlInput} onChange={(event) => setUrlInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImageUrl(); } }} placeholder="Or paste an image URL" className={`${inputClass} flex-1`} /><button type="button" onClick={addImageUrl} className="rounded-xl border border-[#C6DE41]/30 px-3 text-xs font-bold text-[#C6DE41]">Add URL</button></div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#D5ED73]"><ShieldCheck className="h-4 w-4" /> Pricing Configuration</h3>
                <div className={panelClass}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div><label className={labelClass} htmlFor="base-buy">Base Buy (₹)</label><input id="base-buy" type="number" min="0.01" step="0.01" value={form.buy_price} onChange={(event) => updateForm('buy_price', Number(event.target.value))} className={inputClass} /></div>
                    <div><label className={labelClass} htmlFor="max-buy">Maximum Buy (₹)</label><input id="max-buy" type="number" min="0.01" step="0.01" value={form.upto_buy_price} onChange={(event) => updateForm('upto_buy_price', Number(event.target.value))} className={inputClass} /></div>
                    <div><label className={labelClass} htmlFor="sell-price">Selling Price (₹)</label><input id="sell-price" type="number" min="0.01" step="0.01" value={form.sell_price} onChange={(event) => updateForm('sell_price', Number(event.target.value))} className={inputClass} /></div>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#A4AD9D]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C6DE41]" /> These are catalog pricing inputs. Actual student payouts and margins can differ depending on inspection, matching and operations.</p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-base font-bold text-[#D5ED73]"><SlidersHorizontal className="h-4 w-4" /> Quality Questionnaire Builder</h3><div className="flex flex-wrap gap-2"><button type="button" onClick={() => loadTemplate('calculator')} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-[#B5BEB0]">Calculator template</button><button type="button" onClick={() => loadTemplate('book')} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-[#B5BEB0]">Book template</button></div></div>
                <div className="space-y-3">
                  {form.quality_questions.map((q, qi) => <div key={q.id} className={panelClass}>
                    <div className="mb-3 flex items-center gap-2"><span className="rounded-md bg-[#C6DE41]/10 px-2 py-1 text-[10px] font-extrabold text-[#C6DE41]">Q{qi + 1}</span><input aria-label={`Question ${qi + 1}`} value={q.question} onChange={(event) => updateQuestion(qi, { question: event.target.value })} placeholder="Question text" className={`${inputClass} flex-1`} /><button type="button" aria-label={`Delete question ${qi + 1}`} onClick={() => updateForm('quality_questions', form.quality_questions.filter((_, i) => i !== qi))} className="rounded-lg p-2 text-[#AAB0A4] hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div>
                    <div className="space-y-2">
                      {q.options.map((option, oi) => <div key={oi} className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-12 sm:col-span-5"><input aria-label={`Question ${qi + 1} option ${oi + 1} label`} value={option.label} onChange={(event) => updateOption(qi, oi, { label: event.target.value })} placeholder="Answer option" className={inputClass} /></div>
                        <div className="col-span-7 sm:col-span-4"><input aria-label={`Question ${qi + 1} option ${oi + 1} description`} value={option.description || ''} onChange={(event) => updateOption(qi, oi, { description: event.target.value })} placeholder="Description (optional)" className={inputClass} /></div>
                        <div className="col-span-4 sm:col-span-2"><input aria-label={`Question ${qi + 1} option ${oi + 1} deduction in rupees`} type="number" min="0" step="1" value={option.deduction} onChange={(event) => updateOption(qi, oi, { deduction: Number(event.target.value) })} className={inputClass} title="Deduction (₹)" /></div>
                        <button type="button" aria-label={`Remove option ${oi + 1}`} onClick={() => updateQuestion(qi, { options: q.options.filter((_, i) => i !== oi) })} className="col-span-1 flex justify-center text-[#9EA79B] hover:text-rose-300"><X className="h-4 w-4" /></button>
                      </div>)}
                    </div>
                    <button type="button" onClick={() => updateQuestion(qi, { options: [...q.options, { label: '', description: '', deduction: 0 }] })} className="mt-3 flex items-center gap-1 text-xs font-bold text-[#C6DE41]"><Plus className="h-3.5 w-3.5" /> Add answer option</button>
                  </div>)}
                  <button type="button" onClick={addQuestion} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#C6DE41]/35 px-4 py-3 text-xs font-bold text-[#C6DE41] hover:bg-[#C6DE41]/10"><Plus className="h-4 w-4" /> Add Quality Question</button>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#D5ED73]"><ChevronDown className="h-4 w-4" /> Availability & Visibility</h3>
                <div className={`${panelClass} space-y-3`}>
                  <label className="flex cursor-pointer items-center justify-between gap-3"><div><div className="text-sm font-semibold">Accepting Sell Requests</div><div className="text-xs text-[#9FA998]">Allows students to submit offers for this product</div></div><input type="checkbox" checked={form.is_buying_enabled} onChange={(event) => updateForm('is_buying_enabled', event.target.checked)} className="h-5 w-5 accent-[#C6DE41]" /></label>
                  <div className="border-t border-white/10" />
                  <label className="flex cursor-pointer items-center justify-between gap-3"><div><div className="text-sm font-semibold">Active Product Listing</div><div className="text-xs text-[#9FA998]">Controls storefront visibility independently from buying</div></div><input type="checkbox" checked={form.is_active} onChange={(event) => updateForm('is_active', event.target.checked)} className="h-5 w-5 accent-[#C6DE41]" /></label>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#1A1E19] px-5 py-3 sm:px-7">
              <div className="hidden items-center gap-2 text-xs text-[#A3AEA0] sm:flex"><span className="h-2 w-2 rounded-full bg-[#C6DE41]" /> {saving ? 'Saving changes...' : 'Review changes before saving'}</div>
              <div className="ml-auto flex gap-2"><button type="button" onClick={closeEditor} disabled={saving || uploading} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/5">Cancel</button><button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-[#C6DE41] px-5 py-2.5 text-xs font-extrabold text-[#101708] hover:bg-[#D7EF59] disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Product'}</button></div>
            </div>
          </form>
        </section>
      </div>}

      {/* Safety guardrail from Stitch's third screen, backed by real is_active field. */}
      {confirmDeactivate && <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyId) setConfirmDeactivate(null); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="deactivate-title" className="w-full max-w-lg rounded-2xl border border-amber-400/20 bg-[#1C2319] p-6 text-white shadow-2xl">
          <div className="mb-4 flex items-start gap-3"><div className="rounded-xl bg-amber-500/10 p-3 text-amber-300"><AlertTriangle className="h-6 w-6" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-300">Operational Action</p><h2 id="deactivate-title" className="mt-1 text-lg font-extrabold">Deactivate “{confirmDeactivate.name}”?</h2></div></div>
          <p className="rounded-xl bg-[#101610] p-4 text-sm leading-6 text-[#BDC6B7]">This hides the product from the student catalog. It does not delete the product or its existing order history. You can reactivate it later.</p>
          <label className="mb-2 mt-4 block text-xs font-semibold text-[#CFD8C9]" htmlFor="deactivate-input">Type <strong className="text-rose-300">DEACTIVATE</strong> to confirm</label>
          <input id="deactivate-input" autoFocus value={confirmPhrase} onChange={(event) => setConfirmPhrase(event.target.value)} className={inputClass} placeholder="DEACTIVATE" />
          <div className="mt-5 flex justify-end gap-2"><button disabled={busyId === confirmDeactivate.id} type="button" onClick={() => setConfirmDeactivate(null)} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold">Keep Active</button><button disabled={confirmPhrase !== 'DEACTIVATE' || busyId === confirmDeactivate.id} type="button" onClick={() => void deactivate()} className="inline-flex items-center gap-2 rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-bold text-[#290B0B] disabled:opacity-40">{busyId === confirmDeactivate.id && <Loader2 className="h-4 w-4 animate-spin" />}Deactivate Product</button></div>
        </section>
      </div>}
    </div>
  );
};

export default AdminProducts;
