import { getDatabase } from '../db/database.js';
import { SiteService } from './siteService.js';

export class LeadService {
  static async createLead(leadData) {
    const db = getDatabase();
    const { siteSlug, name, email, phone, message, source = 'website', metadata = {} } = leadData;
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Validate required fields
    if (!name || !email) {
      throw new Error('name_and_email_required');
    }
    
    const stmt = db.prepare(`
      INSERT INTO leads (site_slug, name, email, phone, message, source, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      normalizedSlug,
      name.trim(),
      email.toLowerCase().trim(),
      phone?.trim() || null,
      message?.trim() || null,
      source,
      JSON.stringify(metadata)
    );
    
    return {
      id: result.lastInsertRowid,
      siteSlug: normalizedSlug,
      name,
      email,
      phone,
      message,
      source,
      metadata,
      createdAt: new Date().toISOString()
    };
  }

  static async getLeads(siteSlug, page = 1, pageSize = 20) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM leads WHERE site_slug = ?');
    const { total } = countStmt.get(normalizedSlug);
    
    // Get paginated leads
    const stmt = db.prepare(`
      SELECT id, name, email, phone, message, source, metadata, created_at
      FROM leads 
      WHERE site_slug = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const leads = stmt.all(normalizedSlug, pageSize, offset);
    
    return {
      leads: leads.map(lead => ({
        ...lead,
        metadata: JSON.parse(lead.metadata || '{}')
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  static async getLead(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
    const lead = stmt.get(id);
    
    if (!lead) {
      throw new Error('lead_not_found');
    }
    
    return {
      ...lead,
      metadata: JSON.parse(lead.metadata || '{}')
    };
  }

  static async deleteLead(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM leads WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error('lead_not_found');
    }
    
    return { deleted: true, id };
  }

  static async getLeadsByDateRange(siteSlug, startDate, endDate) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    const stmt = db.prepare(`
      SELECT id, name, email, phone, message, source, metadata, created_at
      FROM leads 
      WHERE site_slug = ? 
        AND created_at >= ? 
        AND created_at <= ?
      ORDER BY created_at DESC
    `);
    
    const leads = stmt.all(normalizedSlug, startDate, endDate);
    
    return leads.map(lead => ({
      ...lead,
      metadata: JSON.parse(lead.metadata || '{}')
    }));
  }
}