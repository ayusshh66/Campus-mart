import prisma from '../db';

/**
 * Auto-Match & Auto-Accept Engine for CampusMart
 * Evaluates admin-configured rules per product:
 * 1. Condition check (e.g. "Like New", "Good")
 * 2. Mandatory photos check
 * 3. Campus inventory quota check (e.g. up to 10 calculators per campus)
 * 4. Waiting buyer auto-match (FIFO)
 * 5. Automatic assignment to Campus Hero with operational messages
 */

export async function processAutoMatchForSellRequest(sellRequestId: string) {
  try {
    const sellRequest = await prisma.sellRequest.findUnique({
      where: { id: sellRequestId },
      include: {
        product: true,
        college: true,
        user: true,
      },
    });

    if (!sellRequest || sellRequest.status !== 'PENDING') {
      return null;
    }

    const product = sellRequest.product;
    if (!product.auto_match_enabled) {
      return null;
    }

    // 1. Condition check
    let acceptedConditions: string[] = ['Like New', 'Good'];
    try {
      acceptedConditions = JSON.parse(product.auto_accept_conditions || '["Like New", "Good"]');
    } catch (e) {
      acceptedConditions = ['Like New', 'Good'];
    }

    if (!acceptedConditions.includes(sellRequest.condition)) {
      return null; // Condition not met for auto-accept
    }

    // 2. Photos requirement check
    if (product.require_photos_for_auto) {
      let images: string[] = [];
      try {
        images = JSON.parse(sellRequest.images || '[]');
      } catch (e) {
        images = [];
      }
      if (images.length === 0) {
        return null; // At least one photo required
      }
    }

    // 3. Minimum payout check (if configured)
    const payout = sellRequest.estimated_price || product.buy_price;
    if (product.min_payout_for_auto && payout < product.min_payout_for_auto) {
      return null;
    }

    // 4. Max campus inventory check (e.g. up to 10 calculators per campus)
    const currentActiveCount = await prisma.sellRequest.count({
      where: {
        product_id: product.id,
        college_id: sellRequest.college_id,
        status: 'APPROVED',
      },
    });

    if (currentActiveCount >= product.max_campus_inventory) {
      return null; // Campus inventory capacity reached
    }

    // 5. Conditions met! Auto-Approve the sell request
    const updatedSellRequest = await prisma.sellRequest.update({
      where: { id: sellRequest.id },
      data: {
        status: 'APPROVED',
        auto_matched: true,
        admin_buy_price: payout,
        admin_sell_price: product.sell_price,
      },
    });

    // 6. Find an approved Campus Hero for this college
    const heroApp = await prisma.campusHeroApplication.findFirst({
      where: {
        college_id: sellRequest.college_id,
        status: 'APPROVED',
      },
      include: { user: true },
    });

    const heroUser = heroApp?.user || await prisma.user.findFirst({
      where: {
        college_id: sellRequest.college_id,
        role: 'CAMPUS_HERO',
      },
    });

    // 7. Check if there is a waiting PENDING buy request at this college
    const waitingBuyRequest = await prisma.buyRequest.findFirst({
      where: {
        product_id: product.id,
        college_id: sellRequest.college_id,
        status: 'PENDING',
      },
      include: { user: true },
      orderBy: { created_at: 'asc' }, // FIFO queue
    });

    if (waitingBuyRequest) {
      // Direct Matched Exchange!
      await prisma.buyRequest.update({
        where: { id: waitingBuyRequest.id },
        data: {
          status: 'APPROVED',
          auto_matched: true,
          matched_sell_request_id: sellRequest.id,
        },
      });

      const task = await prisma.deliveryTask.create({
        data: {
          task_type: 'MATCHED_EXCHANGE',
          sell_request_id: sellRequest.id,
          buy_request_id: waitingBuyRequest.id,
          product_id: product.id,
          college_id: sellRequest.college_id,
          assigned_hero_id: heroUser?.id || null,
          status: 'ASSIGNED',
          pickup_notes: `Auto-matched exchange: Collect ${product.name} from ${sellRequest.user.name} and deliver to ${waitingBuyRequest.user.name}.`,
        },
      });

      if (heroUser) {
        // Send initial operational message to Seller
        await prisma.message.create({
          data: {
            sender_id: heroUser.id,
            sender_display_name: 'Operations Team — Campus Hero',
            receiver_id: sellRequest.user_id,
            task_id: task.id,
            sell_request_id: sellRequest.id,
            content: `Hello ${sellRequest.user.name}! Your sell request for "${product.name}" has been auto-approved and matched with a buyer on your campus (Payout: ₹${payout}). I am your campus operations hero and will coordinate pickup. Where and when can we meet on campus?`,
          },
        });

        // Send initial operational message to Buyer
        await prisma.message.create({
          data: {
            sender_id: heroUser.id,
            sender_display_name: 'Operations Team — Campus Hero',
            receiver_id: waitingBuyRequest.user_id,
            task_id: task.id,
            buy_request_id: waitingBuyRequest.id,
            content: `Hello ${waitingBuyRequest.user.name}! Great news! A "${product.name}" is now available at ${sellRequest.college.code} and your order is confirmed (Amount: ₹${product.sell_price}). I am your campus hero and will deliver it to you. When are you free today?`,
          },
        });
      }

      return {
        auto_approved: true,
        matched: true,
        task,
        sell_request: updatedSellRequest,
        buy_request: waitingBuyRequest,
      };
    } else {
      // No waiting buyer -> Inventory Pickup Task
      const task = await prisma.deliveryTask.create({
        data: {
          task_type: 'PICKUP',
          sell_request_id: sellRequest.id,
          product_id: product.id,
          college_id: sellRequest.college_id,
          assigned_hero_id: heroUser?.id || null,
          status: 'ASSIGNED',
          pickup_notes: `Auto-approved inventory: Collect ${product.name} from ${sellRequest.user.name} for ${sellRequest.college.code} campus inventory.`,
        },
      });

      if (heroUser) {
        await prisma.message.create({
          data: {
            sender_id: heroUser.id,
            sender_display_name: 'Operations Team — Campus Hero',
            receiver_id: sellRequest.user_id,
            task_id: task.id,
            sell_request_id: sellRequest.id,
            content: `Hello ${sellRequest.user.name}! Your item "${product.name}" has been auto-approved for campus acquisition (Estimated Payout: ₹${payout}). I am your campus hero and will meet you for physical verification and instant payment. What is a convenient time to meet on campus?`,
          },
        });
      }

      return {
        auto_approved: true,
        matched: false,
        task,
        sell_request: updatedSellRequest,
      };
    }
  } catch (error) {
    console.error('Auto-match engine error for sell request:', error);
    return null;
  }
}

