import { getDatabase } from '../db/database.js';
import { SiteService } from './siteService.js';

export class SettingsService {
  static async getSettings(siteSlug) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Get latest settings for the site
    const stmt = db.prepare(`
      SELECT settings_json FROM settings_kv 
      WHERE site_slug = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const result = stmt.get(normalizedSlug);
    
    if (!result) {
      // Return default settings structure
      return {
        sections: {
          defs: [],
          data: {}
        }
      };
    }
    
    try {
      const settings = JSON.parse(result.settings_json);
      // Never return security.vip_pin in GET requests
      if (settings.security) {
        delete settings.security.vip_pin;
      }
      return settings;
    } catch (error) {
      console.error('Error parsing settings JSON:', error);
      return {
        sections: {
          defs: [],
          data: {}
        }
      };
    }
  }

  static async saveSettings(siteSlug, settings, pin = null, requirePin = false) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Validate PIN if required
    if (requirePin && !(await SiteService.validateVipPin(normalizedSlug, pin))) {
      throw new Error('invalid_pin');
    }
    
    // Remove any vip_pin from settings JSON (security)
    const cleanSettings = { ...settings };
    if (cleanSettings.security && cleanSettings.security.vip_pin) {
      delete cleanSettings.security.vip_pin;
    }
    
    // Insert new settings snapshot
    const stmt = db.prepare(`
      INSERT INTO settings_kv (site_slug, settings_json)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(normalizedSlug, JSON.stringify(cleanSettings));
    return { id: result.lastInsertRowid, siteSlug: normalizedSlug };
  }

  static async upsertSectionDefs(siteSlug, defs, pin = null, requirePin = false) {
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Validate PIN if required
    if (requirePin && !(await SiteService.validateVipPin(normalizedSlug, pin))) {
      throw new Error('invalid_pin');
    }
    
    // Get current settings
    const currentSettings = await this.getSettings(normalizedSlug);
    
    // Merge new defs, preserving existing data
    const updatedSettings = {
      ...currentSettings,
      sections: {
        defs: Array.isArray(defs) ? defs : [],
        data: currentSettings.sections?.data || {}
      }
    };
    
    return this.saveSettings(normalizedSlug, updatedSettings);
  }

  static async getSettingsHistory(siteSlug, limit = 10) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    const stmt = db.prepare(`
      SELECT id, settings_json, created_at 
      FROM settings_kv 
      WHERE site_slug = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    const results = stmt.all(normalizedSlug, limit);
    
    return results.map(row => ({
      id: row.id,
      created_at: row.created_at,
      settings: JSON.parse(row.settings_json)
    }));
  }
}