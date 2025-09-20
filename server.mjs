/**
 * ELEVEA Backend Server - Replit-ready + Vite production serve
 * - Produção (Publishing Replit): serve dist/ e API no mesmo processo.
 * - Desenvolvimento local: use `npm run dev` (Vite) ou ligue o middleware com USE_VITE_MIDDLEWARE=1.
 */

import express from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config - Use PORT from environment (Replit sets this automatically)
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const isDev = NODE_ENV !== "production";
const USE_VITE_MIDDLEWARE = process.env.USE_VITE_MIDDLEWARE === "1"; // desligado por padrão no Replit

console.log("🚀 Starting ELEVEA Backend Server");
console.log(`🌟 ELEVEA Digital Agency Platform`);
console.log(`📊 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`🧰 USE_VITE_MIDDLEWARE: ${USE_VITE_MIDDLEWARE ? "ON" : "OFF"}`);

// Helper: import dinâmico tolerante a extensão
async function tryImport(basePath) {
  const candidates = [
    `${basePath}.mjs`,
    `${basePath}.js`,
    `${basePath}`, // sem extensão (se o arquivo exportar index, etc)
  ];
  for (const p of candidates) {
    try {
      return await import(p);
    } catch (e) {
      // tenta próximo
    }
  }
  throw new Error(`Module not found for base path: ${basePath}`);
}

async function startEleveaServer() {
  try {
    let initDatabase, seedDatabase;
    let authRoutes, subscriptionRoutes, settingsRoutes, assetsRoutes;
    let leadsRoutes, feedbacksRoutes, trafficRoutes, sitesRoutes;
    let SubscriptionService;

    try {
      // DB e serviços
      const dbModule = await tryImport("./src/db/database");
      initDatabase = dbModule.initDatabase;

      const seedModule = await tryImport("./src/utils/seed");
      seedDatabase = seedModule.seedDatabase;

      const subscriptionModule = await tryImport("./src/services/subscriptionService");
      SubscriptionService = subscriptionModule.SubscriptionService;

      // Rotas
      const authModule = await tryImport("./src/routes/auth");
      authRoutes = authModule.default;

      const subscriptionRoutesModule = await tryImport("./src/routes/subscription");
      subscriptionRoutes = subscriptionRoutesModule.default;

      const settingsModule = await tryImport("./src/routes/settings");
      settingsRoutes = settingsModule.default;

      const assetsModule = await tryImport("./src/routes/assets");
      assetsRoutes = assetsModule.default;

      const leadsModule = await tryImport("./src/routes/leads");
      leadsRoutes = leadsModule.default;

      const feedbacksModule = await tryImport("./src/routes/feedbacks");
      feedbacksRoutes = feedbacksModule.default;

      const trafficModule = await tryImport("./src/routes/traffic");
      trafficRoutes = trafficModule.default;

      const sitesModule = await tryImport("./src/routes/sites");
      sitesRoutes = sitesModule.default;

      console.log("✅ ELEVEA modules loaded successfully");
    } catch (error) {
      console.warn("⚠️  ELEVEA modules not fully available:", error?.message || error);
    }

    const app = express();

    // Trust proxy (para IP correto em Replit)
    app.set("trust proxy", true);

    // Middlewares
    app.use(
      cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Security headers
    app.use((req, res, next) => {
      res.set({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
      });
      next();
    });

    // Logs de API em dev
    if (isDev) {
      app.use((req, _res, next) => {
        if (req.path.startsWith("/api/")) {
          console.log(`📡 API ${req.method} ${req.path}`);
        }
        next();
      });
    }

    // Inicialização ELEVEA
    if (initDatabase && seedDatabase) {
      try {
        console.log("🔧 Initializing ELEVEA database...");
        await initDatabase();
        console.log("✅ ELEVEA database initialized");

        console.log("🌱 Seeding database...");
        await seedDatabase();

        const uploadsDir = path.join(process.cwd(), "uploads");
        try {
          await fs.access(uploadsDir);
        } catch {
          await fs.mkdir(uploadsDir, { recursive: true });
          console.log("📁 Created uploads directory");
        }
        app.use("/uploads", express.static(uploadsDir));

        // Health
        app.get("/api/health", (_req, res) => {
          res.json({
            ok: true,
            service: "ELEVEA Backend",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            environment: NODE_ENV,
            features: [
              "Authentication (JWT)",
              "Sites Management",
              "Settings with VIP PIN",
              "Assets Upload",
              "Leads Collection",
              "Feedbacks with Approval",
              "Traffic Analytics",
              "Subscription Management",
            ],
          });
        });

        // Rotas
        if (authRoutes) app.use("/api/auth", authRoutes);
        if (subscriptionRoutes) app.use("/api/subscription", subscriptionRoutes);
        if (settingsRoutes) app.use("/api/settings", settingsRoutes);
        if (assetsRoutes) app.use("/api/assets", assetsRoutes);
        if (leadsRoutes) app.use("/api/leads", leadsRoutes);
        if (feedbacksRoutes) app.use("/api/feedbacks", feedbacksRoutes);
        if (trafficRoutes) app.use("/api/traffic", trafficRoutes);
        if (sitesRoutes) app.use("/api", sitesRoutes);

        // Compat: client-plan “legado”
        app.get("/api/client-plan", async (req, res) => {
          try {
            const { email } = req.query;
            if (!email) {
              return res.status(400).json({ ok: false, error: "email_required" });
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
                  assets: status.isVip,
                },
              });
            } else {
              res.json({
                ok: true,
                plan: "essential",
                status: "active",
                siteSlug: "demo",
                features: { leads: true, feedbacks: true, traffic: true, assets: true },
              });
            }
          } catch (error) {
            console.error("Legacy client-plan error:", error);
            res.status(500).json({ ok: false, error: "internal_error" });
          }
        });

        console.log("✅ ELEVEA API routes configured");
      } catch (error) {
        console.warn("⚠️  ELEVEA initialization failed:", error?.message || error);
      }
    }

    // Fallback health
    app.get("/health", (_req, res) => {
      res.json({
        ok: true,
        service: "ELEVEA Server",
        timestamp: new Date().toISOString(),
        status: "running",
      });
    });

    // FRONTEND
    const distPath = path.join(process.cwd(), "dist");
    let distExists = false;
    try {
      await fs.access(distPath);
      distExists = true;
    } catch {
      distExists = false;
    }

    if (!isDev || !USE_VITE_MIDDLEWARE) {
      // Produção (ou dev sem middleware): servir dist se existir
      if (distExists) {
        app.use(express.static(distPath));
        // Serve React app for all non-API routes - using middleware approach
        app.use((req, res, next) => {
          if (!req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
            res.sendFile(path.join(distPath, "index.html"));
          } else {
            next();
          }
        });
        console.log("🎨 Serving static files from dist/");
      } else {
        console.log("📂 No dist directory found (API-only mode). Run `npm run build` to generate it.");
      }
    } else {
      // Dev com Vite middleware (opcional, e não recomendado no Replit)
      try {
        console.log("🔧 Setting up Vite middleware (dev)...");
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: {
            middlewareMode: true,
            // Importante: evite abrir outra porta no Replit
            // HMR padrão (mesma porta) — se quebrar, desligue USE_VITE_MIDDLEWARE
          },
          appType: "spa",
        });
        app.use(vite.ssrFixStacktrace);
        app.use(vite.middlewares);
        console.log("✅ Vite middleware configured");
      } catch (error) {
        console.warn("⚠️  Vite middleware failed. API-only mode:", error?.message || error);
      }
    }

    // 404 exclusivo para /api
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) {
        res.status(404).json({
          ok: false,
          error: "endpoint_not_found",
          path: req.path,
          available_endpoints: [
            "GET /api/health",
            "POST /api/auth/login",
            "GET /api/auth/me",
            "GET /api/subscription/status",
            "GET /api/settings",
            "POST /api/settings",
            "GET /api/assets",
            "PUT /api/assets",
            "POST /api/leads",
            "GET /api/leads",
            "POST /api/feedbacks",
            "GET /api/feedbacks",
            "POST /api/traffic/hit",
            "GET /api/traffic/daily",
            "GET /api/site-status",
            "POST /api/site/toggle",
          ],
        });
      } else {
        next();
      }
    });

    // Error handler
    app.use((error, _req, res, _next) => {
      console.error("🚨 Server Error:", error);

      if (error?.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          ok: false,
          error: "file_too_large",
          message: "File size exceeds limit",
        });
      }
      if (error?.message === "File type not allowed") {
        return res.status(400).json({
          ok: false,
          error: "invalid_file_type",
          message: "File type not allowed",
        });
      }
      res.status(500).json({
        ok: false,
        error: "internal_server_error",
        message: isDev ? error?.message : "Internal server error",
      });
    });

    // Start HTTP
    const server = createServer(app);
    const host = process.env.HOST || "0.0.0.0";
    server.listen(PORT, host, () => {
      console.log("");
      console.log("🌟 ELEVEA Backend Server Running!");
      console.log(`🔗 URL: http://${host}:${PORT}`);
      console.log(`🏥 Health Check: http://${host}:${PORT}/health`);
      console.log(`🛠️  API Endpoints: http://${host}:${PORT}/api/*`);
      console.log(`📁 File Uploads: http://${host}:${PORT}/uploads/`);
      console.log("");
      console.log("Default credentials (if ELEVEA loaded):");
      console.log("Admin: admin@elevea.com.br / admin123");
      console.log("Client: cliente@exemplo.com / cliente123");
      console.log("Site: SITE-EXEMPLO / PIN: exemplo123");
      console.log("");
      console.log("🚀 Ready to handle requests!");
    });

    // Tarefas de background (produção)
    if (!isDev && SubscriptionService?.processGracePeriodCheck) {
      setInterval(async () => {
        try {
          const result = await SubscriptionService.processGracePeriodCheck();
          if (result?.processed > 0) {
            console.log(`⏰ Grace period check: ${result.processed} accounts processed`);
          }
        } catch (error) {
          console.error("Grace period check error:", error);
        }
      }, 24 * 60 * 60 * 1000);
    }

    // Graceful shutdown
    const shutdown = async () => {
      console.log("🛑 Shutting down gracefully...");
      server.close(() => {
        console.log("🔌 HTTP server closed");
        process.exit(0);
      });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    return server;
  } catch (error) {
    console.error("❌ Failed to start ELEVEA server:", error);
    process.exit(1);
  }
}

startEleveaServer();