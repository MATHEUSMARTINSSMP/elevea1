import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

// Import database
import { initDatabase, closeDatabase } from './db/database.js';

// Import services  
import { SubscriptionService } from './services/subscriptionService.js';

// Import routes
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import settingsRoutes from './routes/settings.js';
import assetsRoutes from './routes/assets.js';
import leadsRoutes from './routes/leads.js';
import feedbacksRoutes from './routes/feedbacks.js';
import trafficRoutes from './routes/traffic.js';
import sitesRoutes from './routes/sites.js';

// Import utilities
import { seedDatabase } from './utils/seed.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV !== 'production';

console.log('🚀 Starting ELEVEA Backend Server...');
console.log(`📊 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);

async function createApp() {
  // Initialize database
  await initDatabase();
  console.log('✅ Database initialized');
  
  // Seed database with default data
  await seedDatabase();
  
  // Create Express app
  const app = express();
  
  // Trust proxy (for proper IP detection)
  app.set('trust proxy', true);
  
  // Middleware
  app.use(cors({
    origin: true, // Allow all origins in development
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
      console.log(`${req.method} ${req.path}`, {
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      });
      next();
    });
  }
  
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
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      service: 'ELEVEA Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV
    });
  });
  
  // API Routes with /api prefix
  app.use('/api/auth', authRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/assets', assetsRoutes);
  app.use('/api/leads', leadsRoutes);
  app.use('/api/feedbacks', feedbacksRoutes);
  app.use('/api/traffic', trafficRoutes);
  app.use('/api', sitesRoutes); // Sites routes are at root level (/api/site-status, etc.)
  
  // Legacy compatibility routes (for existing integrations)
  app.get('/api/client-plan', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ ok: false, error: 'email_required' });
      }
      
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
    } catch (error) {
      console.error('Legacy client-plan error:', error);
      res.status(500).json({ ok: false, error: 'internal_error' });
    }
  });
  
  app.get('/api/client-billing', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ ok: false, error: 'email_required' });
      }
      
      const status = await SubscriptionService.getSubscriptionStatus(null, email);
      
      res.json({
        ok: true,
        plan: status.plan,
        status: status.status,
        provider: status.provider,
        next_renewal: status.nextCharge,
        amount: status.amount,
        currency: status.currency
      });
    } catch (error) {
      console.error('Legacy client-billing error:', error);
      res.status(500).json({ ok: false, error: 'internal_error' });
    }
  });
  
  // Frontend integration (if needed)
  if (!isDev) {
    // In production, serve static files from dist directory
    const distPath = path.join(process.cwd(), 'dist');
    try {
      await fs.access(distPath);
      app.use(express.static(distPath));
      
      // SPA fallback for non-API routes
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      
      console.log('🎨 Serving static files from dist/');
    } catch {
      console.log('📂 No dist directory found, API-only mode');
    }
  } else {
    // In development, try to set up Vite middleware if available
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      
      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
      console.log('✅ Vite middleware configured');
    } catch (error) {
      console.log('ℹ️  Running in API-only mode (Vite not available)');
    }
  }
  
  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      ok: false,
      error: 'endpoint_not_found',
      path: req.path
    });
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
  
  return app;
}

async function startServer() {
  try {
    const app = await createApp();
    const server = createServer(app);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🌟 ELEVEA Backend Server Running!');
      console.log(`🔗 URL: http://0.0.0.0:${PORT}`);
      console.log(`📊 Health Check: http://0.0.0.0:${PORT}/health`);
      console.log(`🛠️  API Docs: All endpoints available at /api/*`);
      console.log('');
      console.log('Ready to handle requests from Netlify landing pages! 🚀');
    });
    
    // Setup background tasks
    if (!isDev) {
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
    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('🔌 HTTP server closed');
        closeDatabase();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.log('🔌 HTTP server closed');
        closeDatabase();
        process.exit(0);
      });
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { createApp, startServer };