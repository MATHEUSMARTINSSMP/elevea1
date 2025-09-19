import { getDatabase } from '../db/database.js';
import { SiteService } from './siteService.js';

export class TrafficService {
  static async recordHit(hitData) {
    const db = getDatabase();
    const { siteSlug, path = '/', ip, userAgent } = hitData;
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    const stmt = db.prepare(`
      INSERT INTO traffic_hits (site_slug, path, ip, user_agent)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(normalizedSlug, path, ip || '', userAgent || '');
    
    return {
      id: result.lastInsertRowid,
      siteSlug: normalizedSlug,
      path,
      recordedAt: new Date().toISOString()
    };
  }

  static async getDailyStats(siteSlug, range = '30d') {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Parse range (7d, 30d, all)
    let daysBack = 30;
    if (range === '7d') daysBack = 7;
    else if (range === 'all') daysBack = 365 * 10; // 10 years
    else if (range.endsWith('d')) {
      const parsed = parseInt(range.replace('d', ''));
      if (!isNaN(parsed)) daysBack = parsed;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString();
    
    // Get daily hits
    const dailyStmt = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as hits
      FROM traffic_hits 
      WHERE site_slug = ? AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    const dailyHits = dailyStmt.all(normalizedSlug, startDateStr);
    
    // Get total hits in period
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM traffic_hits 
      WHERE site_slug = ? AND created_at >= ?
    `);
    
    const { total } = totalStmt.get(normalizedSlug, startDateStr);
    
    // Get unique visitors estimate (by IP)
    const uniqueStmt = db.prepare(`
      SELECT COUNT(DISTINCT ip) as unique_visitors
      FROM traffic_hits 
      WHERE site_slug = ? AND created_at >= ? AND ip != ''
    `);
    
    const { unique_visitors } = uniqueStmt.get(normalizedSlug, startDateStr);
    
    // Get top pages
    const pagesStmt = db.prepare(`
      SELECT 
        path,
        COUNT(*) as hits
      FROM traffic_hits 
      WHERE site_slug = ? AND created_at >= ?
      GROUP BY path
      ORDER BY hits DESC
      LIMIT 10
    `);
    
    const topPages = pagesStmt.all(normalizedSlug, startDateStr);
    
    return {
      period: {
        range,
        startDate: startDateStr,
        endDate: new Date().toISOString()
      },
      summary: {
        totalHits: total,
        uniqueVisitors: unique_visitors || Math.floor(total * 0.7), // Fallback estimate
        averageDailyHits: dailyHits.length > 0 ? Math.round(total / daysBack) : 0
      },
      dailyHits,
      topPages: topPages.map(page => ({
        path: page.path,
        hits: page.hits,
        percentage: total > 0 ? Math.round((page.hits / total) * 100) : 0
      }))
    };
  }

  static async getHourlyStats(siteSlug, date) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Get hourly distribution for a specific date
    const stmt = db.prepare(`
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as hits
      FROM traffic_hits 
      WHERE site_slug = ? AND DATE(created_at) = DATE(?)
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `);
    
    const hourlyData = stmt.all(normalizedSlug, date);
    
    // Fill missing hours with 0
    const hourlyHits = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      const data = hourlyData.find(h => h.hour === hourStr);
      hourlyHits.push({
        hour: hourStr,
        hits: data ? data.hits : 0
      });
    }
    
    return {
      date,
      hourlyHits,
      totalHits: hourlyHits.reduce((sum, h) => sum + h.hits, 0)
    };
  }

  static async getTopReferrers(siteSlug, days = 30) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stmt = db.prepare(`
      SELECT 
        CASE 
          WHEN user_agent LIKE '%Google%' THEN 'Google'
          WHEN user_agent LIKE '%Facebook%' THEN 'Facebook'
          WHEN user_agent LIKE '%Instagram%' THEN 'Instagram'
          WHEN user_agent LIKE '%WhatsApp%' THEN 'WhatsApp'
          WHEN user_agent LIKE '%bot%' OR user_agent LIKE '%Bot%' THEN 'Bots'
          ELSE 'Direct/Other'
        END as source,
        COUNT(*) as hits
      FROM traffic_hits 
      WHERE site_slug = ? 
        AND created_at >= ?
        AND user_agent IS NOT NULL 
        AND user_agent != ''
      GROUP BY source
      ORDER BY hits DESC
    `);
    
    return stmt.all(normalizedSlug, startDate.toISOString());
  }

  static async getRecentHits(siteSlug, limit = 50) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    const stmt = db.prepare(`
      SELECT path, ip, user_agent, created_at
      FROM traffic_hits 
      WHERE site_slug = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    return stmt.all(normalizedSlug, limit);
  }
}