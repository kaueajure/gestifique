import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import  { initDB } from  './db/init-db.js';
import  apiRoutes from  './routes/index.js';
import  { errorHandler } from  './middlewares/error-handler.js';
import  { env } from  './config/env.js';

async function startServer() {
  const app = express();
  const PORT = env.PORT;

  // Initial Config
  const allowedOrigins = env.CORS_ORIGINS;
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const isLocal = !env.IS_PROD && (
        origin.startsWith('http://localhost') || 
        origin.startsWith('http://127.0.0.1') ||
        origin.includes('.run.app') || // Support Google Cloud Run / Preview environments
        origin.includes('.studio') // Support AI Studio patterns
      );

      if (isLocal || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  
  // Hardened Boot Sequence
  try {
     console.log('[BOOT] Initializing database...');
     await initDB();
  } catch (err) {
     console.error("❌ CRITICAL: Database initialization failed.");
     if (env.IS_PROD) {
       console.error("Stopping server due to database failure in production.");
       process.exit(1);
     } else {
       console.warn("⚠️ Continuing in Development mode, but database features will be unavailable.");
     }
  }

  // API Routes
  app.use('/api', apiRoutes);

  // Health Checks
  app.get('/api/health/db', async (req, res) => {
    try {
      const { default: pool } = await import('./db/connection.js');
      await pool.query('SELECT 1');
      res.json({ success: true, status: 'CONNECTED' });
    } catch (err) {
      res.status(503).json({ success: false, status: 'DISCONNECTED', error: err instanceof Error ? err.message : String(err) });
    }
  });

  // API 404 Fallback
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Rota API não encontrada: ${req.originalUrl}`
    });
  });

  app.get('/health', (req, res) => {
    res.json({ success: true, status: 'UP', timestamp: new Date().toISOString() });
  });

  // Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (!env.IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Gestifique Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

startServer().catch(console.error);
