import fs from 'fs';
import { config } from '../config';

interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  tags: string[];
}

let vectorStore: VectorEntry[] = [];

function load(): void {
  try {
    if (fs.existsSync(config.memory.vectorPath)) {
      vectorStore = JSON.parse(fs.readFileSync(config.memory.vectorPath, 'utf-8'));
    }
  } catch {
    vectorStore = [];
  }
}

function save(): void {
  const dir = require('path').dirname(config.memory.vectorPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.memory.vectorPath, JSON.stringify(vectorStore, null, 2));
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function simpleEmbed(text: string, dims = 128): number[] {
  const vec = new Array(dims).fill(0);
  const lower = text.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const code = lower.charCodeAt(i);
    const idx = (code * 31 + i * 7) % dims;
    vec[idx] += (code / 65535) * 2 - 1;
    vec[(idx + 1) % dims] += (code / 65535) * 0.5;
    vec[(idx + code) % dims] += 0.3;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) {
    for (let i = 0; i < dims; i++) vec[i] /= mag;
  }
  return vec;
}

load();

export const VectorMemory = {
  add(id: string, text: string, tags: string[] = []): void {
    const embedding = simpleEmbed(text);
    const existing = vectorStore.findIndex(v => v.id === id);
    if (existing >= 0) {
      vectorStore[existing] = { id, text, embedding, tags };
    } else {
      vectorStore.push({ id, text, embedding, tags });
    }
    save();
  },

  search(query: string, topK = 5, threshold = 0.1): VectorEntry[] {
    const queryEmb = simpleEmbed(query);
    const scored = vectorStore.map(v => ({
      ...v,
      score: cosineSimilarity(queryEmb, v.embedding),
    }));
    return scored
      .filter(s => s.score > threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },

  semanticSearch(query: string, topK = 5): VectorEntry[] {
    return this.search(query, topK, 0.05);
  },

  remove(id: string): void {
    vectorStore = vectorStore.filter(v => v.id !== id);
    save();
  },

  count(): number {
    return vectorStore.length;
  },
};
