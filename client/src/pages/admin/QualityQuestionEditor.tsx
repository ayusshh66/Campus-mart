import React, { useState } from 'react';
import {
  ClipboardList,
  Pencil,
  Plus,
  Trash2,
  X,
  Save,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';

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

interface Props {
  productId: string;
  productName: string;
}

const inputClass =
  'w-full min-w-0 rounded-xl border border-white/10 ' +
  'bg-[#0B0D0A] px-3 py-3 text-sm text-[#F5F7F0] ' +
  'outline-none placeholder:text-[#656C61] ' +
  'focus:border-[#C6DE41]/70 transition-colors';

const secondaryButton =
  'flex items-center justify-center gap-2 rounded-xl ' +
  'border border-white/10 px-4 py-2.5 text-xs ' +
  'font-semibold text-[#DDE3D5] hover:bg-white/5 ' +
  'transition-colors disabled:opacity-50';

const emptyOption = (): QualityOption => ({
  label: '',
  description: '',
  deduction: 0,
});

export const QualityQuestionEditor: React.FC<Props> = ({
  productId,
  productName,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [questions, setQuestions] = useState<
    QualityQuestion[]
  >([]);

  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);

    toast.error('Questionnaire error', {
      description: message,
      duration: 6000,
      closeButton: true,
      className: 'campus-admin-error-toast',
    });
  };

  // Load the current product questionnaire.
  const openEditor = async () => {
    setLoading(true);
    setError(null);

    try {
      const product = await api.getProductById(productId);

      const raw: unknown = product.quality_questions;

      const parsed: unknown =
        typeof raw === 'string'
          ? JSON.parse(raw)
          : raw ?? [];

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid questionnaire format.');
      }

      setQuestions(
        (parsed as QualityQuestion[]).map((question) => ({
          ...question,
          options: question.options.map((option) => ({
            ...option,
          })),
        }))
      );

      setExpanded(true);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : 'Unable to load product questions.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Add a completely custom question.
  const addQuestion = () => {
    setQuestions((previous) => [
      ...previous,
      {
        id: `q_${crypto.randomUUID()}`,
        question: '',
        options: [emptyOption(), emptyOption()],
      },
    ]);
  };

  // Remove an entire question.
  const removeQuestion = (questionId: string) => {
    setQuestions((previous) =>
      previous.filter((q) => q.id !== questionId)
    );
  };

  // Update question text.
  const updateQuestion = (
    questionId: string,
    value: string
  ) => {
    setQuestions((previous) =>
      previous.map((q) =>
        q.id === questionId
          ? { ...q, question: value }
          : q
      )
    );
  };

  // Add another answer option.
  const addOption = (questionId: string) => {
    setQuestions((previous) =>
      previous.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [...q.options, emptyOption()],
            }
          : q
      )
    );
  };

  // Remove an answer option.
  const removeOption = (
    questionId: string,
    optionIndex: number
  ) => {
    const question = questions.find(
      (q) => q.id === questionId
    );

    if (!question) return;

    if (question.options.length <= 2) {
      showError(
        'Every question must have at least two answer options.'
      );
      return;
    }

    setQuestions((previous) =>
      previous.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter(
                (_, index) => index !== optionIndex
              ),
            }
          : q
      )
    );
  };

  // Update label, description or deduction.
  const updateOption = <
    K extends keyof QualityOption,
  >(
    questionId: string,
    optionIndex: number,
    field: K,
    value: QualityOption[K]
  ) => {
    setQuestions((previous) =>
      previous.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((option, index) =>
                index === optionIndex
                  ? { ...option, [field]: value }
                  : option
              ),
            }
          : q
      )
    );
  };

  // Validate and save to the existing Product model.
  const saveQuestions = async () => {
    setError(null);

    if (!questions.length) {
      return showError(
        'Add at least one quality check question.'
      );
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.question.trim()) {
        return showError(
          `Question ${i + 1} cannot be empty.`
        );
      }

      if (question.options.length < 2) {
        return showError(
          `Question ${i + 1} needs at least two answers.`
        );
      }

      const labels = new Set<string>();

      for (const option of question.options) {
        if (!option.label.trim()) {
          return showError(
            `Question ${i + 1} contains an empty answer option.`
          );
        }

        const label = option.label.trim().toLowerCase();

        if (labels.has(label)) {
          return showError(
            `Question ${i + 1} contains duplicate answers.`
          );
        }

        labels.add(label);

        if (
          !Number.isFinite(option.deduction) ||
          option.deduction < 0
        ) {
          return showError(
            `Question ${i + 1} contains an invalid price deduction.`
          );
        }
      }
    }

    const payload = questions.map((question) => ({
      id: question.id,
      question: question.question.trim(),
      options: question.options.map((option) => ({
        label: option.label.trim(),
        description: option.description?.trim() || '',
        deduction: option.deduction,
      })),
    }));

    setSaving(true);

    try {
      await api.admin.updateProduct(productId, {
        quality_questions: payload,
      });

      setQuestions(payload);
      setExpanded(false);

      toast.success('Questionnaire updated', {
        description: `Quality questions for ${productName} have been saved.`,
        duration: 4000,
        closeButton: true,
        className: 'campus-admin-success-toast',
      });
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : 'Unable to save quality questions.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 border-t border-white/10 pt-5">

      {/* Questionnaire action row */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C6DE41]/20 bg-[#C6DE41]/10">
            <ClipboardList className="h-5 w-5 text-[#C6DE41]" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#F5F7F0]">
              Quality Questionnaire
            </h3>

            <p className="mt-1 text-xs text-[#A6B09F]">
              Configure student questions and valuation deductions.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || saving}
          onClick={() =>
            expanded
              ? setExpanded(false)
              : void openEditor()
          }
          aria-expanded={expanded}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C6DE41]/30 bg-[#C6DE41]/5 px-4 py-2.5 text-xs font-bold text-[#C6DE41] transition-all hover:bg-[#C6DE41]/10 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : expanded ? (
            <X className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}

          {loading
            ? 'Loading...'
            : expanded
              ? 'Close Editor'
              : 'Edit Questions'}
        </button>
      </div>

      {error && !expanded && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}

      {/* Expandable questionnaire builder */}

      {expanded && (
        <div className="mt-5 space-y-5 rounded-2xl border border-white/10 bg-[#12160F] p-4 sm:p-5">

          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-[#C6DE41]">
              <ClipboardList className="h-5 w-5" />
              Quality Questionnaire Builder
            </h3>

            <p className="mt-1 text-xs text-[#A6B09F]">
              Editing questions for {productName}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-[#C6DE41]/15 bg-[#C6DE41]/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C6DE41]" />

            <p className="text-xs leading-relaxed text-[#B4BBAE]">
              Deduction amounts are in rupees. Each selected
              answer contributes to the deduction from the
              maximum buying price of the product.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
            >
              {error}
            </div>
          )}

          <fieldset disabled={saving} className="min-w-0 space-y-4">

            {questions.map((question, questionIndex) => (
              <div
                key={question.id}
                className="space-y-3 rounded-2xl border border-white/10 bg-[#181D14] p-4"
              >

                {/* Question prompt */}

                <div className="flex items-center gap-3">
                  <span className="shrink-0 rounded-lg bg-[#C6DE41]/10 px-2.5 py-2 text-xs font-bold text-[#C6DE41]">
                    Q{questionIndex + 1}
                  </span>

                  <input
                    type="text"
                    value={question.question}
                    aria-label={`Question ${questionIndex + 1}`}
                    placeholder="Enter your custom question..."
                    onChange={(e) =>
                      updateQuestion(
                        question.id,
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />

                  <button
                    type="button"
                    title="Delete question"
                    aria-label={`Delete question ${questionIndex + 1}`}
                    onClick={() =>
                      removeQuestion(question.id)
                    }
                    className="shrink-0 rounded-lg p-2 text-[#A6B09F] transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Answer column headings */}

                <div className="hidden grid-cols-[1.2fr_1.2fr_110px_32px] gap-3 px-1 text-[10px] font-bold uppercase tracking-wide text-[#8F9A89] md:grid">
                  <span>Answer option</span>
                  <span>Description</span>
                  <span>Deduction (₹)</span>
                  <span />
                </div>

                {/* Answer options */}

                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="grid grid-cols-1 items-center gap-2 rounded-xl border border-white/5 p-3 md:grid-cols-[1.2fr_1.2fr_110px_32px] md:gap-3 md:border-0 md:p-0"
                  >
                    <input
                      type="text"
                      aria-label={`Answer ${optionIndex + 1} label`}
                      value={option.label}
                      onChange={(e) =>
                        updateOption(
                          question.id,
                          optionIndex,
                          'label',
                          e.target.value
                        )
                      }
                      placeholder="Answer option"
                      className={inputClass}
                    />

                    <input
                      type="text"
                      aria-label={`Answer ${optionIndex + 1} description`}
                      value={option.description || ''}
                      onChange={(e) =>
                        updateOption(
                          question.id,
                          optionIndex,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="Description"
                      className={inputClass}
                    />

                    <div className="relative min-w-0">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8F9A89]">
                        ₹
                      </span>

                      <input
                        type="number"
                        min={0}
                        step={1}
                        aria-label={`Answer ${optionIndex + 1} deduction`}
                        value={
                          Number.isFinite(option.deduction)
                            ? option.deduction
                            : ''
                        }
                        onChange={(e) =>
                          updateOption(
                            question.id,
                            optionIndex,
                            'deduction',
                            e.target.valueAsNumber
                          )
                        }
                        className={`${inputClass} pl-7`}
                      />
                    </div>

                    <button
                      type="button"
                      title="Remove answer"
                      aria-label={`Remove answer ${optionIndex + 1}`}
                      onClick={() =>
                        removeOption(question.id, optionIndex)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8F9A89] hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(question.id)}
                  className="flex items-center gap-1.5 pt-1 text-xs font-bold text-[#C6DE41] hover:text-[#D7EF59]"
                >
                  <Plus className="h-4 w-4" />
                  Add answer option
                </button>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
                <ClipboardList className="mx-auto mb-3 h-8 w-8 text-[#8F9A89]" />

                <p className="text-sm font-semibold text-white">
                  No custom questions
                </p>

                <p className="mt-1 text-xs text-[#A6B09F]">
                  Add a question to build your questionnaire.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={addQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#C6DE41]/30 bg-[#C6DE41]/5 py-3.5 text-sm font-bold text-[#C6DE41] transition-colors hover:bg-[#C6DE41]/10"
            >
              <Plus className="h-4 w-4" />
              Add Custom Question
            </button>
          </fieldset>

          {/* Save and cancel actions */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <span className="text-xs text-[#A6B09F]">
              {questions.length} configured questions
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setExpanded(false);
                  setError(null);
                }}
                className={secondaryButton}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={saveQuestions}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#C6DE41] px-5 py-2.5 text-xs font-bold text-[#090B09] transition-colors hover:bg-[#D7EF59] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving ? 'Saving...' : 'Save Questions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default QualityQuestionEditor;