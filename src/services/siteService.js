import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';

export class SiteService {
  static normalizeSiteSlug(slug) {
    return slug.trim().toUpperCase();
  }

  static async createSite(siteData) {
    const db = getDatabase();
    const { slug, active = true, notes = '', vipPin = null } = siteData;
    
    const normalizedSlug = this.normalizeSiteSlug(slug);
    let vipPinHash = null;

    // Hash PIN if provided
    if (vipPin) {
      vipPinHash = await bcrypt.hash(vipPin, 12);
    }

    const stmt = db.prepare(`
      INSERT INTO sites (slug, active, notes, vip_pin_hash)
      VALUES (?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(normalizedSlug, active ? 1 : 0, notes, vipPinHash);
      return { id: result.lastInsertRowid, slug: normalizedSlug, active };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('site_slug_already_exists');
      }
      throw error;
    }
  }

  static async getSite(slug) {
    const db = getDatabase();
    const normalizedSlug = this.normalizeSiteSlug(slug);
    const stmt = db.prepare('SELECT * FROM sites WHERE slug = ?');
    return stmt.get(normalizedSlug);
  }

  static async toggleSite(slug, active) {
    const db = getDatabase();
    const normalizedSlug = this.normalizeSiteSlug(slug);
    
    const stmt = db.prepare('UPDATE sites SET active = ? WHERE slug = ?');
    const result = stmt.run(active ? 1 : 0, normalizedSlug);
    
    if (result.changes === 0) {
      throw new Error('site_not_found');
    }
    
    return { slug: normalizedSlug, active };
  }

  static async validateVipPin(slug, pin) {
    if (!pin) return false;
    
    const site = await this.getSite(slug);
    if (!site || !site.vip_pin_hash) return false;
    
    return bcrypt.compare(pin, site.vip_pin_hash);
  }

  static async setVipPin(slug, pin) {
    const db = getDatabase();
    const normalizedSlug = this.normalizeSiteSlug(slug);
    const pinHash = await bcrypt.hash(pin, 12);
    
    const stmt = db.prepare('UPDATE sites SET vip_pin_hash = ? WHERE slug = ?');
    const result = stmt.run(pinHash, normalizedSlug);
    
    if (result.changes === 0) {
      throw new Error('site_not_found');
    }
    
    return true;
  }

  static async getSiteStatus(slug) {
    const db = getDatabase();
    const normalizedSlug = this.normalizeSiteSlug(slug);
    
    const stmt = db.prepare('SELECT slug, active FROM sites WHERE slug = ?');
    const site = stmt.get(normalizedSlug);
    
    if (!site) {
      throw new Error('site_not_found');
    }
    
    return {
      siteSlug: site.slug,
      active: Boolean(site.active)
    };
  }

  static async listSites() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT slug, active, created_at FROM sites ORDER BY created_at DESC');
    return stmt.all();
  }
}