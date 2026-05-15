import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { MemoryEntry, MemoryCategory, Emotion, UserProfile, RelationshipMemory } from '../types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.dirname(config.memory.dbPath);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(config.memory.dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'medium',
    priority INTEGER NOT NULL DEFAULT 5,
    emotion_type TEXT DEFAULT 'neutral',
    emotion_intensity REAL DEFAULT 0.5,
    tags TEXT NOT NULL DEFAULT '[]',
    timestamp INTEGER NOT NULL,
    last_accessed INTEGER NOT NULL,
    access_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_profile (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS relationship (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
  CREATE INDEX IF NOT EXISTS idx_memories_priority ON memories(priority);
  CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);
  CREATE INDEX IF NOT EXISTS idx_memories_last_accessed ON memories(last_accessed);
`);

const stmtInsert = db.prepare(`
  INSERT OR REPLACE INTO memories (id, content, category, priority, emotion_type, emotion_intensity, tags, timestamp, last_accessed, access_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtGetById = db.prepare('SELECT * FROM memories WHERE id = ?');
const stmtGetByCategory = db.prepare('SELECT * FROM memories WHERE category = ? ORDER BY priority DESC, timestamp DESC LIMIT ?');
const stmtSearch = db.prepare("SELECT * FROM memories WHERE content LIKE ? OR tags LIKE ? ORDER BY priority DESC, timestamp DESC LIMIT ?");
const stmtRecent = db.prepare('SELECT * FROM memories ORDER BY last_accessed DESC LIMIT ?');
const stmtUpdateAccess = db.prepare('UPDATE memories SET last_accessed = ?, access_count = access_count + 1 WHERE id = ?');
const stmtDelete = db.prepare('DELETE FROM memories WHERE id = ?');
const stmtAllTags = db.prepare('SELECT tags FROM memories');

function rowToMemory(row: any): MemoryEntry {
  return {
    id: row.id,
    content: row.content,
    category: row.category as MemoryCategory,
    priority: row.priority,
    emotion: { type: row.emotion_type, intensity: row.emotion_intensity },
    tags: JSON.parse(row.tags),
    timestamp: row.timestamp,
    lastAccessed: row.last_accessed,
    accessCount: row.access_count,
  };
}

export const MemoryStore = {
  save(entry: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>): MemoryEntry {
    const id = uuid();
    const now = Date.now();
    stmtInsert.run(
      id,
      entry.content,
      entry.category,
      entry.priority,
      entry.emotion?.type || 'neutral',
      entry.emotion?.intensity || 0.5,
      JSON.stringify(entry.tags),
      now,
      now,
      0
    );
    return { ...entry, id, timestamp: now, lastAccessed: now, accessCount: 0 };
  },

  get(id: string): MemoryEntry | null {
    const row = stmtGetById.get(id) as any;
    if (!row) return null;
    stmtUpdateAccess.run(Date.now(), id);
    return rowToMemory(row);
  },

  getByCategory(category: MemoryCategory, limit = 20): MemoryEntry[] {
    const rows = stmtGetByCategory.all(category, limit) as any[];
    return rows.map(rowToMemory);
  },

  search(query: string, limit = 20): MemoryEntry[] {
    const like = `%${query}%`;
    const rows = stmtSearch.all(like, like, limit) as any[];
    rows.forEach((r: any) => stmtUpdateAccess.run(Date.now(), r.id));
    return rows.map(rowToMemory);
  },

  getRecent(limit = 20): MemoryEntry[] {
    const rows = stmtRecent.all(limit) as any[];
    return rows.map(rowToMemory);
  },

  delete(id: string): boolean {
    const result = stmtDelete.run(id);
    return result.changes > 0;
  },

  getAllTags(): string[] {
    const rows = stmtAllTags.all() as any[];
    const tagSet = new Set<string>();
    rows.forEach((r: any) => {
      JSON.parse(r.tags).forEach((t: string) => tagSet.add(t));
    });
    return Array.from(tagSet);
  },

  getUserProfile(): UserProfile {
    const raw = db.prepare("SELECT value FROM user_profile WHERE key = 'profile'").get() as any;
    if (raw) return JSON.parse(raw.value);
    return {
      name: '',
      birthday: '',
      favoriteGames: [],
      favoriteMusic: [],
      personalityPreferences: [],
      importantDates: [],
    };
  },

  saveUserProfile(profile: UserProfile): void {
    db.prepare("INSERT OR REPLACE INTO user_profile (key, value) VALUES ('profile', ?)").run(JSON.stringify(profile));
  },

  getRelationship(): RelationshipMemory {
    const raw = db.prepare("SELECT value FROM relationship WHERE key = 'relationship'").get() as any;
    if (raw) return JSON.parse(raw.value);
    return {
      anniversary: '',
      firstMeetingStory: '',
      relationshipLevel: 1,
      sharedMemories: [],
      specialMoments: [],
    };
  },

  saveRelationship(rel: RelationshipMemory): void {
    db.prepare("INSERT OR REPLACE INTO relationship (key, value) VALUES ('relationship', ?)").run(JSON.stringify(rel));
  },
};
