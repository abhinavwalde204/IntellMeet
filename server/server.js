import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as Sentry from '@sentry/node';
import client from 'prom-client';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
});

// Setup Prometheus Metrics Registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
register.registerMetric(httpRequestDurationSeconds);

// Centralized list of allowed origins for both Express CORS and Socket.io CORS.
// CLIENT_URL should be set in Render's dashboard (Environment tab) to your
// production Vercel URL, e.g. https://intellmeet-gold.vercel.app (no trailing slash).
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://intell-meet-gold.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const corsOriginCheck = function (origin, callback) {
  // Allow requests with no origin (e.g. server-to-server, curl, mobile apps)
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    console.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
};

async function startServer() {
  // Connect to MongoDB FIRST
  await connectDB();

  const app = express();
  const httpServer = createServer(app);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({
    origin: corsOriginCheck,
    credentials: true
  }));
  app.use(helmet());
  app.use(mongoSanitize());

  // Measure request duration middleware for Prometheus
  app.use((req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
      const duration = process.hrtime(start);
      const durationInSeconds = duration[0] + duration[1] / 1e9;
      httpRequestDurationSeconds
        .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
        .observe(durationInSeconds);
    });
    next();
  });

  // Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: corsOriginCheck,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('send-message', (roomId, message) => {
      socket.to(roomId).emit('receive-message', message);
    });

    socket.on('transcript-update', (roomId, entry) => {
      socket.to(roomId).emit('transcript-entry', entry);
    });

    socket.on('task-update', (workspaceId, task) => {
      socket.to(`workspace-${workspaceId}`).emit('task-updated', task);
    });

    socket.on('join-workspace', (workspaceId) => {
      socket.join(`workspace-${workspaceId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Make io accessible to route handlers
  app.set('io', io);

  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to IntellMeet API' });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Sentry error handler
  Sentry.setupExpressErrorHandler(app);

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'IntellMeet API is running' });
  });

  app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});