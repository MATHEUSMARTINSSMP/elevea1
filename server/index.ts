import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { promises as fs } from 'fs';
import { initDatabase, SqliteStorage, IStorage } from './database';
import { createApiRoutes } from './routes';

// Configurações
const PORT = parseInt(process.env.PORT || '5000', 10);
const isDev = process.env.NODE_ENV !== 'production';

async function startServer() {
  console.log('🚀 Iniciando servidor Elevea...');

  // Inicializar banco de dados
  const { db, sqlite } = await initDatabase();
  const storage = new SqliteStorage(db);
  console.log('✅ Banco de dados inicializado');

  // Criar diretórios necessários
  await ensureDirectories();

  // Configurar Express
  const app = express();
  
  // Middlewares básicos
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Headers de segurança básica
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    });
    next();
  });

  // Log de requisições em desenvolvimento
  if (isDev) {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`, req.query);
      next();
    });
  }

  // Servir uploads (arquivos estáticos)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API Routes
  app.use('/api', createApiRoutes(storage));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      ok: true, 
      status: 'running', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Em produção, servir arquivos estáticos do frontend
  if (!isDev) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback - todas as rotas não-API retornam index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Em desenvolvimento, usar middleware Vite
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
  }

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Erro no servidor:', err);
    res.status(500).json({
      ok: false,
      error: isDev ? err.message : 'Erro interno do servidor'
    });
  });

  // Iniciar servidor
  const server = createServer(app);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌟 Servidor rodando em http://0.0.0.0:${PORT}`);
    console.log(`📊 Banco de dados: SQLite`);
    console.log(`🗂️  Uploads: ${path.join(process.cwd(), 'uploads')}`);
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

async function ensureDirectories() {
  const dirs = [
    'uploads',
    'data',
    'uploads/logos',
    'uploads/fotos',
    'uploads/assets'
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Criado diretório: ${dir}`);
    }
  }
}

// Iniciar apenas se executado diretamente
if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  });
}

export { startServer };