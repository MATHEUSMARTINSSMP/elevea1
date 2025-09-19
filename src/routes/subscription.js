import express from 'express';
import { SubscriptionService } from '../services/subscriptionService.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/subscription/status?site=SLUG&email=...
router.get('/status', async (req, res) => {
  try {
    const { site, email } = req.query;
    
    if (!site && !email) {
      return res.status(400).json({
        ok: false,
        error: 'site_or_email_required'
      });
    }
    
    const status = await SubscriptionService.getSubscriptionStatus(site, email);
    
    res.json({
      ok: true,
      ...status
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    
    if (error.message === 'user_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'user_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/subscription/update-billing (Admin only)
router.post('/update-billing', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, status, nextDate, amount, currency, provider } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({
        ok: false,
        error: 'user_id_and_status_required'
      });
    }
    
    const result = await SubscriptionService.updateBillingStatus(userId, {
      status,
      nextDate,
      amount,
      currency,
      provider
    });
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Update billing error:', error);
    
    if (error.message === 'user_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'user_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/subscription/upgrade-plan
router.post('/upgrade-plan', verifyToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;
    
    if (!plan) {
      return res.status(400).json({
        ok: false,
        error: 'plan_required'
      });
    }
    
    const result = await SubscriptionService.upgradePlan(userId, plan);
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    
    if (error.message === 'invalid_plan') {
      return res.status(400).json({
        ok: false,
        error: 'invalid_plan'
      });
    }
    
    if (error.message === 'user_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'user_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/subscription/active (Admin only)
router.get('/active', verifyToken, requireAdmin, async (req, res) => {
  try {
    const subscriptions = await SubscriptionService.getAllActiveSubscriptions();
    
    res.json({
      ok: true,
      subscriptions,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Get active subscriptions error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;