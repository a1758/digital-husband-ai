import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  xiaomi: {
    apiKey: process.env.XIAOMI_TTS_API_KEY || '',
  },
  memory: {
    dbPath: path.resolve(__dirname, '../data/memory.db'),
    vectorPath: path.resolve(__dirname, '../data/vectors.json'),
  },
};
