import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initDB } from './db/init-db.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { env } from './config/env.js';
import { EmailListenerService } from './services/email-listener.service.js';
import { runTicketAutomations } from './jobs/ticketAutomationJob.js';

export let io: SocketIOServer;

async function startServer() {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://gestifique.com.br',
    'https://www.gestifique.com.br',
    'https://cornflowerblue-kingfisher-528919.hostingersite.com',
    ...env.CORS_ORIGINS
  ];

  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin) return callback(null, true);

      const isLocal = !env.IS_PROD && (
        origin.startsWith('http://localhost') || 
        origin.startsWith('http://127.0.0.1') ||
        origin.includes('.run.app') || 
        origin.includes('.studio')
      );

      if (isLocal || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['set-cookie']
  };

  const app = express();
  
  // 1. Security Headers (Helmet) - Hardened for Production
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "ws:", "wss:", "https://*.run.app", "https://*.studio", ...env.CORS_ORIGINS],
        frameAncestors: ["'self'", "https://ai.studio", "https://*.studio.google.com"],
        upgradeInsecureRequests: env.IS_PROD ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
  }));

  // 2. Global Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
    skip: (req) => !env.IS_PROD || req.path.startsWith('/health')
  });
  app.use(globalLimiter);

  const httpServer = createServer(app);
  
  // WebSocket initialization if web server role is enabled
  if (env.ENABLE_WEB_SERVER) {
    io = new SocketIOServer(httpServer, {
      cors: corsOptions
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
  }

  const PORT = env.PORT;

  app.use(cors(corsOptions as cors.CorsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  
  // Database Boot
  try {
     console.log('[BOOT] Initializing database...');
     await initDB();
  } catch (err) {
     console.error("❌ CRITICAL: Database initialization failed.");
     if (env.IS_PROD) {
       console.error("Stopping server due to database failure in production.");
       process.exit(1);
     }
  }

  // Health Checks
  app.get('/health', (req, res) => {
    res.json({ 
      success: true, 
      status: 'UP', 
      timestamp: new Date().toISOString(),
      services: {
        web: env.ENABLE_WEB_SERVER,
        emailListener: env.ENABLE_EMAIL_LISTENER,
        jobs: env.ENABLE_TICKET_JOBS
      }
    });
  });

  // Services & Routes according to process roles
  if (env.ENABLE_WEB_SERVER) {
    app.use('/api', apiRoutes);

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
          return res.status(404).json({ success: false, message: 'Rota API não encontrada' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    // Worker role minimal responder
    app.get('/', (req, res) => res.status(503).send('Worker Node: HTTP server role disabled.'));
  }

  app.use(errorHandler);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Gestifique Server Instance running on port ${PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Roles: [WEB: ${env.ENABLE_WEB_SERVER}] [EMAIL_LISTENER: ${env.ENABLE_EMAIL_LISTENER}] [JOBS: ${env.ENABLE_TICKET_JOBS}]`);

    // Start Email Listener only if role is enabled
    if (env.ENABLE_EMAIL_LISTENER) {
      console.log('[BOOT] Starting Email Listener Service...');
      EmailListenerService.init();
    }

    // Start Jobs only if role is enabled
    if (env.ENABLE_TICKET_JOBS) {
      console.log('[BOOT] Starting Ticket Automation Jobs...');
      setInterval(() => {
        runTicketAutomations().catch(err => console.error('[JOB ERROR] runTicketAutomations:', err));
      }, 5 * 60 * 1000);
      
      setTimeout(() => {
        runTicketAutomations().catch(err => console.error('[JOB ERROR INITIAL] runTicketAutomations:', err));
      }, 5000);
    }
  });
}

startServer().catch(err => {
  console.error('❌ FATAL ERROR during server startup:', err);
  process.exit(1);
});
