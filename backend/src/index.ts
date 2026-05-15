import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config';
import { setupWebSocket } from './websocket/handler';
import { MemoryStore } from './memory/store';
import { VectorMemory } from './memory/vector';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: {
      entries: VectorMemory.count(),
      recent: MemoryStore.getRecent(1).length,
    },
  });
});

// Get user profile
app.get('/api/profile', (_req, res) => {
  const profile = MemoryStore.getUserProfile();
  res.json(profile);
});

// Update user profile
app.put('/api/profile', (req, res) => {
  MemoryStore.saveUserProfile(req.body);
  res.json({ success: true });
});

// Get relationship state
app.get('/api/relationship', (_req, res) => {
  const relationship = MemoryStore.getRelationship();
  res.json(relationship);
});

// Update relationship
app.put('/api/relationship', (req, res) => {
  MemoryStore.saveRelationship(req.body);
  res.json({ success: true });
});

// Get recent memories
app.get('/api/memories', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const memories = MemoryStore.getRecent(limit);
  res.json(memories);
});

// Search memories
app.get('/api/memories/search', (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  const results = MemoryStore.search(query);
  res.json(results);
});

// Delete a memory
app.delete('/api/memories/:id', (req, res) => {
  const deleted = MemoryStore.delete(req.params.id);
  if (deleted) {
    VectorMemory.remove(req.params.id);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Memory not found' });
  }
});

server.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     Digital Husband AI - Backend        ║
║     Server running on port ${config.port}         ║
║     WebSocket: ws://localhost:${config.port}/ws  ║
╚══════════════════════════════════════════╝
  `);
});
