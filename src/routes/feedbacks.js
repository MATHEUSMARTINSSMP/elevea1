import express from 'express';
import { FeedbackService } from '../services/feedbackService.js';
import { SiteService } from '../services/siteService.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/feedbacks (Public - from landing pages)
router.post('/', async (req, res) => {
  try {
    const { site, name, email, phone, rating, comment } = req.body;
    
    if (!site || !rating || !comment) {
      return res.status(400).json({
        ok: false,
        error: 'site_rating_and_comment_required'
      });
    }
    
    const feedback = await FeedbackService.createFeedback({
      siteSlug: site,
      name,
      email,
      phone,
      rating,
      comment
    });
    
    res.json({
      ok: true,
      feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    
    if (error.message === 'rating_and_comment_required') {
      return res.status(400).json({
        ok: false,
        error: 'rating_and_comment_required'
      });
    }
    
    if (error.message === 'rating_must_be_between_1_and_5') {
      return res.status(400).json({
        ok: false,
        error: 'rating_must_be_between_1_and_5'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/feedbacks?site=SLUG&page=1&pageSize=20
router.get('/', async (req, res) => {
  try {
    const { site, page = 1, pageSize = 20, pin } = req.query;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    // Determine access level
    let includePrivateInfo = false;
    let onlyApproved = true;
    
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elevea-dev-secret-change-in-production');
          
          // Admin can see everything
          if (decoded.role === 'admin') {
            includePrivateInfo = true;
            onlyApproved = false;
          }
          // VIP user with correct PIN can see everything
          else if (decoded.plan === 'vip' && pin) {
            const isValidPin = await SiteService.validateVipPin(site, pin);
            if (isValidPin) {
              includePrivateInfo = true;
              onlyApproved = false;
            }
          }
        }
      } catch (error) {
        // Invalid token, treat as public request
        console.warn('Invalid token in feedback request:', error.message);
      }
    }
    
    const result = await FeedbackService.getFeedbacks(
      site,
      parseInt(page),
      parseInt(pageSize),
      {
        onlyApproved,
        includePrivateInfo
      }
    );
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/feedbacks/approve (VIP with PIN or Admin)
router.post('/approve', async (req, res) => {
  try {
    const { site, id, approved, pin } = req.body;
    
    if (!site || !id || typeof approved !== 'boolean') {
      return res.status(400).json({
        ok: false,
        error: 'site_id_and_approved_required'
      });
    }
    
    // Check authentication and permissions
    const authHeader = req.headers.authorization;
    let isAuthorized = false;
    
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elevea-dev-secret-change-in-production');
          
          if (decoded.role === 'admin') {
            isAuthorized = true;
          } else if (decoded.plan === 'vip' && pin) {
            const isValidPin = await SiteService.validateVipPin(site, pin);
            if (isValidPin) {
              isAuthorized = true;
            }
          }
        }
      } catch (error) {
        console.warn('Invalid token in feedback approval:', error.message);
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        ok: false,
        error: 'vip_pin_or_admin_required'
      });
    }
    
    const result = await FeedbackService.approveFeedback(parseInt(id), approved);
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Approve feedback error:', error);
    
    if (error.message === 'feedback_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'feedback_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/feedbacks/stats?site=SLUG (Auth required)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { site } = req.query;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    // Check if user can access this site
    if (req.user.role !== 'admin' && req.user.siteSlug !== site.toUpperCase()) {
      return res.status(403).json({
        ok: false,
        error: 'access_denied'
      });
    }
    
    const stats = await FeedbackService.getFeedbackStats(site);
    
    res.json({
      ok: true,
      stats
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;