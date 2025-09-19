import express from 'express';
import multer from 'multer';
import { AssetService } from '../services/assetService.js';
import { verifyToken, requireVipOrAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'video/mp4', 'video/webm'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// GET /api/assets?site=SLUG
router.get('/', async (req, res) => {
  try {
    const { site } = req.query;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    const assets = await AssetService.getAssets(site);
    
    res.json({
      ok: true,
      assets
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// PUT /api/assets (VIP or Admin only)
router.put('/', verifyToken, requireVipOrAdmin, upload.single('file'), async (req, res) => {
  try {
    const { site, key } = req.body;
    const file = req.file;
    
    if (!site || !key || !file) {
      return res.status(400).json({
        ok: false,
        error: 'site_key_and_file_required'
      });
    }
    
    // Resolve media key (handle aliases)
    const resolvedKey = AssetService.resolveMediaKey(key);
    
    const asset = await AssetService.createAsset(site, resolvedKey, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    res.json({
      ok: true,
      asset
    });
  } catch (error) {
    console.error('Upload asset error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// POST /api/assets/upload_base64 (VIP or Admin only)
router.post('/upload_base64', verifyToken, requireVipOrAdmin, async (req, res) => {
  try {
    const { site, logo, fotos } = req.body;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    const uploadedAssets = [];
    
    // Handle logo upload
    if (logo) {
      try {
        const buffer = Buffer.from(logo.split(',')[1], 'base64');
        const mimeType = logo.split(',')[0].match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const extension = mimeType.split('/')[1] || 'jpg';
        
        const asset = await AssetService.createAsset(site, 'logo', {
          buffer,
          originalname: `logo.${extension}`,
          mimetype: mimeType,
          size: buffer.length
        });
        
        uploadedAssets.push(asset);
      } catch (error) {
        console.error('Logo upload error:', error);
      }
    }
    
    // Handle fotos uploads
    if (fotos && Array.isArray(fotos)) {
      for (let i = 0; i < fotos.length && i < 6; i++) {
        try {
          const foto = fotos[i];
          const buffer = Buffer.from(foto.split(',')[1], 'base64');
          const mimeType = foto.split(',')[0].match(/data:([^;]+)/)?.[1] || 'image/jpeg';
          const extension = mimeType.split('/')[1] || 'jpg';
          const key = `media_${i + 1}`;
          
          const asset = await AssetService.createAsset(site, key, {
            buffer,
            originalname: `${key}.${extension}`,
            mimetype: mimeType,
            size: buffer.length
          });
          
          uploadedAssets.push(asset);
        } catch (error) {
          console.error(`Foto ${i + 1} upload error:`, error);
        }
      }
    }
    
    res.json({
      ok: true,
      uploaded: uploadedAssets.length,
      assets: uploadedAssets
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

// DELETE /api/assets/:key?site=SLUG (VIP or Admin only)
router.delete('/:key', verifyToken, requireVipOrAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { site } = req.query;
    
    if (!site) {
      return res.status(400).json({
        ok: false,
        error: 'site_required'
      });
    }
    
    const result = await AssetService.deleteAsset(site, key);
    
    res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    
    if (error.message === 'asset_not_found') {
      return res.status(404).json({
        ok: false,
        error: 'asset_not_found'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: 'internal_error'
    });
  }
});

export default router;