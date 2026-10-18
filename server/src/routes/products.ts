import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

export const getDefaultQualityQuestions = (
  name: string,
  category: string,
  buyPrice: number,
  uptoBuyPrice?: number | null
) => {
  const maxPrice = uptoBuyPrice || Math.round(buyPrice * 1.25);
  const isBook =
    category.toLowerCase().includes('book') ||
    name.toLowerCase().includes('book') ||
    name.toLowerCase().includes('mathematics') ||
    name.toLowerCase().includes('physics');

  if (isBook) {
    return [
      {
        id: 'q_cover',
        question: 'What is the condition of the book cover & binding?',
        options: [
          { label: 'Like New (Pristine)', description: 'Clean cover, unbent spine, crisp corners', deduction: 0 },
          { label: 'Good Condition', description: 'Intact binding with light shelf wear', deduction: Math.round(maxPrice * 0.1) },
          { label: 'Fair (Noticeable Wear)', description: 'Cover creased or rubbed corners', deduction: Math.round(maxPrice * 0.22) },
        ],
      },
      {
        id: 'q_markings',
        question: 'Are there any handwritten notes or highlights inside?',
        options: [
          { label: 'Clean Pages', description: 'Zero pencil or pen markings on any pages', deduction: 0 },
          { label: 'Light Pencil / Neat Highlights', description: 'Occasional light pencil notes or highlights', deduction: Math.round(maxPrice * 0.08) },
          { label: 'Frequent Pen Markings', description: 'Solved questions or extensive ink notes', deduction: Math.round(maxPrice * 0.2) },
        ],
      },
      {
        id: 'q_integrity',
        question: 'Are all pages and index sheets intact?',
        options: [
          { label: '100% Complete & Intact', description: 'All syllabus chapters and index intact', deduction: 0 },
          { label: 'Minor Loose Page', description: 'One or two loose pages inside', deduction: Math.round(maxPrice * 0.15) },
        ],
      },
    ];
  }

  // Electronics / Gadgets (Calculators, Keyboards, etc.)
  return [
    {
      id: 'q_power',
      question: 'Does the device power on and work normally?',
      options: [
        { label: 'Powers On & Works Flawlessly', description: 'Boots instantly, all keys respond accurately', deduction: 0 },
        { label: 'Minor Response Lag', description: 'Buttons need firm press or faint screen contrast', deduction: Math.round(maxPrice * 0.1) },
        { label: 'Power Issue / Weak Battery', description: 'Requires battery replacement or service', deduction: Math.round(maxPrice * 0.28) },
      ],
    },
    {
      id: 'q_screen',
      question: 'What is the condition of the screen or display?',
      options: [
        { label: 'Flawless (No Scratches)', description: 'Crystal-clear screen with zero lines or spots', deduction: 0 },
        { label: 'Light Surface Scratches', description: 'Minor scuffs visible only under direct light', deduction: Math.round(maxPrice * 0.06) },
        { label: 'Noticeable Scratches or Marks', description: 'Deep scratch lines or minor display flaws', deduction: Math.round(maxPrice * 0.18) },
      ],
    },
    {
      id: 'q_body',
      question: 'What is the physical condition of the body casing?',
      options: [
        { label: 'Like New (No Scuffs)', description: 'Clean body, no dents or faded key labels', deduction: 0 },
        { label: 'Good (Minor Daily Wear)', description: 'Light rub marks from backpack and desk use', deduction: Math.round(maxPrice * 0.05) },
        { label: 'Noticeable Wear & Tear', description: 'Faded key legends or chipped plastic edges', deduction: Math.round(maxPrice * 0.12) },
      ],
    },
    {
      id: 'q_accessories',
      question: 'Which original accessories are included?',
      options: [
        { label: 'Original Cover / Cable Included', description: 'Protective sliding hard case or USB cable present', deduction: 0 },
        { label: 'Device Only', description: 'Protective cover, cable, or original box is missing', deduction: Math.round(maxPrice * 0.08) },
      ],
    },
  ];
};

