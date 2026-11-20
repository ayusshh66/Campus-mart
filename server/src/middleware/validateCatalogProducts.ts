import type { Request, Response, NextFunction } from 'express';
import prisma from '../db';

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

class CatalogValidationError extends Error {}

function textField(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new CatalogValidationError(`${field} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new CatalogValidationError(`${field} must contain ${min}–${max} characters.`);
  }
  return trimmed;
}

function numberField(value: unknown, field: string, min: number, max: number): number {
  if (typeof value === 'boolean' || value === null || value === '' || value === undefined) {
    throw new CatalogValidationError(`${field} must be a valid number.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new CatalogValidationError(`${field} must be between ${min} and ${max}.`);
  }
  return Math.round(n * 100) / 100;
}

function readArray(value: unknown, field: string): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* bad json */ }
  }
  throw new CatalogValidationError(`${field} must be an array.`);
}

function imageUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length > 2000) {
    throw new CatalogValidationError('Invalid product image URL.');
  }
  const url = value.trim();
  if (url.startsWith('/uploads/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
  } catch { /* not a valid absolute URL */ }
  throw new CatalogValidationError('Images must be HTTP(S) URLs or /uploads/ paths.');
}

function safeImageList(value: unknown): string[] {
  const list = readArray(value, 'images');
  if (list.length > 12) throw new CatalogValidationError('Upload no more than 12 images.');
  return [...new Set(list.map(imageUrl))];
}

function safeQuestions(value: unknown): Array<{
  id: string;
  question: string;
  options: { label: string; description?: string; deduction: number }[];
}> {
  const items = readArray(value, 'quality_questions');
  if (items.length > 20) throw new CatalogValidationError('Maximum 20 quality questions per product.');
  const seenIds = new Set<string>();
  return items.map((question, index) => {
    if (!isRecord(question)) throw new CatalogValidationError(`Question ${index + 1} is invalid.`);
    const id = textField(question.id, `Question ${index + 1} ID`, 1, 80);
    if (seenIds.has(id)) throw new CatalogValidationError('Quality question IDs must be unique.');
    seenIds.add(id);
    const prompt = textField(question.question, `Question ${index + 1}`, 3, 300);
    const options = readArray(question.options, `Question ${index + 1} options`);
    if (options.length < 2 || options.length > 10) {
      throw new CatalogValidationError(`Question ${index + 1} needs 2–10 options.`);
    }
    return {
      id,
      question: prompt,
      options: options.map((option, oi) => {
        if (!isRecord(option)) throw new CatalogValidationError('Invalid quality option.');
        const label = textField(option.label, `Answer ${oi + 1}`, 1, 160);
        const description = option.description == null || option.description === ''
          ? undefined : textField(option.description, 'Answer description', 1, 300);
        return {
          label,
          ...(description ? { description } : {}),
          deduction: numberField(option.deduction, `Answer ${oi + 1} deduction`, 0, 1_000_000),
        };
      }),
    };
  });
}

/**
 * Apply this middleware to admin POST/PUT product routes. Existing route handlers
 * and request/response shapes stay unchanged, but untrusted fields are normalized.
 * It also compares partial updates with the stored price fields.
 */
export async function validateCatalogProduct(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isRecord(req.body)) throw new CatalogValidationError('Expected a JSON object.');
    const isCreate = req.method.toUpperCase() === 'POST';
    const submitted = req.body;
    const record: JsonRecord = {};
    const allowed = [
      'name','description','category','image_url','images','buy_price',
      'upto_buy_price','sell_price','is_buying_enabled','is_active','quality_questions',
    ] as const;
    for (const key of allowed) {
      if (submitted[key] === undefined) continue;
      const value = submitted[key];
      switch (key) {
        case 'name': record[key] = textField(value, 'Product name', 2, 140); break;
        case 'category': record[key] = textField(value, 'Category', 2, 80); break;
        case 'description': record[key] = textField(value, 'Description', 5, 4000); break;
        case 'image_url': record[key] = imageUrl(value); break;
        case 'images': record[key] = safeImageList(value); break;
        case 'buy_price':
        case 'upto_buy_price':
        case 'sell_price': record[key] = numberField(value, key, 1, 1_000_000); break;
        case 'is_buying_enabled':
        case 'is_active':
          if (typeof value !== 'boolean') throw new CatalogValidationError(`${key} must be true or false.`);
          record[key] = value; break;
        case 'quality_questions': record[key] = safeQuestions(value); break;
      }
    }
    if (Object.keys(record).length === 0) throw new CatalogValidationError('Nothing to update.');
    if (isCreate) {
      for (const required of ['name','description','category','buy_price','sell_price'] as const) {
        if (record[required] === undefined) throw new CatalogValidationError(`${required} is required.`);
      }
    }

    const existing = isCreate ? null : await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!isCreate && !existing) return res.status(404).json({ success: false, message: 'Product not found.' });

    const buy = Number(record.buy_price ?? existing?.buy_price);
    const max = Number(record.upto_buy_price ?? existing?.upto_buy_price ?? buy);
    if (!Number.isFinite(buy) || !Number.isFinite(max) || max < buy) {
      throw new CatalogValidationError('Maximum Buy Price cannot be lower than Base Buy Price.');
    }
    // Existing backend stores arrays as JSON text, and accepts arrays in the request.
    const images = record.images as string[] | undefined;
    if (images && images.length && !record.image_url) record.image_url = images[0];
    if (isCreate && !record.image_url) throw new CatalogValidationError('Add at least one product image.');
    if (images && images.length === 0 && !record.image_url) {
      throw new CatalogValidationError('A product needs a primary image.');
    }
    req.body = record;
    return next();
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Product input validation failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to validate product.' });
  }
}
