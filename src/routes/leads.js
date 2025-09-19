import express from 'express';
import { LeadService } from '../services/leadService.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/leads (Public - from landing pages)
router.post('/', async (req, res) => {
  try {
    const { site, name, email, phone, message, source } = req.body;
    
    if (!site || !name || !email) {
      return res.status(400).json({
        ok: false,
        error: 'site_name_and_email_required'
      });
    }
    
    const lead = await LeadService.createLead({
      siteSlug: site,
      name,
      email,
      phone,
      message,
      source: source || 'website'
    });
    
    res.json({
      ok: true,
      lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    
    if (error.message === 'name_and_email_required') {
      return res.status(400).json({
        ok: false,
        error: 'name_and_email_required'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/leads?site=SLUG&page=1&pageSize=20 (Auth required)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { site, page = 1, pageSize = 20 } = req.query;
    
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
    
    const result = await LeadService.getLeads(
      site,
      parseInt(page),
      parseInt(pageSize)
    );
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/leads/:id (Auth required)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await LeadService.getLead(parseInt(id));
    
    // Check if user can access this lead
    if (req.user.role !== 'admin' && req.user.siteSlug !== lead.site_slug) {
      return res.status(403).json({
        ok: false,
        error: 'access_denied'
      });
    }
    
    res.json({
      ok: true,
      lead
    });
  } catch (error) {
    console.error('Get lead error:', error);
    
    if (error.message === 'lead_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'lead_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// DELETE /api/leads/:id (Auth required)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get lead first to check permissions
    const lead = await LeadService.getLead(parseInt(id));
    
    // Check if user can delete this lead
    if (req.user.role !== 'admin' && req.user.siteSlug !== lead.site_slug) {
      return res.status(403).json({
        ok: false,
        error: 'access_denied'
      });
    }
    
    const result = await LeadService.deleteLead(parseInt(id));
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    
    if (error.message === 'lead_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'lead_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;