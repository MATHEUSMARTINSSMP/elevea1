import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';
import { generateToken } from '../middlewares/auth.js';

export class AuthService {
  static async login(email, password) {
    const db = getDatabase();
    
    // Find user by email (case insensitive)
    const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
    const user = stmt.get(email.toLowerCase().trim());
    
    if (!user) {
      throw new Error('invalid_credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('invalid_credentials');
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        siteSlug: user.site_slug,
        plan: user.plan,
        billingStatus: user.billing_status
      }
    };
  }

  static async createUser(userData) {
    const db = getDatabase();
    const { email, password, role = 'client', siteSlug, plan = 'essential' } = userData;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, role, site_slug, plan, billing_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    try {
      const result = stmt.run(
        email.toLowerCase().trim(),
        passwordHash,
        role,
        siteSlug || null,
        plan
      );

      return {
        id: result.lastInsertRowid,
        email,
        role,
        siteSlug,
        plan
      };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('email_already_exists');
      }
      throw error;
    }
  }

  static async getUserById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static async updateBillingStatus(userId, status, nextDate = null, amount = null) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE users 
      SET billing_status = ?, billing_next = ?, billing_amount = ?
      WHERE id = ?
    `);
    
    return stmt.run(status, nextDate, amount, userId);
  }
}