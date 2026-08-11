import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ENV } from './config/env';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import mediaRoutes from './routes/media.routes';
import friendRoutes from './routes/friend.routes';
import { setupSocketHandlers } from './socket/connection';

const app = express();
const server = http.createServer(app);

// CORS configuration for REST API & Socket.io
const corsOptions = {
  origin: [ENV.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/friends', friendRoutes);

// Health check endpoint for Render
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSockets Setup
const io = new Server(server, {
  cors: corsOptions,
});

setupSocketHandlers(io);

server.listen(ENV.PORT, () => {
  console.log(`🚀 Chat Server listening on port ${ENV.PORT}`);
  console.log(`📡 Accepting connections from: ${ENV.FRONTEND_URL}`);
});
