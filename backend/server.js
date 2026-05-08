require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const chatRoutes = require('./src/routes/chats');
const channelRoutes = require('./src/routes/channels');
const storyRoutes = require('./src/routes/stories');
const socketHandler = require('./src/socket');

const app = express();
const server = http.createServer(app);

  
const ALLOWED_ORIGINS = [
  'https://telegram-production-a2c5.up.railway.app',
  'http://localhost:3000',
  'http://localhost:5001',
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 50 * 1024 * 1024,
});

connectDB();

// 2. Helmet sozlamalarini biroz yumshatish (Frontend static fayllari ishlashi uchun)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // React/Vite build fayllari bloklanmasligi uchun
}));

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Statik papkalar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- FRONTEND INTEGRATSIYASI ---
// Frontend build fayllarini serverga ulash
// Agar frontend papkangiz 'frontend' bo'lsa va Vite represents 'dist' ishlatsangiz:
app.use(express.static(path.join(__dirname, '../frontend/build')));
// -------------------------------

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests' },
});
app.use('/api', globalLimiter);

// API yo'nalishlari
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/stories', storyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'KAYFQIL', version: '1.0.0' });
});

// 4. FRONTEND ROUTING (Muhim!)
// API-dan boshqa barcha so'rovlarni Frontend'ga yo'naltirish
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

socketHandler(io);



const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 KAYFQIL server running on port ${PORT}`);
});

  module.exports = { app, server };