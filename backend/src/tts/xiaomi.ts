import { config } from '../config';
import crypto from 'crypto';

const XIAOMI_TTS_URL = 'https://tts.xiaomi.com/api/v1/synthesize';

interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;   // 0.5 - 2.0
  volume?: number;  // 0 - 100
  emotion?: string; // neutral, happy, sad, romantic
}

function generateSignature(text: string, timestamp: number): string {
  const raw = `${text}:${timestamp}:${config.xiaomi.apiKey}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

export async function synthesizeSpeech(options: TTSOptions): Promise<Buffer | null> {
  const { text, voice = 'male_gentle', speed = 1.0, volume = 80, emotion = 'neutral' } = options;

  if (!config.xiaomi.apiKey || config.xiaomi.apiKey === 'your-xiaomi-tts-key') {
    // Return mock silent audio when API key is not configured
    return generateSilentAudio(0.5);
  }

  const timestamp = Date.now();
  const signature = generateSignature(text, timestamp);

  try {
    const response = await fetch(XIAOMI_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.xiaomi.apiKey}`,
        'X-Timestamp': String(timestamp),
        'X-Signature': signature,
      },
      body: JSON.stringify({
        text,
        voice,
        speed,
        volume,
        emotion,
        format: 'mp3',
        sample_rate: 16000,
      }),
    });

    if (!response.ok) {
      console.error(`[TTS] Xiaomi API error: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('[TTS] Synthesis failed:', err);
    return null;
  }
}

function generateSilentAudio(durationSeconds: number): Buffer {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(numSamples * 2);
  // Minimal WAV header + silent PCM data
  const wavHeader = createWavHeader(numSamples, sampleRate);
  const wavData = Buffer.alloc(numSamples * 2);
  return Buffer.concat([wavHeader, wavData]);
}

function createWavHeader(numSamples: number, sampleRate: number): Buffer {
  const buf = Buffer.alloc(44);
  const dataSize = numSamples * 2;

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);       // PCM
  buf.writeUInt16LE(1, 22);       // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  return buf;
}

export function getLipSyncData(text: string): { mouthOpen: number; duration: number }[] {
  const vowels = 'aeiouAEIOU啊哦呃诶喔呜育奥爱欧安恩昂应翁';
  const frames: { mouthOpen: number; duration: number }[] = [];
  const chars = text.split('');

  let frameDuration = 0;
  let isOpen = false;

  for (const char of chars) {
    if (vowels.includes(char)) {
      if (!isOpen) {
        if (frameDuration > 0) {
          frames.push({ mouthOpen: 0, duration: frameDuration });
        }
        isOpen = true;
        frameDuration = 80;
      } else {
        frameDuration += 80;
      }
    } else if (char === '，' || char === '。' || char === '！' || char === '？' || char === ',' || char === '.') {
      if (isOpen) {
        frames.push({ mouthOpen: 0.8, duration: frameDuration });
        isOpen = false;
        frameDuration = 0;
      }
      frames.push({ mouthOpen: 0, duration: 200 });
    } else {
      if (isOpen) {
        frames.push({ mouthOpen: 0.6, duration: frameDuration });
        isOpen = false;
        frameDuration = 0;
      }
      if (frameDuration > 0) {
        frames.push({ mouthOpen: 0, duration: frameDuration });
        frameDuration = 0;
      }
      frameDuration += 60;
    }
  }

  if (isOpen || frameDuration > 0) {
    frames.push({ mouthOpen: isOpen ? 0.6 : 0, duration: frameDuration });
  }

  return frames.length > 0 ? frames : [{ mouthOpen: 0, duration: 500 }];
}
