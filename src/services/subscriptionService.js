import { getDatabase } from '../db/database.js';
import { SiteService } from './siteService.js';

export class SubscriptionService {
  static isActiveBillingStatus(status) {
    const activeStatuses = ['approved', 'authorized', 'accredited', 'recurring_charges'];
    return activeStatuses.includes(status);
  }

  static async getSubscriptionStatus(siteSlug, email = null) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Find user by site slug or email
    let user;
    if (email) {
      const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR site_slug = ?');
      user = stmt.get(email.toLowerCase().trim(), normalizedSlug);
    } else {
      const stmt = db.prepare('SELECT * FROM users WHERE site_slug = ?');
      user = stmt.get(normalizedSlug);
    }
    
    if (!user) {
      throw new Error('user_not_found');
    }
    
    // Check if billing is active
    const isActive = this.isActiveBillingStatus(user.billing_status);
    const isVip = user.plan === 'vip' || isActive;
    
    // Check if billing is overdue
    let isOverdue = false;
    let gracePeriodEnd = null;
    if (user.billing_next) {
      const nextDate = new Date(user.billing_next);
      const now = new Date();
      const GRACE_DAYS = 3;
      
      isOverdue = nextDate < now;
      gracePeriodEnd = new Date(nextDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_DAYS);
    }
    
    return {
      siteSlug: normalizedSlug,
      email: user.email,
      plan: user.plan,
      status: user.billing_status,
      isActive,
      isVip,
      isOverdue,
      gracePeriodEnd: gracePeriodEnd?.toISOString(),
      nextCharge: user.billing_next,
      amount: user.billing_amount,
      currency: user.billing_currency,
      provider: user.billing_provider,
      lastPayment: await this.getLastPayment(user.id)
    };
  }

  static async updateBillingStatus(userId, billingData) {
    const db = getDatabase();
    const { status, nextDate, amount, currency = 'BRL', provider = 'mercadopago' } = billingData;
    
    const stmt = db.prepare(`
      UPDATE users 
      SET billing_status = ?, 
          billing_next = ?, 
          billing_amount = ?, 
          billing_currency = ?, 
          billing_provider = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(status, nextDate, amount, currency, provider, userId);
    
    if (result.changes === 0) {
      throw new Error('user_not_found');
    }
    
    // If status becomes active, ensure site is active too
    if (this.isActiveBillingStatus(status)) {
      const user = await this.getUserById(userId);
      if (user && user.site_slug) {
        await SiteService.toggleSite(user.site_slug, true);
      }
    }
    
    return { updated: true, userId, status };
  }

  static async getUserById(userId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(userId);
  }

  static async getLastPayment(userId) {
    // This would typically query a payments table
    // For now, return mock data based on billing info
    const user = await this.getUserById(userId);
    
    if (!user || !user.billing_amount) {
      return null;
    }
    
    // Mock last payment - in real system this would be from payments table
    return {
      date: user.updated_at,
      amount: user.billing_amount,
      currency: user.billing_currency,
      status: user.billing_status,
      provider: user.billing_provider
    };
  }

  static async processGracePeriodCheck() {
    const db = getDatabase();
    const GRACE_DAYS = 3;
    const now = new Date();
    
    // Find users with overdue billing beyond grace period
    const stmt = db.prepare(`
      SELECT id, email, site_slug, billing_next, billing_status
      FROM users 
      WHERE billing_next IS NOT NULL 
        AND billing_next < datetime('now', '-${GRACE_DAYS} days')
        AND billing_status NOT IN ('cancelled', 'suspended')
    `);
    
    const overdueUsers = stmt.all();
    
    for (const user of overdueUsers) {
      // Set billing status to cancelled
      const updateStmt = db.prepare(`
        UPDATE users 
        SET billing_status = 'cancelled' 
        WHERE id = ?
      `);
      updateStmt.run(user.id);
      
      // Deactivate site
      if (user.site_slug) {
        try {
          await SiteService.toggleSite(user.site_slug, false);
          console.log(`Deactivated site ${user.site_slug} due to overdue billing`);
        } catch (error) {
          console.error(`Error deactivating site ${user.site_slug}:`, error);
        }
      }
    }
    
    return {
      processed: overdueUsers.length,
      deactivatedSites: overdueUsers.filter(u => u.site_slug).map(u => u.site_slug)
    };
  }

  static async upgradePlan(userId, newPlan) {
    const db = getDatabase();
    
    if (!['essential', 'vip'].includes(newPlan)) {
      throw new Error('invalid_plan');
    }
    
    const stmt = db.prepare('UPDATE users SET plan = ? WHERE id = ?');
    const result = stmt.run(newPlan, userId);
    
    if (result.changes === 0) {
      throw new Error('user_not_found');
    }
    
    return { updated: true, userId, plan: newPlan };
  }

  static async getAllActiveSubscriptions() {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT 
        u.id, u.email, u.site_slug, u.plan, u.billing_status,
        u.billing_next, u.billing_amount, u.billing_currency,
        s.active as site_active
      FROM users u
      LEFT JOIN sites s ON s.slug = u.site_slug
      WHERE u.billing_status IN ('approved', 'authorized', 'accredited', 'recurring_charges')
      ORDER BY u.billing_next ASC
    `);
    
    return stmt.all();
  }
}