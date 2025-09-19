import express from 'express';
import { SettingsService } from '../services/settingsService.js';
import { SiteService } from '../services/siteService.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/settings?site=SLUG
router.get('/', async (req, res) => {
  try {
    const { site } = req.query;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    const settings = await SettingsService.getSettings(site);
    
    res.json({
      ok: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/settings
router.post('/', verifyToken, async (req, res) => {
  try {
    const { site, settings, pin } = req.body;
    
    if (!site || !settings) {
      return res.status(400).json({
        ok: false,
        error: 'site_and_settings_required'
      });
    }
    
    const isAdmin = req.user.role === 'admin';
    const isVip = req.user.plan === 'vip';
    const requirePin = !isAdmin && isVip;
    
    if (!isAdmin && !isVip) {
      return res.status(403).json({
        ok: false,
        error: 'vip_or_admin_required'
      });
    }
    
    const result = await SettingsService.saveSettings(site, settings, pin, requirePin);
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Save settings error:', error);
    
    if (error.message === 'invalid_pin') {
      return res.status(403).json({
        ok: false,
        error: 'invalid_pin'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/sections/upsert-defs
router.post('/sections/upsert-defs', verifyToken, async (req, res) => {
  try {
    const { site, defs, pin } = req.body;
    
    if (!site || !defs) {
      return res.status(400).json({
        ok: false,
        error: 'site_and_defs_required'
      });
    }
    
    const isAdmin = req.user.role === 'admin';
    const requirePin = !isAdmin;
    
    const result = await SettingsService.upsertSectionDefs(site, defs, pin, requirePin);
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Upsert section defs error:', error);
    
    if (error.message === 'invalid_pin') {
      return res.status(403).json({
        ok: false,
        error: 'invalid_pin'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/settings/history?site=SLUG
router.get('/history', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { site, limit = 10 } = req.query;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    const history = await SettingsService.getSettingsHistory(site, parseInt(limit));
    
    res.json({
      ok: true,
      history
    });
  } catch (error) {
    console.error('Get settings history error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;