import { getDatabase } from '../db/database.js';
import { SiteService } from './siteService.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Media aliases mapping
const MEDIA_ALIASES = {
  'media_1': ['hero', 'banner', 'principal'],
  'media_2': ['destaque_1', 'gallery_1'],
  'media_3': ['destaque_2', 'gallery_2'],
  'media_4': ['gallery_3'],
  'media_5': ['gallery_4'],
  'media_6': ['gallery_5']
};

export class AssetService {
  static async createAsset(siteSlug, key, fileData) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', normalizedSlug);
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Generate filename
    const timestamp = Date.now();
    const extension = path.extname(fileData.originalname || '');
    const filename = `${key}_${timestamp}${extension}`;
    const filepath = path.join(uploadDir, filename);
    
    // Save file
    await fs.writeFile(filepath, fileData.buffer);
    
    // Create public URL
    const publicUrl = `/uploads/${normalizedSlug}/${filename}`;
    
    // Remove existing asset with same key
    const deleteStmt = db.prepare('DELETE FROM assets WHERE site_slug = ? AND key = ?');
    deleteStmt.run(normalizedSlug, key);
    
    // Insert new asset
    const stmt = db.prepare(`
      INSERT INTO assets (site_slug, key, url, original_name, mimetype, size)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      normalizedSlug,
      key,
      publicUrl,
      fileData.originalname || filename,
      fileData.mimetype || 'application/octet-stream',
      fileData.size || fileData.buffer?.length || 0
    );
    
    return {
      id: result.lastInsertRowid,
      key,
      url: publicUrl,
      originalName: fileData.originalname,
      mimetype: fileData.mimetype,
      size: fileData.size
    };
  }

  static async getAssets(siteSlug) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    const stmt = db.prepare(`
      SELECT key, url, original_name, mimetype, size, created_at
      FROM assets 
      WHERE site_slug = ? 
      ORDER BY created_at DESC
    `);
    
    const assets = stmt.all(normalizedSlug);
    const assetsWithAliases = [];
    
    // Add original assets
    for (const asset of assets) {
      assetsWithAliases.push({
        key: asset.key,
        url: asset.url,
        originalName: asset.original_name,
        mimetype: asset.mimetype,
        size: asset.size,
        createdAt: asset.created_at
      });
      
      // Add aliases for media keys
      if (MEDIA_ALIASES[asset.key]) {
        for (const alias of MEDIA_ALIASES[asset.key]) {
          assetsWithAliases.push({
            key: alias,
            url: asset.url,
            originalName: asset.original_name,
            mimetype: asset.mimetype,
            size: asset.size,
            createdAt: asset.created_at,
            isAlias: true,
            originalKey: asset.key
          });
        }
      }
    }
    
    return assetsWithAliases;
  }

  static async deleteAsset(siteSlug, key) {
    const db = getDatabase();
    const normalizedSlug = SiteService.normalizeSiteSlug(siteSlug);
    
    // Get asset info before deletion
    const stmt = db.prepare('SELECT * FROM assets WHERE site_slug = ? AND key = ?');
    const asset = stmt.get(normalizedSlug, key);
    
    if (!asset) {
      throw new Error('asset_not_found');
    }
    
    // Delete from database
    const deleteStmt = db.prepare('DELETE FROM assets WHERE site_slug = ? AND key = ?');
    deleteStmt.run(normalizedSlug, key);
    
    // Try to delete physical file
    try {
      const fullPath = path.join(process.cwd(), asset.url.replace(/^\//, ''));
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn('Could not delete physical file:', error.message);
    }
    
    return { deleted: true, key, url: asset.url };
  }

  static resolveMediaKey(key) {
    // If it's an alias, find the original media key
    for (const [mediaKey, aliases] of Object.entries(MEDIA_ALIASES)) {
      if (aliases.includes(key)) {
        return mediaKey;
      }
    }
    // If it's already a media key or other key, return as is
    return key;
  }
}