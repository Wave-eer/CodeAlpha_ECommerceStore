const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { initDb } = require('./db');
const { JWT_SECRET } = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// Single Page Application Fallback
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Socket.io Connection & Room Logic
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  // Automatically join user personal room if authenticated
  if (socket.user && socket.user.id) {
    socket.join(`user_${socket.user.id}`);
    console.log(`👤 Socket ${socket.id} joined personal room user_${socket.user.id}`);
  }

  // Join Project Room for real-time board sync
  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`📁 Socket ${socket.id} joined project room project_${projectId}`);
  });

  // Leave Project Room
  socket.on('leave_project', (projectId) => {
    socket.leave(`project_${projectId}`);
    console.log(`🚪 Socket ${socket.id} left project room project_${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Initialize DB and start server
initDb();

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 Project Management Tool running on port ${PORT}`);
  console.log(`🌐 Local URL: http://0.0.0.0:${PORT}`);
  console.log(`==================================================`);
});
