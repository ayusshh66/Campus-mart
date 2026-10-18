import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Product } from '../services/api';
import { ImageUploader } from '../components/ImageUploader';
import { 
  Tag, 
  MapPin, 
  Upload, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  Banknote, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Package,
  Layers,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

interface QualityOption {
  label: string;
  description?: string;
  deduction: number;
}

interface QualityQuestion {
  id: string;
  question: string;
  options: QualityOption[];
}

export const SellPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode switcher: 'catalog' | 'custom'
  const [sellMode, setSellMode] = useState<'catalog' | 'custom'>('catalog');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Catalogue Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Selected Product & Step-by-Step State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [condition, setCondition] = useState<string>('Good');
  const [description, setDescription] = useState<string>('');
  
  // Image Upload State
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  
  // Quality Check Answers State
  const [qualityAnswers, setQualityAnswers] = useState<Record<string, QualityOption>>({});
  
  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom Item Submission State
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Books & Academic');
  const [customCondition, setCustomCondition] = useState<string>('Good');
  const [customExpectedPrice, setCustomExpectedPrice] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [customUploading, setCustomUploading] = useState<boolean>(false);
  const [customSubmitting, setCustomSubmitting] = useState<boolean>(false);
  const [customSubmittedSuccess, setCustomSubmittedSuccess] = useState<boolean>(false);
  const [customSubmittedData, setCustomSubmittedData] = useState<any>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadProducts = async () => {
      try {
        const res = await api.getProducts();
        setProducts(res.data);
      } catch (err: any) {
        setError('Failed to fetch catalog items.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [user, navigate]);

  // Categories list for filtering
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...cats];
  }, [products]);

  // Filtered products for the Catalogue view
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Active product questions (with fallback if empty)
  const activeQuestions: QualityQuestion[] = useMemo(() => {
    if (!selectedProduct) return [];
    if (selectedProduct.quality_questions && selectedProduct.quality_questions.length > 0) {
      return selectedProduct.quality_questions;
    }
    const maxVal = selectedProduct.upto_buy_price || selectedProduct.buy_price * 1.25;
    return [
      {
        id: 'q_gen_condition',
        question: 'What is the physical condition of this item?',
        options: [
          { label: 'Flawless (Like New)', description: 'Pristine condition, zero signs of use', deduction: 0 },
          { label: 'Good Condition', description: 'Normal campus wear, fully intact and clean', deduction: Math.round(maxVal * 0.08) },
          { label: 'Average Condition', description: 'Noticeable surface scratches or scuffs', deduction: Math.round(maxVal * 0.22) },
        ],
      },
      {
        id: 'q_gen_functionality',
        question: 'Does the item function properly without issues?',
        options: [
          { label: '100% Fully Functional', description: 'All keys, switches, display, and features work', deduction: 0 },
          { label: 'Minor Functional Quirk', description: 'Slight button lag or cosmetic looseness', deduction: Math.round(maxVal * 0.15) },
        ],
      },
      {
        id: 'q_gen_accessories',
        question: 'Are all original covers, cables, or accessories included?',
        options: [
          { label: 'Original Accessories / Cover Included', description: 'Protective cover or original accessories present', deduction: 0 },
          { label: 'Item Only (No Accessories)', description: 'Accessories or protective cover not included', deduction: Math.round(maxVal * 0.08) },
        ],
      },
    ];
  }, [selectedProduct]);

  // Initialize questions when product is selected
  const handleSelectProduct = (prod: Product) => {
    if (!prod.is_buying_enabled) return;
    setSelectedProduct(prod);
    setCurrentStep(0);
    setDescription('');
    setImageUrls([]);
    setError(null);

    // Initialize default answers (first option of each question)
    const initialAnswers: Record<string, QualityOption> = {};
    const questionsToUse = (prod.quality_questions && prod.quality_questions.length > 0)
      ? prod.quality_questions
      : [
          {
            id: 'q_gen_condition',
            question: 'What is the physical condition of this item?',
            options: [
              { label: 'Flawless (Like New)', description: 'Pristine condition, zero signs of use', deduction: 0 },
            ],
          },
        ];

    questionsToUse.forEach((q: QualityQuestion) => {
      if (q.options && q.options.length > 0) {
        initialAnswers[q.id] = q.options[0];
      }
    });
    setQualityAnswers(initialAnswers);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to Catalogue
  const handleBackToCatalogue = () => {
    setSelectedProduct(null);
    setCurrentStep(0);
    setError(null);
  };

  // Pricing calculation
  const maxPrice = selectedProduct?.upto_buy_price || selectedProduct?.buy_price || 0;
  const totalDeductions = Object.values(qualityAnswers).reduce((sum, item) => sum + (item.deduction || 0), 0);
  const liveEstimatedPayout = Math.max(50, Math.round(maxPrice - totalDeductions));

  const handleAnswerSelect = (questionId: string, option: QualityOption) => {
    setQualityAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  // Total steps: Questions (0 to N-1), Image Upload (N), Final Payout & Review (N+1)
  const totalQuestionSteps = activeQuestions.length;
  const imageStepIndex = totalQuestionSteps;
  const finalReviewStepIndex = totalQuestionSteps + 1;
  const totalStepsCount = totalQuestionSteps + 2;

  const handleNextStep = () => {
    if (currentStep < finalReviewStepIndex) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 0) {
      handleBackToCatalogue();
    } else {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    setError(null);

    try {
      const finalImages = imageUrls.length > 0 
        ? imageUrls 
        : (selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image_url]);

      const formattedQualityAnswers: Record<string, string> = {};
      Object.entries(qualityAnswers).forEach(([qid, opt]) => {
        formattedQualityAnswers[qid] = opt.label;
      });

      await api.submitSellRequest({
        product_id: selectedProduct.id,
        condition,
        description: description.trim() || undefined,
        images: finalImages,
        quality_answers: formattedQualityAnswers,
        estimated_price: liveEstimatedPayout,
      });

      setSubmittedData({
        productName: selectedProduct.name,
        estimatedPayout: liveEstimatedPayout,
        collegeCode: user?.college.code,
        imageCount: finalImages.length,
      });
      setSubmittedSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit sell request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    if (!customName.trim()) {
      setCustomError('Please enter the item name.');
      return;
    }
    const price = parseFloat(customExpectedPrice);
    if (isNaN(price) || price <= 0) {
      setCustomError('Please enter a valid expected cash price (greater than ₹0).');
      return;
    }
    if (customDescription.trim().length < 5) {
      setCustomError('Please provide a brief description (at least 5 characters).');
      return;
    }
    if (customImages.length === 0) {
      setCustomError('Please upload at least 1 photo of your item (1 to 5 photos supported).');
      return;
    }

    setCustomSubmitting(true);
    try {
      await api.submitCustomSellRequest({
        name: customName.trim(),
        category: customCategory,
        condition: customCondition,
        description: customDescription.trim(),
        expected_price: price,
        images: customImages,
      });

      setCustomSubmittedData({
        name: customName.trim(),
        category: customCategory,
        condition: customCondition,
        expectedPrice: price,
        collegeCode: user?.college.code,
        imageCount: customImages.length,
      });
      setCustomSubmittedSuccess(true);
    } catch (err: any) {
      setCustomError(err.message || 'Failed to submit custom sell request.');
    } finally {
      setCustomSubmitting(false);
    }
  };

  if (!user) return null;

  // View: Success Screen for Catalog Sell Request
  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-card">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-campus-dark mb-2">
            Sell Request Submitted!
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your request for <strong className="text-slate-900">{submittedData?.productName}</strong> has been submitted.
            Our {submittedData?.collegeCode} Campus Hero will verify your item during on-campus handover.
          </p>

          <div className="inline-flex flex-col items-center p-5 rounded-2xl bg-campus-soft border border-campus-primary/30 mb-8 w-full max-w-xs mx-auto">
            <span className="text-[11px] uppercase font-bold text-slate-500">Approximate Amount You Will Get</span>
            <span className="text-3xl font-extrabold text-campus-dark mt-1">
              ₹{submittedData?.estimatedPayout.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1">
              📍 Handover at {submittedData?.collegeCode} Campus
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/profile"
              className="px-6 py-3 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md transition-all"
            >
              View in My Profile
            </Link>
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setSelectedProduct(null);
                setCurrentStep(0);
                setDescription('');
                setImageUrls([]);
              }}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Sell Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View: Success Screen for Custom Item Submission
  if (customSubmittedSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center animate-fade-in">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-card">
          <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800 inline-block mb-3">
            Pending Admin Review
          </span>
          <h2 className="text-2xl font-extrabold text-campus-dark mb-2">
            Custom Item Submitted!
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your submission for <strong className="text-slate-900">{customSubmittedData?.name}</strong> has been received by our campus operations team.
          </p>

          <div className="inline-flex flex-col items-center p-5 rounded-2xl bg-purple-50/60 border border-purple-200/80 mb-8 w-full max-w-sm mx-auto space-y-2">
            <div className="flex items-center justify-between w-full text-xs text-slate-600 border-b border-purple-100 pb-2">
              <span>Category:</span>
              <strong className="text-slate-900">{customSubmittedData?.category}</strong>
            </div>
            <div className="flex items-center justify-between w-full text-xs text-slate-600 border-b border-purple-100 pb-2">
              <span>Condition:</span>
              <strong className="text-slate-900">{customSubmittedData?.condition}</strong>
            </div>
            <div className="flex items-center justify-between w-full text-xs text-slate-600 border-b border-purple-100 pb-2">
              <span>Your Asking Price:</span>
              <strong className="text-purple-700 text-base font-extrabold">₹{customSubmittedData?.expectedPrice.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center justify-between w-full text-xs text-slate-600 pt-1">
              <span>Campus Handover:</span>
              <strong className="text-campus-primary font-bold">📍 {customSubmittedData?.collegeCode}</strong>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 text-left mb-6 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>What happens next?</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              1. An admin will inspect your photos, condition grade, and expected price.<br />
              2. Once approved, the item will immediately be published to the <strong>{customSubmittedData?.collegeCode} Campus Marketplace</strong> for students to purchase.<br />
              3. You can monitor the review progress in your Profile under <strong>Custom Submissions</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/profile"
              className="px-6 py-3 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white text-xs font-bold shadow-md transition-all"
            >
              Track in My Profile
            </Link>
            <button
              onClick={() => {
                setCustomSubmittedSuccess(false);
                setCustomName('');
                setCustomExpectedPrice('');
                setCustomDescription('');
                setCustomImages([]);
                setCustomError(null);
              }}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Submit Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* ============================================================== */}
      {/* VIEW 1: CATALOGUE OR CUSTOM SELLING VIEW (When not in step-by-step) */}
      {/* ============================================================== */}
      {!selectedProduct && (
        <div className="space-y-8">
          {/* Top Mode Switcher Tabs */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl max-w-md">
            <button
              type="button"
              onClick={() => setSellMode('catalog')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                sellMode === 'catalog'
                  ? 'bg-white text-campus-dark shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4 text-campus-primary" />
              <span>Catalog Items</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold hidden sm:inline">Instant Quote</span>
            </button>
            <button
              type="button"
              onClick={() => setSellMode('custom')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                sellMode === 'custom'
                  ? 'bg-white text-campus-dark shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Sell Any Custom Item</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold hidden sm:inline">Sell Anything</span>
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* OPTION A: SELL ANY CUSTOM ITEM                               */}
          {/* ------------------------------------------------------------ */}
          {sellMode === 'custom' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Community Campus Marketplace</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Sell Any Second-Hand Item
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xl">
                    Submit any second-hand textbooks, electronics, cycle, lab coats, drafters, or hostel items. Once reviewed, an admin will approve your listing and publish it to the {user.college.code} campus marketplace!
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-campus-soft border border-campus-primary/30 text-campus-dark text-xs font-bold shadow-sm self-start md:self-auto shrink-0">
                  <span>Campus:</span>
                  <span className="flex items-center gap-1 text-campus-primary font-black">
                    <MapPin className="w-4 h-4" />
                    {user.college.code}
                  </span>
                </div>
              </div>

              <form onSubmit={handleCustomSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-subtle space-y-6">
                {customError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{customError}</span>
                    </div>
                    <button type="button" onClick={() => setCustomError(null)} className="text-rose-500 hover:text-rose-800">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Item Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Casio fx-991CW Scientific Calculator, B.Tech 1st Year Chemistry Book, Decathlon Cycle..."
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
                  />
                </div>

                {/* Category & Expected Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary font-medium"
                    >
                      <option value="Books & Academic">Books & Academic</option>
                      <option value="Electronics & Tech">Electronics & Tech</option>
                      <option value="Engineering & Lab Tools">Engineering & Lab Tools</option>
                      <option value="Cycles & Mobility">Cycles & Mobility</option>
                      <option value="Hostel & Dorm Essentials">Hostel & Dorm Essentials</option>
                      <option value="Stationery & Instruments">Stationery & Instruments</option>
                      <option value="Other Essentials">Other Essentials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Expected Cash Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={customExpectedPrice}
                        onChange={(e) => setCustomExpectedPrice(e.target.value)}
                        placeholder="e.g. 450"
                        className="w-full pl-8 pr-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary font-bold text-slate-900"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Amount you hope to get. Admin will review and lock final payout price.
                    </span>
                  </div>
                </div>

                {/* Condition Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Condition Assessment <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        value: 'Like New',
                        label: 'Like New',
                        desc: 'Pristine, almost unused, zero damage or marks.',
                      },
                      {
                        value: 'Good',
                        label: 'Good Condition',
                        desc: 'Normal campus wear, fully functional & clean.',
                      },
                      {
                        value: 'Used',
                        label: 'Used / Fair',
                        desc: 'Visible scuffs or markings, but 100% usable.',
                      },
                    ].map((c) => (
                      <div
                        key={c.value}
                        onClick={() => setCustomCondition(c.value)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          customCondition === c.value
                            ? 'border-campus-primary bg-campus-soft/40 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{c.label}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              customCondition === c.value
                                ? 'border-campus-primary bg-campus-primary text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {customCondition === c.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Description & Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g. 8th edition textbook, includes formula sheet, bought last semester for IT department. Fully clean inside."
                    className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary resize-none"
                  />
                </div>

                {/* Multi-Image Uploader (1 to 5 images) */}
                <ImageUploader
                  images={customImages}
                  onChange={setCustomImages}
                  maxImages={5}
                  minImages={1}
                  label="Photos of Item (1 to 5 photos) *"
                  helperText="Upload real photos. Click the star on any image to set it as the primary cover photo."
                />

                {/* Campus Handover Notice */}
                <div className="p-4 rounded-2xl bg-campus-soft border border-campus-primary/30 flex items-center gap-3 text-xs">
                  <MapPin className="w-5 h-5 text-campus-primary shrink-0" />
                  <div className="text-campus-dark">
                    <span className="font-bold block">Campus-Specific Handover Guaranteed</span>
                    <span className="text-[11px] text-slate-600">
                      Once approved, your item will be published to the <strong>{user.college.code} campus marketplace</strong>.
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={customSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-sm shadow-hero hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{customSubmitting ? 'Submitting Item for Review...' : 'Submit Custom Item for Listing'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* OPTION B: CATALOGUE WE ARE BUYING VIEW                       */}
          {/* ------------------------------------------------------------ */}
          {sellMode === 'catalog' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-campus-primary uppercase tracking-wider mb-2">
                    <Tag className="w-4 h-4" />
                    <span>We Are Buying Catalog</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-campus-dark tracking-tight">
                    Sell Your Campus Essentials
                  </h1>
                  <p className="text-sm text-slate-500 mt-2 max-w-xl">
                    Select the item you want to sell from our official campus inventory. 
                    Answer a quick condition assessment to receive your guaranteed cash quote.
                  </p>
                </div>

                {/* Permanent College Lock Indicator */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-campus-soft border border-campus-primary/30 text-campus-dark text-xs font-bold shadow-sm self-start md:self-auto">
                  <span>Selling on campus:</span>
                  <span className="flex items-center gap-1 text-campus-primary font-black">
                    <MapPin className="w-4 h-4" />
                    {user.college.code}
                  </span>
                </div>
              </div>

              {/* Custom Item Promo Strip */}
              <div className="bg-gradient-to-r from-campus-soft via-emerald-50/40 to-purple-50/40 rounded-2xl p-4 border border-campus-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">Selling something not listed here?</span>
                    <span className="text-[11px] text-slate-500">Submit any textbook, scientific calculator, cycle, gadgets, or dorm essentials as a custom listing!</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSellMode('custom')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                >
                  <span>Sell Custom Item</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search & Category Filter Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-grow max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search items we are buying (e.g. Casio, Math book)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-campus-primary text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalogue Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-campus-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">No items found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing your search query or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => {
                const maxVal = p.upto_buy_price || p.buy_price;

                return (
                  <div
                    key={p.id}
                    onClick={() => p.is_buying_enabled && handleSelectProduct(p)}
                    className={`bg-white rounded-3xl border transition-all flex flex-col overflow-hidden group ${
                      p.is_buying_enabled
                        ? 'border-slate-200 hover:border-campus-primary/60 hover:shadow-card cursor-pointer'
                        : 'border-slate-200/60 opacity-75'
                    }`}
                  >
                    {/* Image Area */}
                    <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          p.is_buying_enabled ? 'group-hover:scale-105' : ''
                        }`}
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-campus-dark text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                          {p.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        {p.is_buying_enabled ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                            <Check className="w-3 h-3" /> Actively Buying
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-700/90 text-white text-[10px] font-bold shadow-sm">
                            Quota Full
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-campus-primary transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Get Up To
                          </span>
                          <span className="text-2xl font-black text-campus-dark">
                            ₹{maxVal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {p.is_buying_enabled ? (
                          <button
                            type="button"
                            className="px-4 py-2.5 rounded-xl bg-campus-primary group-hover:bg-campus-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                          >
                            <span>Sell This</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-xl bg-slate-100">
                            Not Accepting
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )}

      {/* ============================================================== */}
      {/* VIEW 2: STEP-BY-STEP QUESTIONNAIRE (Next -> Next -> Image -> Payout) */}
      {/* ============================================================== */}
      {selectedProduct && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToCatalogue}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-campus-dark transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalogue</span>
            </button>

            <span className="text-xs text-slate-500 font-bold">
              Step {currentStep + 1} of {totalStepsCount}
            </span>
          </div>

          {/* Selected Item Mini-Banner */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-campus-primary uppercase tracking-wider block">
                  {selectedProduct.category}
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 truncate">
                  {selectedProduct.name}
                </h2>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Maximum Value</span>
              <span className="text-base sm:text-lg font-black text-campus-dark">
                Up to ₹{maxPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
            <div
              className="bg-campus-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / totalStepsCount) * 100}%` }}
            />
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* PHASE A: SEQUENTIAL QUESTIONS (Step 0 to N-1)           */}
          {/* -------------------------------------------------------- */}
          {currentStep < totalQuestionSteps && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
              {(() => {
                const q = activeQuestions[currentStep];
                const currentAnswer = qualityAnswers[q.id];

                return (
                  <>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-primary/10 text-campus-primary text-[11px] font-extrabold uppercase tracking-wider mb-2">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Question {currentStep + 1} of {totalQuestionSteps}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                        {q.question}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Select the option that best reflects the condition of your item.
                      </p>
                    </div>

                    {/* Option Cards */}
                    <div className="space-y-3 pt-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = currentAnswer?.label === opt.label;

                        return (
                          <button
                            type="button"
                            key={oIdx}
                            onClick={() => handleAnswerSelect(q.id, opt)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                              isSelected
                                ? 'bg-emerald-50/60 border-campus-primary ring-2 ring-campus-primary/20 shadow-sm text-campus-dark'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            {/* Custom Radio Button */}
                            <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-campus-primary bg-campus-primary'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>

                            <div className="flex-grow min-w-0">
                              <span className={`block text-sm font-bold ${isSelected ? 'text-campus-dark' : 'text-slate-900'}`}>
                                {opt.label}
                              </span>
                              {opt.description && (
                                <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                                  {opt.description}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Overall Condition Preset on First Question */}
                    {currentStep === 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          Overall Item Grade
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { grade: 'Like New', desc: 'Flawless' },
                            { grade: 'Good', desc: 'Regular wear' },
                            { grade: 'Used', desc: 'Heavy marks' },
                          ].map((item) => (
                            <button
                              type="button"
                              key={item.grade}
                              onClick={() => setCondition(item.grade)}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                condition === item.grade
                                  ? 'border-campus-primary bg-campus-soft text-campus-dark ring-2 ring-campus-primary/30 shadow-sm font-extrabold'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold'
                              }`}
                            >
                              <span className="block text-xs">{item.grade}</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>{currentStep === 0 ? 'Back to Catalog' : 'Previous'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* PHASE B: IMAGE UPLOAD STEP ("at last an image option")   */}
          {/* -------------------------------------------------------- */}
          {currentStep === imageStepIndex && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-campus-primary/10 text-campus-primary text-[11px] font-extrabold uppercase tracking-wider mb-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Step {imageStepIndex + 1}: Photos</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Upload Photos of Your Item
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload 1–4 clear photos (front, back, screen, or accessories) so our Campus Hero can quickly approve your request.
                </p>
              </div>

              {/* Enhanced ImageUploader (1 to 5 images with drag-and-drop, primary selection & validation) */}
              <ImageUploader
                images={imageUrls}
                onChange={setImageUrls}
                maxImages={5}
                minImages={1}
                label="Photos of Your Item (1 to 5 images)"
                helperText="Upload 1 to 5 clear photos. Click the star on any photo to set it as the primary cover photo."
              />

              {/* Optional Notes */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Additional Details / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Bought for 2nd semester, includes manual, no dead pixels, lightly used."
                  className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-campus-primary/30 focus:border-campus-primary resize-none"
                />
              </div>

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Previous Question</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Next: View Valuation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* PHASE C: FINAL APPROXIMATE PAYOUT & SUBMIT               */}
          {/* -------------------------------------------------------- */}
          {currentStep === finalReviewStepIndex && (
            <div className="space-y-6">
              {/* Massive Approximate Payout Card */}
              <div className="bg-gradient-to-br from-campus-dark to-[#052b24] rounded-3xl p-6 sm:p-8 text-white shadow-card border border-emerald-900/40 text-center space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-campus-light text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-campus-light" />
                  <span>Approximate Payout You Will Receive</span>
                </span>

                <div className="py-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    ₹{liveEstimatedPayout.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-xs text-emerald-200/80 font-medium mt-1">
                    Instant cash or UPI transfer upon physical verification
                  </span>
                </div>

                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Price calculated based on your responses. Zero commission or listing deductions.
                </p>
              </div>

              {/* Condition Summary Checklist Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Your Condition Summary
                </h4>

                <div className="divide-y divide-slate-100">
                  {activeQuestions.map((q, idx) => {
                    const ans = qualityAnswers[q.id];
                    return (
                      <div key={q.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className="text-slate-500 font-medium">{q.question}</span>
                        <span className="font-bold text-campus-dark flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {ans?.label || 'Not specified'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="py-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Overall Grade</span>
                    <span className="font-bold text-campus-dark">{condition}</span>
                  </div>
                  <div className="py-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Photos Attached</span>
                    <span className="font-bold text-campus-dark">
                      {imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Handover Details */}
                <div className="p-4 rounded-2xl bg-campus-soft border border-campus-primary/30 flex items-center gap-3 text-xs">
                  <MapPin className="w-5 h-5 text-campus-primary shrink-0" />
                  <div className="text-campus-dark">
                    <span className="font-bold block">Campus Handover Guarantee</span>
                    <span className="text-[11px] text-slate-600">
                      Physical inspection and payment take place on {user.college.code} campus.
                    </span>
                  </div>
                </div>

                {/* Navigation & Submit CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    <span>Back to Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-grow py-3.5 px-6 rounded-xl bg-campus-primary hover:bg-campus-primary-hover text-white font-bold text-xs sm:text-sm shadow-hero hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>
                      {submitting ? 'Submitting Request...' : `Submit Sell Request (Get ₹${liveEstimatedPayout})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
