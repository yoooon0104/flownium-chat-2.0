const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

async function start() {
  const { MONGODB_URI, PORT } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  if (!PORT) {
    throw new Error('PORT is not set in environment variables');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});