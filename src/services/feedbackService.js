import { getDatabase } from '../db/database.js';
import { SiteService } from './siteService.js';

export class FeedbackService {
  static async createFeedback(feedbackData) {
    const db = getDatabase();
    const { siteSlug, name, email, phone, rating, comment } = feedbackData;
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Validate required fields
    if (!rating || !comment) {
      throw new Error('rating_and_comment_required');
    }
    
    if (rating < 1 || rating > 5) {
      throw new Error('rating_must_be_between_1_and_5');
    }
    
    const stmt = db.prepare(`
      INSERT INTO feedbacks (site_slug, name, email, phone, rating, comment, approved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    
    const result = stmt.run(
      normalizedSlug,
      name?.trim() || null,
      email?.toLowerCase().trim() || null,
      phone?.trim() || null,
      rating,
      comment.trim()
    );
    
    return {
      id: result.lastInsertRowid,
      siteSlug: normalizedSlug,
      name,
      email,
      phone,
      rating,
      comment,
      approved: false,
      createdAt: new Date().toISOString()
    };
  }

  static async getFeedbacks(siteSlug, page = 1, pageSize = 20, options = {}) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    const { onlyApproved = false, includePrivateInfo = false } = options;
    const offset = (page - 1) * pageSize;
    
    // Build WHERE clause
    let whereClause = 'WHERE site_slug = ?';
    const params = [normalizedSlug];
    
    if (onlyApproved) {
      whereClause += ' AND approved = 1';
    }
    
    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM feedbacks ${whereClause}`);
    const { total } = countStmt.get(...params);
    
    // Select fields based on privacy settings
    let selectFields = 'id, name, rating, comment, approved, created_at';
    if (includePrivateInfo) {
      selectFields += ', email, phone';
    }
    
    // Get paginated feedbacks
    const stmt = db.prepare(`
      SELECT ${selectFields}
      FROM feedbacks 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const feedbacks = stmt.all(...params, pageSize, offset);
    
    return {
      feedbacks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  static async approveFeedback(id, approved, userId = null) {
    const db = getDatabase();
    
    const stmt = db.prepare('UPDATE feedbacks SET approved = ? WHERE id = ?');
    const result = stmt.run(approved ? 1 : 0, id);
    
    if (result.changes === 0) {
      throw new Error('feedback_not_found');
    }
    
    // Get updated feedback
    const getStmt = db.prepare('SELECT * FROM feedbacks WHERE id = ?');
    const feedback = getStmt.get(id);
    
    return {
      id: feedback.id,
      approved: Boolean(feedback.approved),
      updatedAt: new Date().toISOString()
    };
  }

  static async getFeedback(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM feedbacks WHERE id = ?');
    const feedback = stmt.get(id);
    
    if (!feedback) {
      throw new Error('feedback_not_found');
    }
    
    return feedback;
  }

  static async deleteFeedback(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM feedbacks WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error('feedback_not_found');
    }
    
    return { deleted: true, id };
  }

  static async getFeedbackStats(siteSlug) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN approved = 1 THEN 1 END) as approved,
        AVG(CAST(rating AS FLOAT)) as averageRating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating5,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating4,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating3,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating2,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating1
      FROM feedbacks 
      WHERE site_slug = ?
    `);
    
    const stats = stmt.get(normalizedSlug);
    
    return {
      total: stats.total,
      approved: stats.approved,
      pending: stats.total - stats.approved,
      averageRating: Math.round(stats.averageRating * 10) / 10 || 0,
      ratingDistribution: {
        5: stats.rating5,
        4: stats.rating4,
        3: stats.rating3,
        2: stats.rating2,
        1: stats.rating1
      }
    };
  }
}