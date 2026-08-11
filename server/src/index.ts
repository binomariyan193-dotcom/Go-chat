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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow configured origins and dynamically credentials
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

app.get('/', (_req, res) => {
  res.status(200).send('LoopIN API Server is running');
});

// WebSockets Setup
const io = new Server(server, {
  cors: corsOptions,
});

setupSocketHandlers(io);

const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chat Server listening on 0.0.0.0:${PORT}`);
});
