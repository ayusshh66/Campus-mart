import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import prisma from '../db';
import { getDefaultQualityQuestions } from '../routes/products';

type AnswerOption = { label: string; deduction: number };
type QualityQuestion = { id: string; options: AnswerOption[] };

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function parseQuestions(product: {
    quality_questions: string;
    name: string;
    category: string;
    buy_price: number;
    upto_buy_price: number | null;
}): QualityQuestion[] {
    try {
        const parsed: unknown = JSON.parse(product.quality_questions || '[]');
        if (Array.isArray(parsed) && parsed.length) {
            return parsed as QualityQuestion[];
        }
    } catch { /* fallback below */ }
    return getDefaultQualityQuestions(product.name, product.category, product.buy_price, product.upto_buy_price);
}

/**
 * Prevents client-supplied `estimated_price` or `admin_buy_price` from setting
 * the seller payout. The approved product's question options/deductions are the
 * sole authority for the submitted quote. Apply AFTER authenticate/requireAuth.
 */
export async function verifySellQuote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { product_id, quality_answers } = req.body ?? {};
        if (typeof product_id !== 'string') {
            return res.status(400).json({ success: false, message: 'A valid product is required.' });
        }
        const product = await prisma.product.findUnique({ where: { id: product_id } });
        if (!product || !product.is_active || !product.is_buying_enabled) {
            return res.status(400).json({ success: false, message: 'This product is not currently accepting sell requests.' });
        }
        const questions = parseQuestions(product);
        let answers: unknown = quality_answers ?? {};
        if (typeof answers === 'string') {
            try { answers = JSON.parse(answers); } catch { answers = null; }
        }
        const answerMap = asRecord(answers);
        if (!answerMap) {
            return res.status(400).json({ success: false, message: 'Invalid quality questionnaire answers.' });
        }
        let totalDeductions = 0;
        for (const question of questions) {
            if (!Array.isArray(question.options) || !question.options.length) continue;
            const selection = answerMap[question.id];
            if (typeof selection !== 'string') {
                return res.status(400).json({ success: false, message: 'Answer every quality question before submitting.' });
            }
            const selected = question.options.find((option) => option.label === selection);
            if (!selected || !Number.isFinite(selected.deduction) || selected.deduction < 0) {
                return res.status(400).json({ success: false, message: 'An invalid quality answer was submitted. Refresh and retry.' });
            }
            totalDeductions += selected.deduction;
        }

        const maxPrice = product.upto_buy_price != null && product.upto_buy_price >= product.buy_price
            ? product.upto_buy_price
            : product.buy_price;
        // Match the UI's 50-rupee floor where possible, without exceeding admin maximum.
        const safeEstimate = Math.min(maxPrice, Math.max(50, Math.round(maxPrice - totalDeductions)));
        req.body.estimated_price = safeEstimate;
        delete req.body.admin_buy_price;
        delete req.body.admin_sell_price;
        next();
    } catch (error) {
        console.error('Quote verification failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to calculate the verified payout.' });
    }
}
