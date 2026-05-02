import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = Number(process.env.PORT || 4001);

  // Real-time Chat logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('message', (data) => {
      console.log('Message received:', data);
      // Broadcast to everyone else
      socket.broadcast.emit('message', {
        ...data,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', project: 'RentShield' });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // Serve index.html for all non-API routes in dev
    app.get('*', async (_req, res, next) => {
      if (_req.originalUrl.startsWith('/api')) return next();
      try {
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(_req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`RentShield Server running on http://localhost:${PORT}`);
  });
}

startServer();
