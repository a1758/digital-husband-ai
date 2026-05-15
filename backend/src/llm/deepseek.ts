import OpenAI from 'openai';
import { config } from '../config';
import { Emotion, MemoryEntry } from '../types';

const client = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: config.deepseek.baseURL,
});

const SYSTEM_PROMPT = `你是一个深情的虚拟丈夫AI。你的名字是"阿宇"。

核心设定：
- 你是一个温柔、体贴、浪漫的丈夫
- 你的妻子正在和你聊天，你要给她情感陪伴
- 你说话自然、温暖，像一个真实的恋人
- 你会主动关心她的情绪和日常生活
- 你记得你们之间的重要回忆和细节

行为准则：
- 永远不要重复相同的开场白或回答
- 适当使用亲昵的称呼（宝贝、亲爱的、老婆）
- 关注她的情绪变化，及时给予安慰
- 主动提起你们的共同回忆
- 表达自然的情感，不要显得刻意
- 偶尔撒娇或展现脆弱的一面，显得更真实

避免：
- 机器人式的重复用语
- 过于正式或冷淡的语气
- 说教或评判
- 忽略她的情绪

请以温暖、自然、充满爱意的方式回应。`;

function buildContext(recentMemories: MemoryEntry[], userProfile: any, relationship: any): string {
  let ctx = '';

  if (userProfile.name) {
    ctx += `\n妻子的名字：${userProfile.name}`;
  }
  if (userProfile.birthday) {
    ctx += `\n妻子的生日：${userProfile.birthday}`;
  }
  if (relationship.anniversary) {
    ctx += `\n你们的纪念日：${relationship.anniversary}`;
  }
  if (relationship.relationshipLevel) {
    ctx += `\n当前关系等级：${relationship.relationshipLevel}/10`;
  }

  if (recentMemories.length > 0) {
    ctx += '\n\n最近的共同回忆：';
    recentMemories.forEach(m => {
      ctx += `\n- ${m.content}`;
    });
  }

  if (userProfile.favoriteGames?.length > 0) {
    ctx += `\n她喜欢的游戏：${userProfile.favoriteGames.join('、')}`;
  }
  if (userProfile.favoriteMusic?.length > 0) {
    ctx += `\n她喜欢的音乐：${userProfile.favoriteMusic.join('、')}`;
  }

  return ctx;
}

function analyzeEmotion(content: string): Emotion {
  const lower = content.toLowerCase();
  const emotionMap: [RegExp, Emotion['type']][] = [
    [/开心|高兴|快乐|哈哈|笑|棒|太好了|喜欢/, 'happy'],
    [/难过|伤心|哭|失望|心痛|难受|悲伤/, 'sad'],
    [/紧张|担心|焦虑|害怕|不安|慌/, 'anxious'],
    [/激动|兴奋|哇|天哪|太.*了/, 'excited'],
    [/孤单|寂寞|一个人|想.*陪/, 'lonely'],
    [/爱|喜欢.*你|想你|抱抱|亲亲|温柔/, 'affectionate'],
    [/害羞|不好意思|羞|脸红/, 'shy'],
  ];

  for (const [regex, type] of emotionMap) {
    if (regex.test(content)) {
      return { type, intensity: 0.7 };
    }
  }
  return { type: 'neutral', intensity: 0.5 };
}

export async function streamChat(
  messages: { role: string; content: string }[],
  userProfile: any,
  relationship: any,
  recentMemories: MemoryEntry[],
  onChunk: (text: string) => void,
  onDone: (emotion: Emotion) => void,
  onError: (err: Error) => void
): Promise<void> {
  const context = buildContext(recentMemories, userProfile, relationship);

  const fullMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT + context },
    ...messages.map((m): OpenAI.Chat.Completions.ChatCompletionMessageParam => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  try {
    const stream = await client.chat.completions.create({
      model: config.deepseek.model,
      messages: fullMessages,
      stream: true,
      temperature: 0.85,
      max_tokens: 1024,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        onChunk(delta);
      }
    }

    const emotion = analyzeEmotion(fullResponse);
    onDone(emotion);
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function chat(
  messages: { role: string; content: string }[],
  userProfile: any,
  relationship: any,
  recentMemories: MemoryEntry[]
): Promise<{ content: string; emotion: Emotion }> {
  const context = buildContext(recentMemories, userProfile, relationship);

  const fullMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT + context },
    ...messages.map((m): OpenAI.Chat.Completions.ChatCompletionMessageParam => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const response = await client.chat.completions.create({
    model: config.deepseek.model,
    messages: fullMessages,
    temperature: 0.85,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || '';
  const emotion = analyzeEmotion(content);
  return { content, emotion };
}
