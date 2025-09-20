/**
 * ELEVEA Backend Server - Vite Integration
 * 
 * This server integrates the complete ELEVEA backend system with Vite for development.
 * It serves both the frontend (via Vite) and all ELEVEA API endpoints.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Use port 5000 to match workflow expectation
const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV !== 'production';

console.log('🚀 Starting ELEVEA Backend Server with Vite Integration...');
console.log(`🌟 ELEVEA Digital Agency Platform`);
console.log(`📊 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);

async function startEleveaServer() {
  try {
    // Import ELEVEA modules dynamically to catch errors
    let initDatabase, seedDatabase;
    let authRoutes, subscriptionRoutes, settingsRoutes, assetsRoutes, 
        leadsRoutes, feedbacksRoutes, trafficRoutes, sitesRoutes;
    let SubscriptionService;
    
    try {
      // Import ELEVEA database and services
      const dbModule = await import('./src/db/database.js');
      initDatabase = dbModule.initDatabase;
      
      const seedModule = await import('./src/utils/seed.js');
      seedDatabase = seedModule.seedDatabase;
      
      const subscriptionModule = await import('./src/services/subscriptionService.js');
      SubscriptionService = subscriptionModule.SubscriptionService;
      
      // Import all ELEVEA routes
      const authModule = await import('./src/routes/auth.js');
      authRoutes = authModule.default;
      
      const subscriptionRoutesModule = await import('./src/routes/subscription.js');
      subscriptionRoutes = subscriptionRoutesModule.default;
      
      const settingsModule = await import('./src/routes/settings.js');
      settingsRoutes = settingsModule.default;
      
      const assetsModule = await import('./src/routes/assets.js');
      assetsRoutes = assetsModule.default;
      
      const leadsModule = await import('./src/routes/leads.js');
      leadsRoutes = leadsModule.default;
      
      const feedbacksModule = await import('./src/routes/feedbacks.js');
      feedbacksRoutes = feedbacksModule.default;
      
      const trafficModule = await import('./src/routes/traffic.js');
      trafficRoutes = trafficModule.default;
      
      const sitesModule = await import('./src/routes/sites.js');
      sitesRoutes = sitesModule.default;
      
      console.log('✅ ELEVEA modules loaded successfully');
    } catch (error) {
      console.warn('⚠️  ELEVEA modules not available, falling back to basic server:', error.message);
    }
    
    // Create Express app
    const app = express();
    
    // Trust proxy (for proper IP detection)
    app.set('trust proxy', true);
    
    // Middleware
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Security headers
    app.use((req, res, next) => {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block'
      });
      next();
    });
    
    // Request logging in development
    if (isDev) {
      app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) {
          console.log(`📡 API ${req.method} ${req.path}`, {
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined
          });
        }
        next();
      });
    }
    
    // Initialize ELEVEA system if available
    if (initDatabase && seedDatabase) {
      try {
        console.log('🔧 Initializing ELEVEA database...');
        await initDatabase();
        console.log('✅ ELEVEA database initialized');
        
        console.log('🌱 Seeding database...');
        await seedDatabase();
        
        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'uploads');
        try {
          await fs.access(uploadsDir);
        } catch {
          await fs.mkdir(uploadsDir, { recursive: true });
          console.log('📁 Created uploads directory');
        }
        
        // Serve uploaded files
        app.use('/uploads', express.static(uploadsDir));
        
        // ELEVEA API Health check
        app.get('/api/health', (req, res) => {
          res.json({
            ok: true,
            service: 'ELEVEA Backend',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV,
            features: [
              'Authentication (JWT)',
              'Sites Management',
              'Settings with VIP PIN',
              'Assets Upload',
              'Leads Collection',
              'Feedbacks with Approval',
              'Traffic Analytics',
              'Subscription Management'
            ]
          });
        });
        
        // ELEVEA API Routes
        if (authRoutes) app.use('/api/auth', authRoutes);
        if (subscriptionRoutes) app.use('/api/subscription', subscriptionRoutes);
        if (settingsRoutes) app.use('/api/settings', settingsRoutes);
        if (assetsRoutes) app.use('/api/assets', assetsRoutes);
        if (leadsRoutes) app.use('/api/leads', leadsRoutes);
        if (feedbacksRoutes) app.use('/api/feedbacks', feedbacksRoutes);
        if (trafficRoutes) app.use('/api/traffic', trafficRoutes);
        if (sitesRoutes) app.use('/api', sitesRoutes);
        
        // Legacy compatibility routes
        app.get('/api/client-plan', async (req, res) => {
          try {
            const { email } = req.query;
            if (!email) {
              return res.status(400).json({ ok: false, error: 'email_required' });
            }
            
            if (SubscriptionService) {
              const status = await SubscriptionService.getSubscriptionStatus(null, email);
              res.json({
                ok: true,
                plan: status.plan,
                status: status.status,
                siteSlug: status.siteSlug,
                features: {
                  leads: true,
                  feedbacks: true,
                  traffic: true,
                  assets: status.isVip
                }
              });
            } else {
              res.json({
                ok: true,
                plan: 'essential',
                status: 'active',
                siteSlug: 'demo',
                features: { leads: true, feedbacks: true, traffic: true, assets: true }
              });
            }
          } catch (error) {
            console.error('Legacy client-plan error:', error);
            res.status(500).json({ ok: false, error: 'internal_error' });
          }
        });
        
        console.log('✅ ELEVEA API routes configured');
        
      } catch (error) {
        console.warn('⚠️  ELEVEA initialization failed, continuing with basic server:', error.message);
      }
    }
    
    // Basic health check (fallback)
    app.get('/health', (req, res) => {
      res.json({
        ok: true,
        service: 'ELEVEA Server',
        timestamp: new Date().toISOString(),
        status: 'running'
      });
    });
    
    // In development, try to integrate with Vite
    if (isDev) {
      try {
        console.log('🔧 Setting up Vite integration...');
        
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            hmr: { port: PORT + 1 } // Use next port for HMR
          },
          appType: 'spa'
        });
        
        // Use Vite's middleware for frontend
        app.use(vite.ssrFixStacktrace);
        app.use(vite.middlewares);
        
        console.log('✅ Vite middleware configured');
        console.log(`🎨 Frontend will be served by Vite on port ${PORT}`);
      } catch (error) {
        console.warn('⚠️  Vite integration failed, running API-only mode:', error.message);
      }
    } else {
      // In production, serve static files from dist directory
      const distPath = path.join(process.cwd(), 'dist');
      try {
        await fs.access(distPath);
        app.use(express.static(distPath));
        
        // SPA fallback for non-API routes
        app.get('*', (req, res) => {
          if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
            res.sendFile(path.join(distPath, 'index.html'));
          } else {
            res.status(404).json({
              ok: false,
              error: 'endpoint_not_found',
              path: req.path
            });
          }
        });
        
        console.log('🎨 Serving static files from dist/');
      } catch {
        console.log('📂 No dist directory found, API-only mode');
      }
    }
    
    // 404 handler for API routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({
          ok: false,
          error: 'endpoint_not_found',
          path: req.path,
          available_endpoints: [
            'GET /api/health',
            'POST /api/auth/login',
            'GET /api/auth/me',
            'GET /api/subscription/status',
            'GET /api/settings',
            'POST /api/settings',
            'GET /api/assets',
            'PUT /api/assets',
            'POST /api/leads',
            'GET /api/leads',
            'POST /api/feedbacks',
            'GET /api/feedbacks',
            'POST /api/traffic/hit',
            'GET /api/traffic/daily',
            'GET /api/site-status',
            'POST /api/site/toggle'
          ]
        });
      } else {
        next();
      }
    });
    
    // Global error handler
    app.use((error, req, res, next) => {
      console.error('🚨 Server Error:', error);
      
      // Handle Multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          ok: false,
          error: 'file_too_large',
          message: 'File size exceeds 10MB limit'
        });
      }
      
      if (error.message === 'File type not allowed') {
        return res.status(400).json({
          ok: false,
          error: 'invalid_file_type',
          message: 'File type not allowed'
        });
      }
      
      res.status(500).json({
        ok: false,
        error: 'internal_server_error',
        message: isDev ? error.message : 'Internal server error'
      });
    });
    
    // Create and start server
    const server = createServer(app);
    
    // Bind to the correct address and port
    const host = process.env.HOST || '0.0.0.0';
    
    server.listen(PORT, host, () => {
      console.log('');
      console.log('🌟 ELEVEA Backend Server Running!');
      console.log(`🔗 URL: http://${host}:${PORT}`);
      console.log(`🏥 Health Check: http://${host}:${PORT}/health`);
      console.log(`🛠️  API Endpoints: http://${host}:${PORT}/api/*`);
      console.log(`📁 File Uploads: http://${host}:${PORT}/uploads/`);
      console.log('');
      console.log('Default credentials (if ELEVEA loaded):');
      console.log('Admin: admin@elevea.com.br / admin123');
      console.log('Client: cliente@exemplo.com / cliente123');
      console.log('Site: SITE-EXEMPLO / PIN: exemplo123');
      console.log('');
      console.log('🚀 Ready to handle requests!');
    });
    
    // Setup background tasks if available
    if (!isDev && SubscriptionService) {
      // Run grace period check daily in production
      setInterval(async () => {
        try {
          const result = await SubscriptionService.processGracePeriodCheck();
          if (result.processed > 0) {
            console.log(`⏰ Grace period check: ${result.processed} accounts processed`);
          }
        } catch (error) {
          console.error('Grace period check error:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log('🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('🔌 HTTP server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start ELEVEA server:', error);
    process.exit(1);
  }
}

// Start server
startEleveaServer();