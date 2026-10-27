import { SmoothInput } from '../components/motion/SmoothInput';
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
  AlertCircle, 
  Banknote, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  Search,
  Package,
  HelpCircle,
  ChevronRight
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

  // Filtered products for Catalogue view
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
      setCustomError(err.message || 'Failed to submit custom listing.');
    } finally {
      setCustomSubmitting(false);
    }
  };

  // View: Success Screen for Catalogue Submission
  if (submittedSuccess) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center animate-fade-in">
        <div className="max-w-lg mx-auto bg-[#12160F] rounded-[28px] p-8 sm:p-12 border border-[#C6DE41]/30 shadow-[0_0_50px_rgba(198,222,65,0.1)]">
          <div className="w-16 h-16 rounded-full bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Sell Request Submitted!
          </h2>
          <p className="text-[13px] text-stone-400 leading-relaxed mb-6 tracking-tight">
            Your request for <strong className="text-white">{submittedData?.productName}</strong> has been created.
            A {submittedData?.collegeCode} Campus Hero will verify your item during on-campus handover.
          </p>

          <div className="inline-flex flex-col items-center p-5 rounded-[20px] bg-[#181D14] border border-white/10 mb-8 w-full max-w-xs mx-auto">
            <span className="text-[11px] uppercase font-semibold text-stone-400">Approximate Payout</span>
            <span className="text-3xl font-black text-[#C6DE41] mt-1 tracking-tight">
              ₹{submittedData?.estimatedPayout.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#C6DE41]/90 font-medium mt-1">
              📍 Handover at {submittedData?.collegeCode} Campus
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/profile"
              className="px-6 py-3 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[13px] font-bold shadow-[0_0_20px_rgba(198,222,65,0.25)] transition-all"
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
              className="px-6 py-3 rounded-full border border-white/15 text-stone-300 hover:text-white text-[13px] font-medium hover:bg-white/5 transition-colors"
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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center animate-fade-in">
        <div className="max-w-lg mx-auto bg-[#12160F] rounded-[28px] p-8 sm:p-12 border border-[#C6DE41]/30 shadow-[0_0_50px_rgba(198,222,65,0.1)]">
          <div className="w-16 h-16 rounded-full bg-[#C6DE41]/15 text-[#C6DE41] border border-[#C6DE41]/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <span className="text-[11px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 inline-block mb-3">
            Pending Admin Review
          </span>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Custom Item Submitted!
          </h2>
          <p className="text-[13px] text-stone-400 leading-relaxed mb-6 tracking-tight">
            Your submission for <strong className="text-white">{customSubmittedData?.name}</strong> has been received by our campus operations team.
          </p>

          <div className="inline-flex flex-col items-center p-5 rounded-[20px] bg-[#181D14] border border-white/10 mb-8 w-full max-w-sm mx-auto space-y-2">
            <div className="flex items-center justify-between w-full text-[12px] text-stone-400 border-b border-white/10 pb-2">
              <span>Category:</span>
              <strong className="text-white">{customSubmittedData?.category}</strong>
            </div>
            <div className="flex items-center justify-between w-full text-[12px] text-stone-400 border-b border-white/10 pb-2">
              <span>Condition:</span>
              <strong className="text-white">{customSubmittedData?.condition}</strong>
            </div>
            <div className="flex items-center justify-between w-full text-[12px] text-stone-400 border-b border-white/10 pb-2">
              <span>Asking Price:</span>
              <strong className="text-[#C6DE41] text-[15px] font-bold">₹{customSubmittedData?.expectedPrice.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center justify-between w-full text-[12px] text-stone-400 pt-1">
              <span>Campus Handover:</span>
              <strong className="text-white">📍 {customSubmittedData?.collegeCode}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/profile"
              className="px-6 py-3 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[13px] font-bold shadow-[0_0_20px_rgba(198,222,65,0.25)] transition-all"
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
              className="px-6 py-3 rounded-full border border-white/15 text-stone-300 hover:text-white text-[13px] font-medium hover:bg-white/5 transition-colors"
            >
              Submit Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* VIEW 1: CATALOGUE OR CUSTOM SELLING VIEW */}
      {!selectedProduct && (
        <div className="space-y-8">
          
          {/* Top Pill Mode Switcher */}
          <div className="flex p-1 bg-[#12160F] border border-white/10 rounded-full max-w-md shadow-inner">
            <button
              type="button"
              onClick={() => setSellMode('catalog')}
              className={`flex-1 py-2 px-4 rounded-full text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
                sellMode === 'catalog'
                  ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_15px_rgba(198,222,65,0.3)]'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Catalog Gear</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold hidden sm:inline ${
                sellMode === 'catalog' ? 'bg-[#090B09]/20 text-[#090B09]' : 'bg-white/10 text-stone-300'
              }`}>Instant Quote</span>
            </button>
            <button
              type="button"
              onClick={() => setSellMode('custom')}
              className={`flex-1 py-2 px-4 rounded-full text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
                sellMode === 'custom'
                  ? 'bg-[#C6DE41] text-[#090B09] shadow-[0_0_15px_rgba(198,222,65,0.3)]'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Custom Listing</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold hidden sm:inline ${
                sellMode === 'custom' ? 'bg-[#090B09]/20 text-[#090B09]' : 'bg-white/10 text-stone-300'
              }`}>Any Item</span>
            </button>
          </div>

          {/* OPTION A: SELL ANY CUSTOM ITEM */}
          {sellMode === 'custom' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[#C6DE41] uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Custom Campus Listing</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Sell Any Student Gear
                  </h2>
                  <p className="text-[13px] text-stone-400 mt-1 max-w-xl tracking-tight">
                    Submit any second-hand textbook, scientific calculator, engineering tool, or dorm gear. Our team will review and publish it to the {user?.college?.code} marketplace.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#12160F] border border-white/10 text-white text-[12px] font-medium shadow-sm shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#C6DE41]" />
                  <span>{user?.college?.code}</span>
                </div>
              </div>

              <form onSubmit={handleCustomSubmit} className="bg-[#12160F] rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
                {customError && (
                  <div className="p-4 rounded-[20px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12px] font-medium flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{customError}</span>
                    </div>
                    <button type="button" onClick={() => setCustomError(null)} className="text-rose-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Item Name */}
                <div>
                  <label className="block text-[12px] font-semibold text-stone-200 mb-1.5 tracking-tight">
                    Item Name <span className="text-[#C6DE41]">*</span>
                  </label>
                  <SmoothInput
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Casio fx-991CW Calculator, Mini Drafter, Chemistry Lab Coat..."
                    className="w-full px-4 py-2.5 text-[13px] rounded-full border border-white/15 bg-[#181D14] text-white placeholder:text-stone-500 focus:outline-none focus:border-[#C6DE41]"
                  />
                </div>

                {/* Category & Expected Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-stone-200 mb-1.5 tracking-tight">
                      Category <span className="text-[#C6DE41]">*</span>
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-4 py-2.5 text-[13px] rounded-full border border-white/15 bg-[#181D14] focus:outline-none focus:border-[#C6DE41] font-medium text-white"
                    >
                      <option value="Books & Academic" className="bg-[#12160F] text-white">Books & Academic</option>
                      <option value="Electronics & Tech" className="bg-[#12160F] text-white">Electronics & Tech</option>
                      <option value="Engineering & Lab Tools" className="bg-[#12160F] text-white">Engineering & Lab Tools</option>
                      <option value="Cycles & Mobility" className="bg-[#12160F] text-white">Cycles & Mobility</option>
                      <option value="Hostel & Dorm Essentials" className="bg-[#12160F] text-white">Hostel & Dorm Essentials</option>
                      <option value="Stationery & Instruments" className="bg-[#12160F] text-white">Stationery & Instruments</option>
                      <option value="Other Essentials" className="bg-[#12160F] text-white">Other Essentials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-stone-200 mb-1.5 tracking-tight">
                      Expected Payout Price (₹) <span className="text-[#C6DE41]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">₹</span>
                      <SmoothInput
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={customExpectedPrice}
                        onChange={(e) => setCustomExpectedPrice(e.target.value)}
                        placeholder="e.g. 450"
                        className="w-full pl-8 pr-4 py-2.5 text-[13px] rounded-full border border-white/15 bg-[#181D14] focus:outline-none focus:border-[#C6DE41] font-bold text-white placeholder:text-stone-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Condition Assessment */}
                <div>
                  <label className="block text-[12px] font-semibold text-stone-200 mb-2 tracking-tight">
                    Condition Assessment <span className="text-[#C6DE41]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'Like New', label: 'Like New', desc: 'Pristine, almost unused.' },
                      { value: 'Good', label: 'Good Condition', desc: 'Normal wear, 100% works.' },
                      { value: 'Used', label: 'Used / Fair', desc: 'Visible marks, functional.' },
                    ].map((c) => (
                      <div
                        key={c.value}
                        onClick={() => setCustomCondition(c.value)}
                        className={`p-3.5 rounded-[20px] border cursor-pointer transition-all ${
                          customCondition === c.value
                            ? 'border-[#C6DE41] bg-[#C6DE41]/10 shadow-[0_0_15px_rgba(198,222,65,0.1)]'
                            : 'border-white/10 hover:border-white/25 bg-[#181D14]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold text-[13px] ${customCondition === c.value ? 'text-[#C6DE41]' : 'text-white'}`}>{c.label}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              customCondition === c.value
                                ? 'border-[#C6DE41] bg-[#C6DE41]'
                                : 'border-white/30'
                            }`}
                          >
                            {customCondition === c.value && <div className="w-1.5 h-1.5 bg-[#090B09] rounded-full" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-400">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[12px] font-semibold text-stone-200 mb-1.5 tracking-tight">
                    Item Description <span className="text-[#C6DE41]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g. Bought last semester for IT branch. Clean, all original parts present."
                    className="w-full p-3.5 text-[13px] rounded-[20px] border border-white/15 bg-[#181D14] text-white placeholder:text-stone-500 focus:outline-none focus:border-[#C6DE41] resize-none"
                  />
                </div>

                {/* Multi-Image Uploader */}
                <ImageUploader
                  images={customImages}
                  onChange={setCustomImages}
                  maxImages={5}
                  minImages={1}
                  label="Photos of Item (1 to 5 photos) *"
                  helperText="Upload real photos. Click the star on any image to set it as the primary cover photo."
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={customSubmitting}
                  className="w-full py-4 px-6 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[14px] shadow-[0_0_25px_rgba(198,222,65,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#090B09]" />
                  <span>{customSubmitting ? 'Submitting Item for Review...' : 'Submit Custom Item for Listing'}</span>
                </button>
              </form>
            </div>
          )}

          {/* OPTION B: CATALOGUE WE ARE BUYING VIEW */}
          {sellMode === 'catalog' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[#C6DE41] uppercase tracking-wider mb-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Instant Valuation Catalog</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Sell Your Campus Essentials
                  </h1>
                  <p className="text-[13px] text-stone-400 mt-1 max-w-xl tracking-tight">
                    Select the item you want to sell from our official campus inventory. 
                    Answer a quick diagnostic questionnaire to receive your guaranteed cashout quote.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12160F] border border-white/10 text-white text-[12px] font-medium shadow-sm shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#C6DE41]" />
                  <span>Selling at {user?.college?.code}</span>
                </div>
              </div>

              {/* Custom Item Promo Strip */}
              <div className="bg-[#12160F] rounded-[28px] p-5 border border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] border border-[#C6DE41]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-white block tracking-tight">Selling something not listed here?</span>
                    <span className="text-[12px] text-stone-400 tracking-tight">Submit any second-hand book, tool, or electronics kit as a custom listing!</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSellMode('custom')}
                  className="px-4 py-2 rounded-full bg-[#181D14] hover:bg-white/10 border border-white/15 text-white text-[12px] font-semibold transition-all shrink-0 flex items-center gap-1.5"
                >
                  <span>Sell Custom Item</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C6DE41]" />
                </button>
              </div>

              {/* Search & Category Filter Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-grow max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <SmoothInput
                    type="text"
                    placeholder="Search items we are buying (e.g. Casio, Drafter)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-[13px] rounded-full border border-white/15 bg-[#12160F] text-white placeholder:text-stone-500 focus:outline-none focus:border-[#C6DE41]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#C6DE41] text-[#090B09] font-bold shadow-[0_0_12px_rgba(198,222,65,0.3)]'
                          : 'bg-[#12160F] border border-white/10 text-stone-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catalogue Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-80 bg-[#12160F] rounded-[28px] border border-white/10 p-3 animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-[#12160F] rounded-[28px] p-12 text-center border border-white/10 shadow-lg">
                  <Package className="w-12 h-12 text-stone-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-white text-base tracking-tight">No catalog items found</h3>
                  <p className="text-[12px] text-stone-400 mt-1">
                    Try searching for another keyword or submit it as a custom listing above.
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
                        className={`bg-[#12160F] rounded-[28px] p-3 border transition-all flex flex-col justify-between group shadow-lg hover:shadow-2xl ${
                          p.is_buying_enabled
                            ? 'border-white/10 hover:border-[#C6DE41]/50 cursor-pointer hover:-translate-y-1'
                            : 'border-white/5 opacity-60'
                        }`}
                      >
                        {/* 20px radius Inner Image */}
                        <div className="relative aspect-square w-full rounded-[20px] bg-[#181D14] overflow-hidden">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                              p.is_buying_enabled ? 'group-hover:scale-105' : ''
                            }`}
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2.5 py-1 rounded-full bg-[#090B09]/80 backdrop-blur-sm text-stone-200 border border-white/10 text-[11px] font-medium shadow-sm">
                              {p.category}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            {p.is_buying_enabled ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#C6DE41]/20 text-[#C6DE41] border border-[#C6DE41]/40 text-[10px] font-bold shadow-sm flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> Buying
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-black/70 text-stone-400 text-[10px] font-medium">
                                Quota Full
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="pt-3 px-1 pb-1 flex flex-col flex-grow justify-between gap-3">
                          <div>
                            <h3 className="text-[15px] font-semibold text-white group-hover:text-[#C6DE41] transition-colors tracking-tight line-clamp-1">
                              {p.name}
                            </h3>
                            <p className="text-[12px] text-stone-400 line-clamp-2 mt-0.5 leading-relaxed tracking-tight">
                              {p.description}
                            </p>
                          </div>

                          {/* Price & Action */}
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                                Get Up To
                              </span>
                              <span className="text-xl font-black text-[#C6DE41] tracking-tight">
                                ₹{maxVal.toLocaleString('en-IN')}
                              </span>
                            </div>

                            {p.is_buying_enabled ? (
                              <button
                                type="button"
                                className="px-3.5 py-1.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] text-[12px] font-bold shadow-[0_0_12px_rgba(198,222,65,0.25)] transition-all flex items-center gap-1"
                              >
                                <span>Sell This</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-500 font-medium px-3 py-1 rounded-full bg-[#181D14]">
                                Full
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

      {/* VIEW 2: STEP-BY-STEP QUESTIONNAIRE */}
      {selectedProduct && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToCatalogue}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>

            <span className="text-[12px] text-stone-400 font-medium">
              Step {currentStep + 1} of {totalStepsCount}
            </span>
          </div>

          {/* Selected Item Mini-Banner */}
          <div className="p-4 rounded-[28px] bg-[#12160F] border border-white/10 shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-12 h-12 rounded-[14px] object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#C6DE41] uppercase tracking-wider block">
                  {selectedProduct.category}
                </span>
                <h2 className="text-[14px] font-semibold text-white truncate tracking-tight">
                  {selectedProduct.name}
                </h2>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-medium text-stone-400 block">Maximum Value</span>
              <span className="text-base font-black text-[#C6DE41] tracking-tight">
                Up to ₹{maxPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full bg-[#181D14] h-1.5 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-[#C6DE41] shadow-[0_0_8px_#C6DE41] h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / totalStepsCount) * 100}%` }}
            />
          </div>

          {error && (
            <div className="p-4 rounded-[20px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12px] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PHASE A: SEQUENTIAL QUESTIONS */}
          {currentStep < totalQuestionSteps && (
            <div className="bg-[#12160F] rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-lg space-y-6">
              {(() => {
                const q = activeQuestions[currentStep];
                const currentAnswer = qualityAnswers[q.id];

                return (
                  <>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] text-[11px] font-bold uppercase tracking-wider mb-2 border border-[#C6DE41]/20">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Question {currentStep + 1} of {totalQuestionSteps}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {q.question}
                      </h3>
                      <p className="text-[12px] text-stone-400 mt-1 tracking-tight">
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
                            className={`w-full p-4 rounded-[20px] border text-left transition-all flex items-start gap-3.5 ${
                              isSelected
                                ? 'bg-[#C6DE41]/10 border-[#C6DE41] shadow-[0_0_15px_rgba(198,222,65,0.1)]'
                                : 'bg-[#181D14] border-white/10 text-white hover:border-white/25'
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[#C6DE41] bg-[#C6DE41]'
                                : 'border-white/30 bg-transparent'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-[#090B09]" />
                              )}
                            </div>

                            <div className="flex-grow min-w-0">
                              <span className={`block text-[14px] font-semibold tracking-tight ${isSelected ? 'text-[#C6DE41]' : 'text-white'}`}>
                                {opt.label}
                              </span>
                              {opt.description && (
                                <span className="block text-[12px] text-stone-400 mt-0.5 leading-snug tracking-tight">
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
                      <div className="pt-4 border-t border-white/10">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
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
                              className={`p-2.5 rounded-[16px] border text-center transition-all ${
                                condition === item.grade
                                  ? 'border-[#C6DE41] bg-[#C6DE41]/15 text-[#C6DE41] font-bold shadow-sm'
                                  : 'border-white/10 bg-[#181D14] text-stone-400 hover:text-white'
                              }`}
                            >
                              <span className="block text-[12px] font-semibold">{item.grade}</span>
                              <span className="block text-[10px] text-stone-400 mt-0.5">{item.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="px-4 py-2.5 rounded-full border border-white/15 text-stone-300 hover:text-white font-medium text-[12px] transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>{currentStep === 0 ? 'Back to Catalog' : 'Previous'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[12px] shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE B: IMAGE UPLOAD STEP */}
          {currentStep === imageStepIndex && (
            <div className="bg-[#12160F] rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-lg space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] text-[11px] font-bold uppercase tracking-wider mb-2 border border-[#C6DE41]/20">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Step {imageStepIndex + 1}: Photos</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Upload Photos of Your Item
                </h3>
                <p className="text-[12px] text-stone-400 mt-1 tracking-tight">
                  Upload 1–5 clear photos (front, back, screen, or accessories) so our Campus Hero can quickly approve your request.
                </p>
              </div>

              {/* ImageUploader */}
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
                <label className="block text-[12px] font-semibold text-stone-200 mb-1.5 tracking-tight">
                  Additional Details / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Bought for 2nd semester, includes manual, lightly used."
                  className="w-full p-3.5 text-[13px] rounded-[20px] border border-white/15 bg-[#181D14] text-white placeholder:text-stone-500 focus:outline-none focus:border-[#C6DE41] resize-none"
                />
              </div>

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="px-4 py-2.5 rounded-full border border-white/15 text-stone-300 hover:text-white font-medium text-[12px] transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[12px] shadow-[0_0_15px_rgba(198,222,65,0.25)] transition-all flex items-center gap-1.5"
                >
                  <span>View Valuation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE C: FINAL PAYOUT & SUBMIT */}
          {currentStep === finalReviewStepIndex && (
            <div className="space-y-6">
              {/* Massive Approximate Payout Card */}
              <div className="bg-[#12160F] text-white rounded-[28px] p-6 sm:p-8 text-center space-y-3 border border-[#C6DE41]/30 shadow-[0_0_40px_rgba(198,222,65,0.1)]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6DE41]/10 text-[#C6DE41] border border-[#C6DE41]/20 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Estimated Cashout Payout</span>
                </span>

                <div className="py-2">
                  <span className="text-4xl sm:text-5xl font-black text-[#C6DE41] tracking-tight">
                    ₹{liveEstimatedPayout.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[12px] text-stone-400 font-normal mt-1">
                    Instant cash or UPI transfer upon on-campus inspection
                  </span>
                </div>

                <p className="text-[12px] text-stone-400 max-w-md mx-auto leading-relaxed tracking-tight">
                  Calculated based on your verified responses. Zero hidden deductions.
                </p>
              </div>

              {/* Condition Summary Checklist Card */}
              <div className="bg-[#12160F] rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-lg space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-white">
                  Condition Summary
                </h4>

                <div className="divide-y divide-white/10">
                  {activeQuestions.map((q) => {
                    const ans = qualityAnswers[q.id];
                    return (
                      <div key={q.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-[12px] gap-1">
                        <span className="text-stone-400 font-normal">{q.question}</span>
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#C6DE41]" />
                          {ans?.label || 'Not specified'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="py-3 flex items-center justify-between text-[12px]">
                    <span className="text-stone-400 font-normal">Overall Grade</span>
                    <span className="font-semibold text-white">{condition}</span>
                  </div>
                  <div className="py-3 flex items-center justify-between text-[12px]">
                    <span className="text-stone-400 font-normal">Photos Attached</span>
                    <span className="font-semibold text-white">
                      {imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Handover Details */}
                <div className="p-4 rounded-[20px] bg-[#181D14] border border-white/10 flex items-center gap-3 text-[12px]">
                  <MapPin className="w-4 h-4 text-[#C6DE41] shrink-0" />
                  <div className="text-white">
                    <span className="font-semibold block">Campus Handover Guarantee</span>
                    <span className="text-[11px] text-stone-400">
                      Physical inspection and payment take place on {user?.college?.code} campus.
                    </span>
                  </div>
                </div>

                {/* Navigation & Submit CTA */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="px-4 py-3 rounded-full border border-white/15 text-stone-300 hover:text-white font-medium text-[12px] transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-grow py-3.5 px-6 rounded-full bg-[#C6DE41] hover:bg-[#D7EF59] text-[#090B09] font-bold text-[13px] shadow-[0_0_20px_rgba(198,222,65,0.25)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4 text-[#090B09]" />
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
