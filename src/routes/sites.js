import express from 'express';
import { SiteService } from '../services/siteService.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/site-status?site=SLUG (Public)
router.get('/site-status', async (req, res) => {
  try {
    const { site } = req.query;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    const status = await SiteService.getSiteStatus(site);
    
    res.json({
      ok: true,
      ...status
    });
  } catch (error) {
    console.error('Get site status error:', error);
    
    if (error.message === 'site_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'site_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/site/toggle (Admin only)
router.post('/site/toggle', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { site, active } = req.body;
    
    if (!site || typeof active !== 'boolean') {
      return res.status(400).json({
        ok: false,
        error: 'site_and_active_required'
      });
    }
    
    const result = await SiteService.toggleSite(site, active);
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Toggle site error:', error);
    
    if (error.message === 'site_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'site_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/site/create (Admin only)
router.post('/site/create', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { slug, active = true, notes, vipPin } = req.body;
    
    if (!slug) {
      return res.status(400).json({
        ok: false,
        error: 'slug_required'
      });
    }
    
    const site = await SiteService.createSite({
      slug,
      active,
      notes,
      vipPin
    });
    
    res.json({
      ok: true,
      site
    });
  } catch (error) {
    console.error('Create site error:', error);
    
    if (error.message === 'site_slug_already_exists') {
      return res.status(409).json({
        ok: false,
        error: 'site_slug_already_exists'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/sites (Admin only)
router.get('/sites', verifyToken, requireAdmin, async (req, res) => {
  try {
    const sites = await SiteService.listSites();
    
    res.json({
      ok: true,
      sites
    });
  } catch (error) {
    console.error('List sites error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/site/set-pin (Admin only)
router.post('/site/set-pin', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { site, pin } = req.body;
    
    if (!site || !pin) {
      return res.status(400).json({
        ok: false,
        error: 'site_and_pin_required'
      });
    }
    
    await SiteService.setVipPin(site, pin);
    
    res.json({
      ok: true,
      message: 'PIN updated successfully'
    });
  } catch (error) {
    console.error('Set PIN error:', error);
    
    if (error.message === 'site_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'site_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;