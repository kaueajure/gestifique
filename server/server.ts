import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initDB } from './db/init-db';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error-handler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initial Config
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  
  // Try to Init DB
  try {
     await initDB();
  } catch (err) {
     console.error("Database connection failed. Proceeding anyway, but API will fail.");
  }

  // API Routes
  app.use('/api', apiRoutes);

  // Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Gestifique Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(console.error);
