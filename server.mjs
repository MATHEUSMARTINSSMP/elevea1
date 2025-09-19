import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import multer from 'multer';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import crypto from 'crypto';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const PORT = parseInt(process.env.PORT || '5000', 10);
const isDev = process.env.NODE_ENV !== 'production';

console.log('🚀 Iniciando servidor Elevea nativo...');

// Schema simplificado inline para evitar problemas de import
const sitesTable = 'sites';
const leadsTable = 'leads';
const feedbacksTable = 'feedbacks';
const trafficHitsTable = 'traffic_hits';
const assetsTable = 'assets';

// Inicializar banco
async function initDatabase() {
  const dbPath = path.join(__dirname, 'data', 'elevea.db');
  const dataDir = path.dirname(dbPath);
  
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  
  // Criar tabelas
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      full_name TEXT,
      company TEXT,
      phone TEXT,
      document TEXT,
      plan TEXT NOT NULL DEFAULT 'essential',
      status TEXT NOT NULL DEFAULT 'active',
      settings TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT,
      source TEXT DEFAULT 'website',
      metadata TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      name TEXT,
      email TEXT,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      approved INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS traffic_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      path TEXT DEFAULT '/',
      user_agent TEXT,
      ip TEXT,
      referrer TEXT,
      metadata TEXT DEFAULT '{}',
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_public INTEGER DEFAULT 1,
      uploaded_at INTEGER NOT NULL
    );
  `);
  
  const db = drizzle(sqlite);
  console.log('✅ Banco de dados inicializado');
  
  return { db, sqlite };
}

// Storage helper functions
function createStorage(db) {
  return {
    async getSite(siteSlug) {
      const result = await db.execute(sql`SELECT * FROM ${sql.raw(sitesTable)} WHERE site_slug = ${siteSlug} LIMIT 1`);
      return result[0] || null;
    },
    
    async createSite(data) {
      const now = Date.now();
      const result = await db.execute(
        sql`INSERT INTO ${sql.raw(sitesTable)} 
            (site_slug, email, full_name, company, phone, document, plan, status, settings, created_at, updated_at) 
            VALUES (${data.siteSlug}, ${data.email}, ${data.fullName || ''}, ${data.company || ''}, 
                    ${data.phone || ''}, ${data.document || ''}, ${data.plan || 'essential'}, 
                    'active', '{}', ${now}, ${now})`
      );
      return { id: result.lastInsertRowid, ...data, createdAt: now, updatedAt: now };
    },
    
    async updateSiteSettings(siteSlug, settings) {
      const now = Date.now();
      await db.execute(
        sql`UPDATE ${sql.raw(sitesTable)} 
            SET settings = ${JSON.stringify(settings)}, updated_at = ${now} 
            WHERE site_slug = ${siteSlug}`
      );
    },
    
    async listSites() {
      const result = await db.execute(sql`SELECT site_slug FROM ${sql.raw(sitesTable)}`);
      return result.map(r => r.site_slug);
    },
    
    async createLead(data) {
      const now = Date.now();
      const result = await db.execute(
        sql`INSERT INTO ${sql.raw(leadsTable)} 
            (site_slug, name, email, phone, message, source, metadata, created_at) 
            VALUES (${data.siteSlug}, ${data.name}, ${data.email}, ${data.phone || ''}, 
                    ${data.message || ''}, ${data.source || 'website'}, 
                    ${JSON.stringify(data.metadata || {})}, ${now})`
      );
      return { id: result.lastInsertRowid, ...data, createdAt: now };
    },
    
    async listLeads(siteSlug, page, pageSize) {
      const offset = (page - 1) * pageSize;
      const [leads, totalResult] = await Promise.all([
        db.execute(
          sql`SELECT * FROM ${sql.raw(leadsTable)} 
              WHERE site_slug = ${siteSlug} 
              ORDER BY created_at DESC 
              LIMIT ${pageSize} OFFSET ${offset}`
        ),
        db.execute(
          sql`SELECT COUNT(*) as count FROM ${sql.raw(leadsTable)} WHERE site_slug = ${siteSlug}`
        )
      ]);
      return { leads, total: totalResult[0].count, page, pageSize };
    },
    
    async createFeedback(data) {
      const now = Date.now();
      const result = await db.execute(
        sql`INSERT INTO ${sql.raw(feedbacksTable)} 
            (site_slug, name, email, rating, comment, approved, is_public, created_at) 
            VALUES (${data.siteSlug}, ${data.name || ''}, ${data.email || ''}, 
                    ${data.rating}, ${data.comment}, 0, 0, ${now})`
      );
      return { id: result.lastInsertRowid, ...data, createdAt: now };
    },
    
    async listFeedbacks(siteSlug, page, pageSize, onlyPublic = false) {
      const offset = (page - 1) * pageSize;
      const publicFilter = onlyPublic ? sql`AND is_public = 1` : sql``;
      
      const [feedbacks, totalResult] = await Promise.all([
        db.execute(
          sql`SELECT * FROM ${sql.raw(feedbacksTable)} 
              WHERE site_slug = ${siteSlug} ${publicFilter}
              ORDER BY created_at DESC 
              LIMIT ${pageSize} OFFSET ${offset}`
        ),
        db.execute(
          sql`SELECT COUNT(*) as count FROM ${sql.raw(feedbacksTable)} 
              WHERE site_slug = ${siteSlug} ${publicFilter}`
        )
      ]);
      return { feedbacks, total: totalResult[0].count, page, pageSize };
    },
    
    async recordHit(data) {
      const now = Date.now();
      await db.execute(
        sql`INSERT INTO ${sql.raw(trafficHitsTable)} 
            (site_slug, path, user_agent, ip, referrer, metadata, timestamp) 
            VALUES (${data.siteSlug}, ${data.path || '/'}, ${data.userAgent || ''}, 
                    ${data.ip || ''}, ${data.referrer || ''}, 
                    ${JSON.stringify(data.metadata || {})}, ${now})`
      );
    },
    
    async getTrafficStats(siteSlug, days) {
      const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      const [totalResult, dailyResult, topPagesResult] = await Promise.all([
        db.execute(
          sql`SELECT COUNT(*) as count FROM ${sql.raw(trafficHitsTable)} 
              WHERE site_slug = ${siteSlug} AND timestamp >= ${startTime}`
        ),
        db.execute(
          sql`SELECT DATE(timestamp/1000, 'unixepoch') as date, COUNT(*) as hits 
              FROM ${sql.raw(trafficHitsTable)} 
              WHERE site_slug = ${siteSlug} AND timestamp >= ${startTime} 
              GROUP BY DATE(timestamp/1000, 'unixepoch') 
              ORDER BY date`
        ),
        db.execute(
          sql`SELECT path, COUNT(*) as hits 
              FROM ${sql.raw(trafficHitsTable)} 
              WHERE site_slug = ${siteSlug} AND timestamp >= ${startTime} 
              GROUP BY path 
              ORDER BY hits DESC 
              LIMIT 10`
        )
      ]);
      
      return {
        totalHits: totalResult[0].count,
        uniqueVisitors: Math.floor(totalResult[0].count * 0.7), // Estimativa
        topPages: topPagesResult.map(p => ({ path: p.path, hits: p.hits })),
        dailyHits: dailyResult.map(d => ({ date: d.date, hits: d.hits }))
      };
    },
    
    async createAsset(data) {
      const now = Date.now();
      const result = await db.execute(
        sql`INSERT INTO ${sql.raw(assetsTable)} 
            (site_slug, filename, original_name, mimetype, size, path, category, is_public, uploaded_at) 
            VALUES (${data.siteSlug}, ${data.filename}, ${data.originalName}, 
                    ${data.mimetype}, ${data.size}, ${data.path}, 
                    ${data.category || 'general'}, ${data.isPublic ? 1 : 0}, ${now})`
      );
      return { id: result.lastInsertRowid, ...data, uploadedAt: now };
    },
    
    async listAssets(siteSlug) {
      return db.execute(
        sql`SELECT * FROM ${sql.raw(assetsTable)} 
            WHERE site_slug = ${siteSlug} 
            ORDER BY uploaded_at DESC`
      );
    }
  };
}

// Inicializar
async function startServer() {
  const { db, sqlite } = await initDatabase();
  const storage = createStorage(db);

  // Criar diretórios
  const dirs = ['uploads', 'data', 'uploads/logos', 'uploads/fotos', 'uploads/assets'];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Criado diretório: ${dir}`);
    }
  }

  const app = express();
  
  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Servir uploads
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ ok: true, status: 'running', timestamp: new Date().toISOString() });
  });

  // === API ROUTES ===
  
  // Sites
  app.get('/api/sites', async (req, res) => {
    try {
      const siteSlugs = await storage.listSites();
      res.json({ ok: true, siteSlugs });
    } catch (error) {
      console.error('Erro sites:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  app.post('/api/sites', async (req, res) => {
    try {
      const { siteSlug, email, fullName, company, phone, document, plan } = req.body;
      
      if (!siteSlug || !email) {
        return res.status(400).json({ ok: false, error: 'dados_obrigatorios' });
      }
      
      const existing = await storage.getSite(siteSlug);
      if (existing) {
        return res.status(400).json({ ok: false, error: 'siteSlug_ja_usado' });
      }

      const site = await storage.createSite(req.body);
      res.json({ ok: true, site });
    } catch (error) {
      console.error('Erro criar site:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // Settings
  app.get('/api/settings', async (req, res) => {
    try {
      const siteSlug = req.query.site;
      if (!siteSlug) return res.status(400).json({ ok: false, error: 'site_obrigatorio' });
      
      const site = await storage.getSite(siteSlug);
      if (!site) return res.status(404).json({ ok: false, error: 'site_nao_encontrado' });

      res.json({
        ok: true,
        siteSlug: site.site_slug,
        settings: JSON.parse(site.settings || '{}'),
        plan: site.plan,
        status: site.status
      });
    } catch (error) {
      console.error('Erro settings:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const { siteSlug, settings } = req.body;
      if (!siteSlug || !settings) return res.status(400).json({ ok: false, error: 'dados_obrigatorios' });

      await storage.updateSiteSettings(siteSlug, settings);
      res.json({ ok: true });
    } catch (error) {
      console.error('Erro salvar settings:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // Leads
  app.get('/api/leads', async (req, res) => {
    try {
      const siteSlug = req.query.site;
      if (!siteSlug) return res.status(400).json({ ok: false, error: 'site_obrigatorio' });
      
      const page = parseInt(req.query.page || '1', 10);
      const pageSize = parseInt(req.query.pageSize || '20', 10);

      const result = await storage.listLeads(siteSlug, page, pageSize);
      res.json({ ok: true, ...result });
    } catch (error) {
      console.error('Erro leads:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  app.post('/api/leads', async (req, res) => {
    try {
      const { siteSlug, name, email, phone, message, source } = req.body;
      
      if (!siteSlug || !name || !email) {
        return res.status(400).json({ ok: false, error: 'dados_obrigatorios' });
      }

      const lead = await storage.createLead(req.body);
      res.json({ ok: true, lead });
    } catch (error) {
      console.error('Erro criar lead:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // Feedbacks
  app.get('/api/feedbacks', async (req, res) => {
    try {
      const siteSlug = req.query.site;
      if (!siteSlug) return res.status(400).json({ ok: false, error: 'site_obrigatorio' });
      
      const page = parseInt(req.query.page || '1', 10);
      const pageSize = parseInt(req.query.pageSize || '20', 10);
      const onlyPublic = req.query.public === '1';

      const result = await storage.listFeedbacks(siteSlug, page, pageSize, onlyPublic);
      res.json({ ok: true, ...result });
    } catch (error) {
      console.error('Erro feedbacks:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  app.post('/api/feedbacks', async (req, res) => {
    try {
      const { siteSlug, rating, comment, name, email } = req.body;
      
      if (!siteSlug || !rating || !comment) {
        return res.status(400).json({ ok: false, error: 'dados_obrigatorios' });
      }

      const feedback = await storage.createFeedback(req.body);
      res.json({ ok: true, feedback });
    } catch (error) {
      console.error('Erro criar feedback:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // Traffic
  app.post('/api/hit', async (req, res) => {
    try {
      const { siteSlug, path } = req.body;
      if (!siteSlug) return res.status(400).json({ ok: false, error: 'site_obrigatorio' });

      await storage.recordHit({
        siteSlug,
        path: path || '/',
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        referrer: req.get('Referer'),
        metadata: req.body.metadata || {}
      });

      res.json({ ok: true });
    } catch (error) {
      console.error('Erro hit:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  app.get('/api/traffic', async (req, res) => {
    try {
      const siteSlug = req.query.site;
      if (!siteSlug) return res.status(400).json({ ok: false, error: 'site_obrigatorio' });
      
      const range = req.query.range || '30d';
      const days = parseInt(range.replace('d', ''), 10) || 30;

      const stats = await storage.getTrafficStats(siteSlug, days);
      res.json({ ok: true, ...stats });
    } catch (error) {
      console.error('Erro traffic:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // Client APIs (compatibilidade)
  app.get('/api/client-plan', async (req, res) => {
    try {
      const email = req.query.email;
      if (!email) return res.status(400).json({ ok: false, error: 'email_obrigatorio' });

      res.json({
        ok: true,
        plan: 'essential',
        status: 'active',
        siteSlug: 'demo',
        features: { leads: true, feedbacks: true, traffic: true, assets: true }
      });
    } catch (error) {
      console.error('Erro client-plan:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  app.get('/api/client-billing', async (req, res) => {
    try {
      const email = req.query.email;
      if (!email) return res.status(400).json({ ok: false, error: 'email_obrigatorio' });

      res.json({
        ok: true,
        plan: 'essential',
        status: 'active',
        provider: 'local',
        next_renewal: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        amount: 97,
        currency: 'BRL'
      });
    } catch (error) {
      console.error('Erro client-billing:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  app.get('/api/status', async (req, res) => {
    try {
      const siteSlug = req.query.site;
      if (!siteSlug) return res.status(400).json({ ok: false, error: 'site_obrigatorio' });

      const site = await storage.getSite(siteSlug);
      if (!site) return res.status(404).json({ ok: false, error: 'site_nao_encontrado' });

      res.json({
        ok: true,
        siteSlug: site.site_slug,
        status: site.status,
        plan: site.plan,
        active: site.status === 'active'
      });
    } catch (error) {
      console.error('Erro status:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // Assets (simplificado)
  app.get('/api/assets', async (req, res) => {
    try {
      const siteSlug = req.query.site;
      if (!siteSlug) return res.status(400).json({ ok: false, error: 'site_obrigatorio' });
      
      const assets = await storage.listAssets(siteSlug);
      res.json({ ok: true, assets });
    } catch (error) {
      console.error('Erro assets:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // Em desenvolvimento, usar middleware Vite
  if (isDev) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });

      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
      console.log('✅ Middleware Vite configurado');
    } catch (error) {
      console.warn('⚠️ Vite não disponível, servindo apenas API');
    }
  } else {
    // Em produção, servir arquivos estáticos
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler
  app.use((err, req, res, next) => {
    console.error('❌ Erro:', err);
    res.status(500).json({ ok: false, error: 'erro_interno' });
  });

  // Iniciar servidor
  const server = createServer(app);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌟 Servidor Elevea rodando em http://0.0.0.0:${PORT}`);
    console.log(`📊 Banco: SQLite (${path.join(__dirname, 'data', 'elevea.db')})`);
    console.log(`🗂️  Uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`⚙️  Modo: ${isDev ? 'desenvolvimento' : 'produção'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Fechando servidor...');
    sqlite.close();
    server.close(() => {
      console.log('✅ Servidor fechado');
      process.exit(0);
    });
  });

  return server;
}

startServer().catch(console.error);