import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import next from 'next';
import { createApiRouter } from './server/api.js';
import { partyData } from './server/store.js';

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3001;

const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.use(cors());
  app.use(express.json());

  // REST APIs
  app.use('/api', createApiRouter(io));

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Send current initial state on connection
    socket.emit('initial_state', {
      party: partyData.party,
      host: partyData.host,
      popups: partyData.popups,
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Everything else goes to Next.js (pages, static assets, HMR, etc.)
  app.all('*', (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`🎉 BeattheIce server running on http://localhost:${port}`);
  });
});
