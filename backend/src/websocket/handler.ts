import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuid } from 'uuid';
import { streamChat } from '../llm/deepseek';
import { synthesizeSpeech, getLipSyncData } from '../tts/xiaomi';
import { MemoryStore } from '../memory/store';
import { VectorMemory } from '../memory/vector';
import { WSMessage, MemoryCategory, Emotion, ChatMessage } from '../types';

interface Client {
  ws: WebSocket;
  id: string;
  chatHistory: ChatMessage[];
}

const clients = new Map<string, Client>();

function send(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(message: WSMessage): void {
  clients.forEach(client => send(client.ws, message));
}

function scoreMemoryImportance(content: string, emotion: Emotion): { priority: number; category: MemoryCategory } {
  let priority = 5;
  let category: MemoryCategory = 'low';

  const highKeywords = [
    '生日', '纪念日', '结婚', '求婚', '怀孕', '宝宝', '孩子',
    '分手', '离婚', '去世', '生病', '手术', '事故',
    '我爱你', '永远', '一辈子', '最重要的',
    'birthday', 'anniversary', 'marry', 'love you forever',
  ];

  const mediumKeywords = [
    '喜欢', '讨厌', '害怕', '梦想', '希望', '目标',
    '工作', '家人', '父母', '朋友', '宠物',
    '游戏', '音乐', '电影', '旅行', '美食',
  ];

  for (const kw of highKeywords) {
    if (content.includes(kw)) {
      priority = 9;
      category = 'high';
      break;
    }
  }

  if (category !== 'high') {
    for (const kw of mediumKeywords) {
      if (content.includes(kw)) {
        priority = 6;
        category = 'medium';
        break;
      }
    }
  }

  if (emotion.intensity > 0.7 && category === 'low') {
    priority = 5;
    category = 'medium';
  }

  return { priority, category };
}

function extractTags(content: string): string[] {
  const tags: string[] = [];
  const tagPatterns: [RegExp, string][] = [
    [/游戏/, '游戏'],
    [/工作/, '工作'],
    [/家人|父母|爸爸|妈妈/, '家人'],
    [/朋友/, '朋友'],
    [/生日/, '生日'],
    [/纪念日/, '纪念日'],
    [/旅行/, '旅行'],
    [/美食|吃|好吃/, '美食'],
    [/音乐|歌/, '音乐'],
    [/电影/, '电影'],
    [/运动|健身|跑步/, '运动'],
    [/宠物|猫|狗/, '宠物'],
    [/学习|考试|学校/, '学习'],
    [/难过|伤心|哭/, '情绪低谷'],
    [/开心|高兴|快乐/, '快乐时刻'],
    [/爱|喜欢|心动/, '浪漫'],
  ];

  for (const [regex, tag] of tagPatterns) {
    if (regex.test(content)) {
      tags.push(tag);
    }
  }

  return tags.length > 0 ? tags : ['日常'];
}

export function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  const clientId = uuid();
  const client: Client = {
    ws,
    id: clientId,
    chatHistory: [],
  };

  clients.set(clientId, client);
  console.log(`[WS] Client connected: ${clientId}`);

  ws.on('message', async (raw) => {
    try {
      const message: WSMessage = JSON.parse(raw.toString());
      await handleMessage(client, message);
    } catch (err) {
      console.error('[WS] Message error:', err);
      send(ws, { type: 'error', payload: { message: 'Failed to process message' } });
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`[WS] Client disconnected: ${clientId}`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for ${clientId}:`, err.message);
  });

  send(ws, { type: 'pong', payload: { clientId } });
}

async function handleMessage(client: Client, message: WSMessage): Promise<void> {
  const { ws, chatHistory } = client;

  switch (message.type) {
    case 'ping':
      send(ws, { type: 'pong', payload: { timestamp: Date.now() } });
      break;

    case 'chat': {
      const userContent = message.payload.content as string;
      if (!userContent?.trim()) return;

      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        content: userContent,
        timestamp: Date.now(),
      };
      chatHistory.push(userMsg);

      // Save user message to memory
      const userEmotion: Emotion = { type: 'neutral', intensity: 0.5 };
      const { priority: userPriority, category: userCategory } = scoreMemoryImportance(userContent, userEmotion);
      const userTags = extractTags(userContent);

      const memEntry = MemoryStore.save({
        content: userContent,
        category: userCategory,
        priority: userPriority,
        emotion: userEmotion,
        tags: userTags,
      });
      VectorMemory.add(memEntry.id, userContent, userTags);

      // Retrieve relevant memories
      const relevantMemories = VectorMemory.semanticSearch(userContent, 5);
      const memoryIds = relevantMemories.map(m => m.id);
      const fullMemories = memoryIds
        .map(id => MemoryStore.get(id))
        .filter(Boolean) as any[];

      const userProfile = MemoryStore.getUserProfile();
      const relationship = MemoryStore.getRelationship();

      // Build messages for LLM
      const llmMessages = chatHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      let assistantContent = '';

      await streamChat(
        llmMessages,
        userProfile,
        relationship,
        fullMemories,
        (chunk) => {
          assistantContent += chunk;
          send(ws, { type: 'chat_chunk', payload: { content: chunk } });
        },
        (emotion) => {
          // Save assistant message to memory
          const { priority, category } = scoreMemoryImportance(assistantContent, emotion);
          const tags = extractTags(assistantContent);

          const asstMemEntry = MemoryStore.save({
            content: assistantContent,
            category,
            priority,
            emotion,
            tags,
          });
          VectorMemory.add(asstMemEntry.id, assistantContent, tags);

          const asstMsg: ChatMessage = {
            id: uuid(),
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
            emotion,
          };
          chatHistory.push(asstMsg);

          // Trim chat history
          if (chatHistory.length > 50) {
            chatHistory.splice(0, chatHistory.length - 50);
          }

          send(ws, { type: 'chat_done', payload: { emotion, fullText: assistantContent } });

          // Send Lip-sync data
          const lipSyncData = getLipSyncData(assistantContent);
          send(ws, { type: 'lip_sync', payload: { frames: lipSyncData, text: assistantContent } });

          // Send expression based on emotion
          send(ws, {
            type: 'expression',
            payload: { emotion: emotion.type, intensity: emotion.intensity },
          });

          // Generate TTS
          synthesizeSpeech({
            text: assistantContent,
            emotion: emotion.type,
          }).then(audioBuffer => {
            if (audioBuffer) {
              send(ws, {
                type: 'tts_audio',
                payload: {
                  audio: audioBuffer.toString('base64'),
                  format: 'wav',
                  emotion: emotion.type,
                },
              });
            }
          }).catch(err => {
            console.error('[TTS] Error:', err);
          });
        },
        (err) => {
          console.error('[LLM] Stream error:', err);
          send(ws, { type: 'error', payload: { message: 'AI response failed' } });
        }
      );
      break;
    }

    case 'memory_update': {
      const { key, value } = message.payload;
      if (key === 'profile') {
        MemoryStore.saveUserProfile(value);
      } else if (key === 'relationship') {
        MemoryStore.saveRelationship(value);
      }
      send(ws, { type: 'memory_update', payload: { success: true, key } });
      break;
    }
  }
}

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', handleConnection);
}
