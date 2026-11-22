import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import { api } from '../../services/api';
import type { AutoMatchRule } from '../../services/api';

import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Layers,
  Package,
  RefreshCw,
  Save,
  ShieldCheck,
  Truck,
} from 'lucide-react';

type RuleDraft = Pick<
  AutoMatchRule,
  | 'auto_match_enabled'
  | 'max_campus_inventory'
  | 'require_photos_for_auto'
  | 'auto_accept_answers'
>;

const card =
  'rounded-[24px] border border-white/10 bg-[#12160F] p-5';

export const AdminAutoMatching: React.FC = () => {
  const [rules, setRules] = useState<AutoMatchRule[]>([]);
  const [drafts, setDrafts] = useState<
    Record<string, RuleDraft>
  >({});

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(
    null
  );

  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<'rules' | 'tasks'>('rules');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [products, deliveryTasks] = await Promise.all([
        api.admin.getAutoMatchRules(),
        api.admin.getDeliveryTasks().catch(() => []),
      ]);

      setRules(products);
      setTasks(deliveryTasks);

      const initial: Record<string, RuleDraft> = {};

      for (const product of products) {
        initial[product.id] = {
          auto_match_enabled: product.auto_match_enabled,
          max_campus_inventory:
            product.max_campus_inventory,
          require_photos_for_auto:
            product.require_photos_for_auto,
          auto_accept_answers:
            product.auto_accept_answers || {},
        };
      }

      setDrafts(initial);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to load auto-match rules.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateDraft = (
    productId: string,
    changes: Partial<RuleDraft>
  ) => {
    setDrafts((previous) => ({
      ...previous,
      [productId]: {
        ...previous[productId],
        ...changes,
      },
    }));
  };

  const toggleOption = (
    productId: string,
    questionId: string,
    answerLabel: string
  ) => {
    setDrafts((previous) => {
      const current = previous[productId];
      if (!current) return previous;

      const approved = current.auto_accept_answers || {};
      const selected = approved[questionId] || [];

      const updated = selected.includes(answerLabel)
        ? selected.filter((label) => label !== answerLabel)
        : [...selected, answerLabel];

      return {
        ...previous,
        [productId]: {
          ...current,
          auto_accept_answers: {
            ...approved,
            [questionId]: updated,
          },
        },
      };
    });
  };

  const saveRules = async (productId: string) => {
    const draft = drafts[productId];

    if (!draft || savingId) return;

    if (
      !Number.isInteger(draft.max_campus_inventory) ||
      draft.max_campus_inventory < 1 ||
      draft.max_campus_inventory > 100
    ) {
      toast.error(
        'Inventory limit must be between 1 and 100.'
      );
      return;
    }

    setSavingId(productId);

    try {
      await api.admin.updateAutoMatchRule(
        productId,
        draft
      );

      toast.success('Auto-approval rules saved.', {
        description:
          'Selected answers will determine whether submissions qualify for automatic approval.',
      });

      await loadData();
    } catch (error) {
      toast.error('Unable to save rules', {
        description:
          error instanceof Error
            ? error.message
            : 'Please try again.',
      });
    } finally {
      setSavingId(null);
    }
  };

  const runScan = async () => {
    if (running) return;

    setRunning(true);

    try {
      const result = await api.admin.runAutoMatchScan();

      toast.success('Auto-match scan completed.', {
        description:
          result.message ||
          'Eligible pending requests have been processed.',
      });

      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Auto-match scan failed.'
      );
    } finally {
      setRunning(false);
    }
  };

  if (loading && !rules.length) {
    return (
      <div className="rounded-3xl bg-[#12160F] p-12 text-center text-sm text-stone-400">
        Loading Auto-Match & Dispatch...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#F5F7F0]">

      {/* Header */}

      <section className="rounded-[28px] border border-[#C6DE41]/20 bg-[#12160F] p-6 md:p-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#C6DE41]">
          CampusMart Operations
        </p>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-extrabold md:text-3xl">
              Auto-Match & Dispatch
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
              Select which questionnaire answers qualify
              for auto-approval. Other submissions remain
              pending for manual review.
            </p>
          </div>

          <button
            type="button"
            disabled={running}
            onClick={runScan}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C6DE41] px-5 py-3 text-xs font-bold text-[#090B09] hover:bg-[#D7EF59] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={running ? 'animate-spin' : ''}
            />
            {running
              ? 'Scanning...'
              : 'Run Auto-Match Scan'}
          </button>
        </div>
      </section>

      {/* Tabs */}

      <div className="flex flex-wrap gap-3 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('rules')}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${tab === 'rules'
              ? 'bg-[#C6DE41] text-[#090B09]'
              : 'bg-[#181D14] text-stone-300'
            }`}
        >
          <Layers size={16} />
          Product Approval Rules ({rules.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('tasks')}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${tab === 'tasks'
              ? 'bg-[#C6DE41] text-[#090B09]'
              : 'bg-[#181D14] text-stone-300'
            }`}
        >
          <Truck size={16} />
          Delivery Tasks ({tasks.length})
        </button>
      </div>

      {/* Rules */}

      {tab === 'rules' && (
        <div className="space-y-5">

          {!rules.length && (
            <div className={card}>
              No catalog products available.
            </div>
          )}

          {rules.map((product) => {
            const draft = drafts[product.id];
            if (!draft) return null;

            const questions =
              product.quality_questions || [];

            const ready =
              questions.length > 0 &&
              questions.every(
                (question) =>
                  (
                    draft.auto_accept_answers?.[
                    question.id
                    ] || []
                  ).length > 0
              );

            const selectedCount = questions.reduce(
              (total, question) =>
                total +
                (
                  draft.auto_accept_answers?.[
                  question.id
                  ] || []
                ).length,
              0
            );

            const isSaving = savingId === product.id;

            return (
              <section
                key={product.id}
                className="space-y-5 rounded-[26px] border border-white/10 bg-[#151912] p-5 md:p-6"
              >

                {/* Product heading */}

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                    />

                    <div className="min-w-0">
                      <h3 className="text-base font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-stone-400">
                        {product.category}
                      </p>

                      <p className="mt-1 text-xs text-[#C6DE41]">
                        Admin Buy: ₹{product.buy_price}
                        {' · '}
                        Sell: ₹{product.sell_price}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={draft.auto_match_enabled}
                        onChange={(event) =>
                          updateDraft(product.id, {
                            auto_match_enabled:
                              event.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-[#C6DE41]"
                      />

                      Auto-Match Active
                    </label>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        void saveRules(product.id)
                      }
                      className="flex items-center gap-2 rounded-xl bg-[#C6DE41] px-5 py-2.5 text-xs font-bold text-[#090B09] hover:bg-[#D7EF59] disabled:opacity-50"
                    >
                      <Save size={15} />
                      {isSaving ? 'Saving...' : 'Save Rules'}
                    </button>
                  </div>
                </div>

                {/* Operational restrictions */}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className={card}>
                    <p className="mb-2 text-xs font-bold">
                      Max Campus Inventory Limit
                    </p>

                    <p className="mb-3 text-xs text-stone-400">
                      Maximum approved stock per campus.
                    </p>

                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={draft.max_campus_inventory}
                      onChange={(event) =>
                        updateDraft(product.id, {
                          max_campus_inventory:
                            Number(event.target.value),
                        })
                      }
                      className="w-24 rounded-xl border border-white/15 bg-[#090B09] px-3 py-2 text-center text-sm text-white outline-none focus:border-[#C6DE41]"
                    />
                  </div>

                  <div className={card}>
                    <p className="mb-2 text-xs font-bold">
                      Mandatory Photos
                    </p>

                    <p className="mb-3 text-xs text-stone-400">
                      Require item photos before automatic approval.
                    </p>

                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={
                          draft.require_photos_for_auto
                        }
                        onChange={(event) =>
                          updateDraft(product.id, {
                            require_photos_for_auto:
                              event.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-[#C6DE41]"
                      />
                      Require Uploaded Photos
                    </label>
                  </div>
                </div>

                {/* NEW: Read-only question selector */}

                <div className="space-y-4 border-t border-white/10 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-base font-bold text-[#C6DE41]">
                        <ClipboardCheck size={19} />
                        Auto-Approval Answer Selector
                      </h4>

                      <p className="mt-2 text-xs text-stone-400">
                        Select one or multiple eligible
                        answers for each question.
                        Questions and deductions are locked here.
                      </p>
                    </div>

                    <span className="rounded-full border border-[#C6DE41]/20 bg-[#C6DE41]/10 px-3 py-1 text-xs font-bold text-[#C6DE41]">
                      {selectedCount} answers selected
                    </span>
                  </div>

                  {questions.length === 0 && (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">
                      This product has no configured
                      questionnaire. Add questions in the
                      Product Catalog first.
                    </div>
                  )}

                  {questions.map((question, index) => {
                    const allowed =
                      draft.auto_accept_answers?.[
                      question.id
                      ] || [];

                    return (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-white/10 bg-[#181D14] p-4 md:p-5"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="rounded-lg bg-[#C6DE41]/10 px-2.5 py-1.5 text-xs font-bold text-[#C6DE41]">
                              Q{index + 1}
                            </span>

                            <div>
                              <h5 className="text-sm font-bold">
                                {question.question}
                              </h5>

                              <p className="mt-1 text-[11px] text-stone-500">
                                Choose answers eligible for
                                automatic approval.
                              </p>
                            </div>
                          </div>

                          <ShieldCheck
                            size={17}
                            className="shrink-0 text-[#C6DE41]"
                          />
                        </div>

                        <div className="grid gap-2 lg:grid-cols-2">
                          {question.options.map(
                            (option, optionIndex) => {
                              const checked =
                                allowed.includes(
                                  option.label
                                );

                              return (
                                <button
                                  key={optionIndex}
                                  type="button"
                                  aria-pressed={checked}
                                  onClick={() =>
                                    toggleOption(
                                      product.id,
                                      question.id,
                                      option.label
                                    )
                                  }
                                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${checked
                                      ? 'border-[#C6DE41] bg-[#C6DE41]/10'
                                      : 'border-white/10 bg-[#090B09] hover:border-white/25'
                                    }`}
                                >
                                  <span
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked
                                        ? 'border-[#C6DE41] bg-[#C6DE41]'
                                        : 'border-white/30'
                                      }`}
                                  >
                                    {checked && (
                                      <Check
                                        size={13}
                                        className="text-[#090B09]"
                                      />
                                    )}
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-semibold text-white">
                                      {option.label}
                                    </span>

                                    {option.description && (
                                      <span className="mt-1 block text-[11px] text-stone-400">
                                        {option.description}
                                      </span>
                                    )}

                                    <span className="mt-2 block text-[10px] text-stone-500">
                                      Fixed deduction:
                                      {' ₹'}
                                      {option.deduction}
                                    </span>
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className={`flex items-start gap-2 rounded-xl border p-4 text-xs ${ready
                        ? 'border-[#C6DE41]/25 bg-[#C6DE41]/5 text-[#DDE8B6]'
                        : 'border-amber-400/20 bg-amber-400/5 text-amber-200'
                      }`}
                  >
                    <CheckCircle2
                      size={17}
                      className="shrink-0"
                    />

                    <span>
                      {ready
                        ? 'All questions have eligible answers. A student must select an approved answer for EVERY question to qualify for auto-approval.'
                        : 'At least one question has no approved answers. Requests for this product will remain pending for manual review.'}
                    </span>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Existing delivery and Hero operations view */}

      {tab === 'tasks' && (
        <section className="space-y-4">
          {!tasks.length && (
            <div className={card}>
              <Package
                size={30}
                className="mb-3 text-[#C6DE41]"
              />
              <p className="text-sm font-semibold">
                No Delivery Tasks Yet
              </p>
              <p className="mt-2 text-xs text-stone-400">
                Approved pickup and handover tasks
                will appear here.
              </p>
            </div>
          )}

          {tasks.map((task) => (
            <div
              key={task.id}
              className={`${card} flex flex-col justify-between gap-4 lg:flex-row lg:items-center`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[#C6DE41]/10 p-3">
                  <Truck
                    size={22}
                    className="text-[#C6DE41]"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold">
                    {task.product?.name ||
                      'Campus Recommerce Item'}
                  </h3>

                  <p className="text-xs text-stone-400">
                    {task.task_type?.replace(/_/g, ' ')}
                    {' · '}
                    {task.college?.code || 'Campus'}
                  </p>

                  <p className="text-xs text-stone-300">
                    Hero:{' '}
                    {task.campus_hero?.name || 'Unassigned'}
                  </p>

                  <p className="text-xs text-[#C6DE41]">
                    Status: {task.status}
                  </p>

                  {task.quality_verified && (
                    <p className="flex items-center gap-1 text-xs text-[#C6DE41]">
                      <CheckCircle2 size={14} />
                      Quality Verified
                    </p>
                  )}

                  <p className="text-xs text-stone-500">
                    Seller: {task.seller?.name || '—'}
                    {' · '}
                    Buyer: {task.buyer?.name || '—'}
                  </p>

                  <p className="text-xs text-stone-500">
                    Messages: {task.messages?.length || 0}
                  </p>
                </div>
              </div>

              <Link
                to="/hero-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#181D14] px-4 py-2.5 text-xs font-bold hover:border-[#C6DE41]/30"
              >
                Hero Dashboard
                <ExternalLink size={14} />
              </Link>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default AdminAutoMatching;