'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { wsClient } from '@/lib/websocket';

interface ChatState {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    emotion?: string;
  }>;
  isStreaming: boolean;
  currentEmotion: string | null;
  lipSync: Array<{ mouthOpen: number; duration: number }>;
  audioQueue: Array<{ audio: string; format: string }>;
}

export function useWebSocket() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isStreaming: false,
    currentEmotion: null,
    lipSync: [],
    audioQueue: [],
  });

  const streamRef = useRef('');
  const cleanups = useRef<Array<() => void>>([]);

  useEffect(() => {
    wsClient.connect();

    cleanups.current.push(
      wsClient.on('chat_chunk', (payload: { content: string }) => {
        streamRef.current += payload.content;
        setState(prev => {
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant' && prev.isStreaming) {
            msgs[msgs.length - 1] = {
              ...last,
              content: streamRef.current,
            };
          } else {
            msgs.push({
              id: Date.now().toString(),
              role: 'assistant',
              content: streamRef.current,
            });
          }
          return { ...prev, messages: msgs, isStreaming: true };
        });
      }),

      wsClient.on('chat_done', (payload: { emotion: any; fullText: string }) => {
        streamRef.current = '';
        setState(prev => ({
          ...prev,
          isStreaming: false,
          currentEmotion: payload.emotion?.type || null,
        }));
      }),

      wsClient.on('expression', (payload: { emotion: string; intensity: number }) => {
        setState(prev => ({ ...prev, currentEmotion: payload.emotion }));
      }),

      wsClient.on('lip_sync', (payload: { frames: Array<{ mouthOpen: number; duration: number }> }) => {
        setState(prev => ({ ...prev, lipSync: payload.frames }));
      }),

      wsClient.on('tts_audio', (payload: { audio: string; format: string }) => {
        setState(prev => ({
          ...prev,
          audioQueue: [...prev.audioQueue, { audio: payload.audio, format: payload.format }],
        }));
      }),

      wsClient.on('error', (payload: { message: string }) => {
        console.error('[Chat] Error:', payload.message);
        setState(prev => ({ ...prev, isStreaming: false }));
      })
    );

    return () => {
      cleanups.current.forEach(fn => fn());
      cleanups.current = [];
    };
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isStreaming: true,
    }));

    wsClient.send({ type: 'chat', payload: { content } });
  }, []);

  const clearAudioQueue = useCallback(() => {
    setState(prev => ({ ...prev, audioQueue: [] }));
  }, []);

  return {
    ...state,
    sendMessage,
    clearAudioQueue,
  };
}
