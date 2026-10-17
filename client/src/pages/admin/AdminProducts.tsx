import React, { useEffect, useState } from 'react';
import { api, Product } from '../../services/api';
import { 
  Package, 
  PlusCircle, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export interface QuestionOption {
  label: string;
  description?: string;
  deduction: number;
}

export interface QualityQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
}

const GADGET_TEMPLATE: QualityQuestion[] = [
  {
    id: 'q_power',
    question: 'Does the device power on and work normally?',
    options: [
      { label: 'Powers On & Works Flawlessly', description: 'Boots instantly, crystal-clear LCD display', deduction: 0 },
      { label: 'Minor Response Lag / Dim Display', description: 'Buttons need firm press or faint contrast', deduction: 40 },
      { label: 'Power Issue / Weak Battery', description: 'Requires battery replacement or service', deduction: 120 },
    ],
  },
  {
    id: 'q_screen',
    question: 'What is the condition of the screen or display?',
    options: [
      { label: 'Flawless (No Scratches)', description: 'Crystal-clear screen with zero lines or spots', deduction: 0 },
      { label: 'Light Surface Scratches', description: 'Minor scuffs visible only under direct light', deduction: 30 },
      { label: 'Deep Scratches or Marks', description: 'Noticeable scratch lines or minor display flaws', deduction: 70 },
    ],
  },
  {
    id: 'q_cover',
    question: 'Is the original protective cover / cable included?',
    options: [
      { label: 'Original Cover / Cable Included', description: 'Protective hard cover or original cable included', deduction: 0 },
      { label: 'Device Only', description: 'Protective cover or cable is missing', deduction: 50 },
    ],
  },
];

const BOOK_TEMPLATE: QualityQuestion[] = [
  {
    id: 'q_cover',
    question: 'What is the condition of the book cover & binding?',
    options: [
      { label: 'Like New (Pristine)', description: 'Clean cover, unbent spine, crisp corners', deduction: 0 },
      { label: 'Good Condition', description: 'Intact binding with light shelf wear', deduction: 15 },
      { label: 'Fair (Noticeable Wear)', description: 'Cover creased or rubbed corners', deduction: 35 },
    ],
  },
  {
    id: 'q_markings',
    question: 'Are there any handwritten notes or highlights inside?',
    options: [
      { label: 'Clean Pages', description: 'Zero pencil or pen markings on any pages', deduction: 0 },
      { label: 'Light Pencil / Neat Highlights', description: 'Occasional light pencil notes or highlights', deduction: 15 },
      { label: 'Frequent Pen Markings', description: 'Solved questions or extensive ink notes', deduction: 30 },
    ],
  },
  {
    id: 'q_integrity',
    question: 'Are all pages and index complete?',
    options: [
      { label: '100% Complete & Intact', description: 'All pages, syllabus chapters, and index intact', deduction: 0 },
      { label: 'Minor Loose Page', description: 'One or two loose pages inside', deduction: 25 },
    ],
  },
];

interface Props {
  onAddClick: () => void;
  forceNewForm?: boolean;
  onSaved?: () => void;
}

