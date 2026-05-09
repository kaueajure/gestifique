import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import  { initDB } from  './db/init-db.js';
import  apiRoutes from  './routes/index.js';
import  { errorHandler } from  './middlewares/error-handler.js';
import  { env } from  './config/env.js';
import { EmailListenerService } from './services/email-listener.service.js';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    const empresaId = socket.handshake.auth.empresa_id || socket.handshake.query.empresa_id;
    if (empresaId) {
      const room = `empresa_${empresaId}`;
      socket.join(room);
      console.log(`[Socket] User connected to room: ${room}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected`);
    });
  });

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

  // Health Checks (Global and API)
  app.get('/health', (req, res) => {
    res.json({ success: true, status: 'UP', timestamp: new Date().toISOString() });
  });

  app.get('/api/health/db', async (req, res) => {
    try {
      const { default: pool } = await import('./db/connection.js');
      await pool.query('SELECT 1');
      res.json({ success: true, status: 'CONNECTED' });
    } catch (err) {
      res.status(503).json({ success: false, status: 'DISCONNECTED', error: err instanceof Error ? err.message : String(err) });
    }
  });

  // API Routes
  app.use('/api', apiRoutes);

  // API 404 Fallback
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Rota API não encontrada: ${req.originalUrl}`
    });
  });

  // Error Handler
  app.use(errorHandler);

  // Static Assets / SPA Fallback
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
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ 
          success: false, 
          message: `Rota API não encontrada: ${req.originalUrl}` 
        });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Gestifique Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    EmailListenerService.init();
  });
}

startServer().catch(console.error);
