import express from 'express';
import { AuthService } from '../services/authService.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: 'email_and_password_required' 
      });
    }
    
    const result = await AuthService.login(email, password);
    
    res.json({
      ok: true,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'invalid_credentials') {
      return res.status(401).json({
        ok: false,
        error: 'invalid_credentials'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await AuthService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'user_not_found'
      });
    }
    
    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        siteSlug: user.site_slug,
        plan: user.plan,
        billingStatus: user.billing_status
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;