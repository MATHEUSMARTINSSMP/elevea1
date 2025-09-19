import express from 'express';
import { TrafficService } from '../services/trafficService.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/traffic/hit (Public - from landing pages)
router.post('/hit', async (req, res) => {
  try {
    const { site, path = '/' } = req.body;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    // Get client info
    const ip = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';
    
    const hit = await TrafficService.recordHit({
      siteSlug: site,
      path,
      ip,
      userAgent
    });
    
    res.json({
      ok: true,
      hit
    });
  } catch (error) {
    console.error('Record traffic hit error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/traffic/daily?site=SLUG&range=7d|30d|all (Auth required)
router.get('/daily', verifyToken, async (req, res) => {
  try {
    const { site, range = '30d' } = req.query;
    
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
    
    const stats = await TrafficService.getDailyStats(site, range);
    
    res.json({
      ok: true,
      ...stats
    });
  } catch (error) {
    console.error('Get daily traffic error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/traffic/hourly?site=SLUG&date=2023-12-25 (Auth required)
router.get('/hourly', verifyToken, async (req, res) => {
  try {
    const { site, date } = req.query;
    
    if (!site || !date) {
      return res.status(400).json({
        ok: false,
        error: 'site_and_date_required'
      });
    }
    
    // Check if user can access this site
    if (req.user.role !== 'admin' && req.user.siteSlug !== site.toUpperCase()) {
      return res.status(403).json({
        ok: false,
        error: 'access_denied'
      });
    }
    
    const stats = await TrafficService.getHourlyStats(site, date);
    
    res.json({
      ok: true,
      ...stats
    });
  } catch (error) {
    console.error('Get hourly traffic error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/traffic/referrers?site=SLUG&days=30 (Auth required)
router.get('/referrers', verifyToken, async (req, res) => {
  try {
    const { site, days = 30 } = req.query;
    
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
    
    const referrers = await TrafficService.getTopReferrers(site, parseInt(days));
    
    res.json({
      ok: true,
      referrers
    });
  } catch (error) {
    console.error('Get traffic referrers error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/traffic/recent?site=SLUG&limit=50 (Auth required)
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const { site, limit = 50 } = req.query;
    
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
    
    const recentHits = await TrafficService.getRecentHits(site, parseInt(limit));
    
    res.json({
      ok: true,
      hits: recentHits
    });
  } catch (error) {
    console.error('Get recent traffic error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;