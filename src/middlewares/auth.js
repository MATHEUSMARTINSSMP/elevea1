import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'elevea-dev-secret-change-in-production';

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      siteSlug: user.site_slug,
      plan: user.plan 
    }, 
    JWT_SECRET, 
    { expiresIn: '30d' }
  );
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'token_required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'invalid_token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'authentication_required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ ok: false, error: 'insufficient_permissions' });
    }

    next();
  };
}

export function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

export function requireVipOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'authentication_required' });
  }

  const isAdmin = req.user.role === 'admin';
  const isVip = req.user.plan === 'vip' || isActiveBillingStatus(req.user.billing_status);

  if (!isAdmin && !isVip) {
    return res.status(403).json({ ok: false, error: 'vip_or_admin_required' });
  }

  next();
}

function isActiveBillingStatus(status) {
  const activeStatuses = ['approved', 'authorized', 'accredited', 'recurring_charges'];
  return activeStatuses.includes(status);
}