export async function processAutoMatchForBuyRequest(buyRequestId: string) {
  try {
    const buyRequest = await prisma.buyRequest.findUnique({
      where: { id: buyRequestId },
      include: { product: true, college: true, user: true },
    });

    if (!buyRequest || buyRequest.status !== 'PENDING') return null;

    // Check if there is an approved sell request in campus inventory that is not yet matched
    const availableSellRequest = await prisma.sellRequest.findFirst({
      where: {
        product_id: buyRequest.product_id,
        college_id: buyRequest.college_id,
        status: 'APPROVED',
        delivery_tasks: {
          none: {
            task_type: { in: ['DROP', 'MATCHED_EXCHANGE'] },
            status: { in: ['ASSIGNED', 'PICKED_UP', 'DELIVERED', 'COMPLETED'] },
          },
        },
      },
      include: { user: true },
      orderBy: { created_at: 'asc' },
    });

    if (!availableSellRequest) return null;

    // Find hero
    const heroApp = await prisma.campusHeroApplication.findFirst({
      where: { college_id: buyRequest.college_id, status: 'APPROVED' },
      include: { user: true },
    });
    const heroUser = heroApp?.user || await prisma.user.findFirst({
      where: { college_id: buyRequest.college_id, role: 'CAMPUS_HERO' },
    });

    // Auto-approve buy request
    const updatedBuyRequest = await prisma.buyRequest.update({
      where: { id: buyRequest.id },
      data: {
        status: 'APPROVED',
        auto_matched: true,
        matched_sell_request_id: availableSellRequest.id,
      },
    });

    const task = await prisma.deliveryTask.create({
      data: {
        task_type: 'DROP',
        buy_request_id: buyRequest.id,
        sell_request_id: availableSellRequest.id,
        product_id: buyRequest.product_id,
        college_id: buyRequest.college_id,
        assigned_hero_id: heroUser?.id || null,
        status: 'ASSIGNED',
        delivery_notes: `Campus delivery: Deliver ${buyRequest.product.name} to ${buyRequest.user.name}.`,
      },
    });

    if (heroUser) {
      await prisma.message.create({
        data: {
          sender_id: heroUser.id,
          sender_display_name: 'Operations Team — Campus Hero',
          receiver_id: buyRequest.user_id,
          task_id: task.id,
          buy_request_id: buyRequest.id,
          content: `Hello ${buyRequest.user.name}! Your order for "${buyRequest.product.name}" has been auto-matched and confirmed for campus delivery (Price: ₹${buyRequest.product.sell_price}). I am your campus operations hero and will bring it to you. When are you free today?`,
        },
      });
    }

    return { auto_matched: true, task, buy_request: updatedBuyRequest };
  } catch (error) {
    console.error('Auto-match engine error for buy request:', error);
    return null;
  }
}

/**
 * Runs a full auto-match scan across all pending requests in the system.
 */
export async function runFullAutoMatchCycle() {
  const pendingSellRequests = await prisma.sellRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { created_at: 'asc' },
  });

  const results = [];
  for (const sr of pendingSellRequests) {
    const res = await processAutoMatchForSellRequest(sr.id);
    if (res) {
      results.push(res);
    }
  }

  const pendingBuyRequests = await prisma.buyRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { created_at: 'asc' },
  });

  for (const br of pendingBuyRequests) {
    const res = await processAutoMatchForBuyRequest(br.id);
    if (res) {
      results.push(res);
    }
  }

  return {
    processed_count: results.length,
    matches: results,
  };
}