export const AdminProducts: React.FC<Props> = ({ onAddClick, forceNewForm, onSaved }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(Boolean(forceNewForm));
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Calculator');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [buyPrice, setBuyPrice] = useState<number>(500);
  const [uptoBuyPrice, setUptoBuyPrice] = useState<number>(650);
  const [sellPrice, setSellPrice] = useState<number>(750);
  const [qualityQuestions, setQualityQuestions] = useState<QualityQuestion[]>(GADGET_TEMPLATE);
  const [isBuyingEnabled, setIsBuyingEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openNewForm = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Calculator');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80');
    setGalleryUrls(['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80']);
    setBuyPrice(500);
    setUptoBuyPrice(650);
    setSellPrice(750);
    setQualityQuestions(GADGET_TEMPLATE);
    setIsBuyingEnabled(true);
    setIsActive(true);
    setShowAddModal(true);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setDescription(p.description);
    setImageUrl(p.image_url);
    setGalleryUrls(p.images && p.images.length > 0 ? p.images : [p.image_url]);
    setBuyPrice(p.buy_price);
    setUptoBuyPrice(p.upto_buy_price || p.buy_price * 1.2);
    setSellPrice(p.sell_price);
    if (p.quality_questions && p.quality_questions.length > 0) {
      setQualityQuestions(p.quality_questions);
    } else {
      setQualityQuestions(p.category.toLowerCase().includes('book') ? BOOK_TEMPLATE : GADGET_TEMPLATE);
    }
    setIsBuyingEnabled(p.is_buying_enabled);
    setIsActive(Boolean(p.is_active));
    setShowAddModal(true);
  };

  const addNewQuestion = () => {
    const newQ: QualityQuestion = {
      id: `q_${Date.now()}`,
      question: 'New Condition Question',
      options: [
        { label: 'Flawless Condition', description: 'Like new, no issues', deduction: 0 },
        { label: 'Average Condition', description: 'Minor cosmetic wear', deduction: 30 },
      ],
    };
    setQualityQuestions((prev) => [...prev, newQ]);
  };

  const removeQuestion = (qIdx: number) => {
    setQualityQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  const updateQuestionPrompt = (qIdx: number, val: string) => {
    setQualityQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], question: val };
      return copy;
    });
  };

  const addOptionToQuestion = (qIdx: number) => {
    setQualityQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      q.options = [...q.options, { label: 'New Option', description: 'Option details', deduction: 20 }];
      copy[qIdx] = q;
      return copy;
    });
  };

  const updateOption = (qIdx: number, oIdx: number, field: keyof QuestionOption, val: any) => {
    setQualityQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      const opts = [...q.options];
      opts[oIdx] = { ...opts[oIdx], [field]: val };
      q.options = opts;
      copy[qIdx] = q;
      return copy;
    });
  };

  const removeOptionFromQuestion = (qIdx: number, oIdx: number) => {
    setQualityQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIdx] };
      q.options = q.options.filter((_, idx) => idx !== oIdx);
      copy[qIdx] = q;
      return copy;
    });
  };

  const handleAdminImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingImage(true);
    try {
      const res = await api.uploadImage(file);
      setGalleryUrls((prev) => [...prev, res.url]);
      if (!imageUrl) setImageUrl(res.url);
    } catch (err: any) {
      console.error('Upload failed, using local URL:', err);
      const local = URL.createObjectURL(file);
      setGalleryUrls((prev) => [...prev, local]);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeGalleryImage = (idxToRemove: number) => {
    setGalleryUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const finalImages = galleryUrls.length > 0 ? galleryUrls : [imageUrl];
      const primaryImage = finalImages[0] || imageUrl;

      if (editingProduct) {
        await api.admin.updateProduct(editingProduct.id, {
          name,
          category,
          description,
          image_url: primaryImage,
          images: finalImages,
          buy_price: buyPrice,
          upto_buy_price: uptoBuyPrice,
          sell_price: sellPrice,
          quality_questions: qualityQuestions,
          is_buying_enabled: isBuyingEnabled,
          is_active: isActive,
        });
      } else {
        await api.admin.createProduct({
          name,
          category,
          description,
          image_url: primaryImage,
          images: finalImages,
          buy_price: buyPrice,
          upto_buy_price: uptoBuyPrice,
          sell_price: sellPrice,
          quality_questions: qualityQuestions,
          is_buying_enabled: isBuyingEnabled,
          is_active: isActive,
        });
      }

      setShowAddModal(false);
      await fetchProducts();
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBuying = async (product: Product) => {
    try {
      await api.admin.updateProduct(product.id, {
        is_buying_enabled: !product.is_buying_enabled,
      });
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update buying status');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.admin.updateProduct(product.id, {
        is_active: !product.is_active,
      });
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Catalog Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin controls what products exist, the fixed buying & selling prices, and whether new sell requests are accepted.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="px-4 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF9] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-4">Buy Price</th>
                <th className="py-4 px-4">Sell Price</th>
                <th className="py-4 px-4">We are Buying?</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading catalog...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No products found. Click Add New Product above.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                          <span className="text-[11px] text-slate-500">{p.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-campus-dark text-sm">₹{p.buy_price}</div>
                      {p.upto_buy_price && p.upto_buy_price > p.buy_price && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Up to ₹{p.upto_buy_price}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                      ₹{p.sell_price}
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleBuying(p)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          p.is_buying_enabled
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${p.is_buying_enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{p.is_buying_enabled ? 'YES (Accepting)' : 'NO (Paused)'}</span>
                      </button>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                          p.is_active
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openEditForm(p)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-bold text-campus-dark">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Casio FX-991ES Plus"
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 cursor-pointer"
                >
                  <option value="Calculator">Calculator</option>
                  <option value="Books">Books</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specs, functions, condition expectations..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 resize-none"
                />
              </div>

              {/* Gallery Images (Requirement 3: Multi-image product showcase) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Product Showcase Gallery ({galleryUrls.length} Images)
                  </label>
                  <span className="text-[11px] text-slate-400">Displayed on /buy/:productId</span>
                </div>

                {/* Thumbnails list */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                      <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-campus-primary flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-500 mt-0.5">
                      {uploadingImage ? '...' : '+ Upload'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or paste primary image URL (https://...)"
                    className="flex-grow p-2.5 text-xs rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl && !galleryUrls.includes(imageUrl)) {
                        setGalleryUrls((prev) => [...prev, imageUrl]);
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Pricing (Base Buy, Upto Buy, Sell Price) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Buy (₹)
                    <span className="block text-[9px] text-slate-400 font-normal">Min payout</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 text-sm font-bold rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Up To Buy (₹)
                    <span className="block text-[9px] text-slate-400 font-normal">Max payout</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={uptoBuyPrice}
                    onChange={(e) => setUptoBuyPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 text-sm font-bold rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sell Price (₹)
                    <span className="block text-[9px] text-slate-400 font-normal">Buyer pays</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 text-sm font-bold rounded-xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBuyingEnabled}
                    onChange={(e) => setIsBuyingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-campus-primary focus:ring-campus-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">We are currently buying this item?</span>
                    <span className="block text-[11px] text-slate-400">If checked, students will see it on the Sell page and can submit requests.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-campus-primary focus:ring-campus-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">Product is Active in Catalog?</span>
                    <span className="block text-[11px] text-slate-400">Visible to students in campus inventory.</span>
                  </div>
                </label>
              </div>

              {/* Condition Check Questions & Pricing Deductions Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-campus-primary" />
                      <span>Condition Questions & Deductions Builder</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configures the step-by-step diagnostic questionnaire students answer to determine payout from Up To ₹{uptoBuyPrice}.
                    </p>
                  </div>

                  {/* Template quick-loaders */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQualityQuestions(GADGET_TEMPLATE)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      + Gadget Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setQualityQuestions(BOOK_TEMPLATE)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      + Book Template
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {qualityQuestions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="p-4 rounded-2xl bg-[#F8FAF9] border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-campus-dark uppercase tracking-wider">
                          Question {qIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Question
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Question Prompt
                        </label>
                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={(e) => updateQuestionPrompt(qIdx, e.target.value)}
                          placeholder="e.g. What is the condition of the screen?"
                          className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-campus-primary"
                        />
                      </div>

                      {/* Options list */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Selectable Options & Deductions (Hidden from Student UI)
                          </span>
                          <button
                            type="button"
                            onClick={() => addOptionToQuestion(qIdx)}
                            className="text-[10px] font-bold text-campus-primary hover:underline"
                          >
                            + Add Option
                          </button>
                        </div>

                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="p-2.5 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                required
                                placeholder="Option label (e.g. Flawless)"
                                value={opt.label}
                                onChange={(e) => updateOption(qIdx, oIdx, 'label', e.target.value)}
                                className="w-full p-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-campus-primary font-medium"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                placeholder="Subtitle (e.g. No scratches)"
                                value={opt.description || ''}
                                onChange={(e) => updateOption(qIdx, oIdx, 'description', e.target.value)}
                                className="w-full p-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-campus-primary text-slate-500"
                              />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">Deduct ₹</span>
                              <input
                                type="number"
                                min={0}
                                value={opt.deduction}
                                onChange={(e) => updateOption(qIdx, oIdx, 'deduction', parseFloat(e.target.value) || 0)}
                                className="w-16 p-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-800"
                              />
                            </div>
                            <div className="sm:col-span-1 text-right">
                              {q.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOptionFromQuestion(qIdx, oIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Remove option"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addNewQuestion}
                    className="w-full py-2.5 rounded-xl border border-dashed border-campus-primary/50 text-campus-primary hover:bg-campus-soft/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Add Another Condition Question</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