// GET /api/products - Get all active products with dynamic college availability
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Determine the college ID to check availability for:
    // Priority: Explicit browsing query param college_id > Authenticated user's locked home college
    const queryCollegeId = (req.query.college_id as string | undefined)?.trim();
    const targetCollegeId = (queryCollegeId && queryCollegeId !== 'undefined' && queryCollegeId !== 'null' && queryCollegeId !== '')
      ? queryCollegeId
      : req.user?.college_id;

    const targetCollege = targetCollegeId
      ? await prisma.college.findUnique({ where: { id: targetCollegeId } })
      : null;

    const products = await prisma.product.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' },
    });

    // Check college-specific availability for each product
    const productsWithAvailability = await Promise.all(
      products.map(async (product) => {
        let is_available = false;
        let approvedCount = 0;

        if (targetCollegeId) {
          // Dynamic check: An approved active sell_request exists for this product AND college
          const approvedSellRequests = await prisma.sellRequest.findMany({
            where: {
              product_id: product.id,
              college_id: targetCollegeId,
              status: 'APPROVED',
            },
          });

          approvedCount = approvedSellRequests.length;
          is_available = approvedCount > 0;
        }

        let parsedImages: string[] = [];
        try {
          parsedImages = JSON.parse(product.images || '[]');
        } catch (e) {
          parsedImages = [];
        }
        if (parsedImages.length === 0 && product.image_url) {
          parsedImages = [product.image_url];
        }

        let parsedQuestions = [];
        try {
          parsedQuestions = JSON.parse(product.quality_questions || '[]');
        } catch (e) {
          parsedQuestions = [];
        }

        if (parsedQuestions.length === 0) {
          parsedQuestions = getDefaultQualityQuestions(
            product.name,
            product.category,
            product.buy_price,
            product.upto_buy_price
          );
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          image_url: product.image_url,
          images: parsedImages,
          category: product.category,
          sell_price: product.sell_price,
          buy_price: product.buy_price,
          upto_buy_price: product.upto_buy_price || product.buy_price,
          is_buying_enabled: product.is_buying_enabled,
          is_available,
          available_units: approvedCount,
          quality_questions: parsedQuestions,
          college_id: targetCollegeId || null,
          college_code: targetCollege?.code || null,
          college_name: targetCollege?.name || null,
        };
      })
    );

    return res.json({
      success: true,
      college: targetCollege
        ? {
            id: targetCollege.id,
            code: targetCollege.code,
            name: targetCollege.name,
            is_active: targetCollege.is_active,
            is_home_campus: Boolean(req.user && req.user.college_id === targetCollege.id),
          }
        : null,
      data: productsWithAvailability,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

// GET /api/products/:id - Get single product with availability
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryCollegeId = (req.query.college_id as string | undefined)?.trim();
    const targetCollegeId = (queryCollegeId && queryCollegeId !== 'undefined' && queryCollegeId !== 'null' && queryCollegeId !== '')
      ? queryCollegeId
      : req.user?.college_id;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || !product.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive.',
      });
    }

    const targetCollege = targetCollegeId
      ? await prisma.college.findUnique({ where: { id: targetCollegeId } })
      : null;

    let is_available = false;
    let approvedCount = 0;

    if (targetCollegeId) {
      const approvedSellRequests = await prisma.sellRequest.findMany({
        where: {
          product_id: product.id,
          college_id: targetCollegeId,
          status: 'APPROVED',
        },
      });
      approvedCount = approvedSellRequests.length;
      is_available = approvedCount > 0;
    }

    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(product.images || '[]');
    } catch (e) {
      parsedImages = [];
    }
    if (parsedImages.length === 0 && product.image_url) {
      parsedImages = [product.image_url];
    }

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(product.quality_questions || '[]');
    } catch (e) {
      parsedQuestions = [];
    }

    if (parsedQuestions.length === 0) {
      parsedQuestions = getDefaultQualityQuestions(
        product.name,
        product.category,
        product.buy_price,
        product.upto_buy_price
      );
    }

    return res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        images: parsedImages,
        category: product.category,
        sell_price: product.sell_price,
        buy_price: product.buy_price,
        upto_buy_price: product.upto_buy_price || product.buy_price,
        is_buying_enabled: product.is_buying_enabled,
        is_available,
        available_units: approvedCount,
        quality_questions: parsedQuestions,
        college_id: targetCollegeId || null,
        college_code: targetCollege?.code || null,
        college_name: targetCollege?.name || null,
        is_home_campus: Boolean(req.user && req.user.college_id === targetCollege?.id),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product details',
      error: error.message,
    });
  }
});

export default router;
