'use client';

import { useState, useCallback } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Live2DViewer from '@/components/Live2DViewer';
import VoiceControls from '@/components/VoiceControls';
import Sidebar from '@/components/Sidebar';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function Home() {
  const {
    messages,
    isStreaming,
    currentEmotion,
    lipSync,
    audioQueue,
    sendMessage,
    clearAudioQueue,
  } = useWebSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAvatar, setShowAvatar] = useState(true);

  const handleVoiceInput = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-dh-border flex items-center justify-between px-4 bg-dh-card/30 glass">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-dh-text-muted hover:text-dh-text hover:bg-dh-card-hover transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-dh-success animate-pulse" />
              <span className="text-sm font-medium text-dh-text">阿宇</span>
              {currentEmotion && (
                <span className="text-xs text-dh-text-muted">· {emotionLabel(currentEmotion)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VoiceControls onVoiceInput={handleVoiceInput} isStreaming={isStreaming} />
            <button
              onClick={() => setShowAvatar(!showAvatar)}
              className={`w-8 h-8 rounded-lg hidden md:flex items-center justify-center transition-all
                ${showAvatar ? 'text-dh-accent bg-dh-accent/10' : 'text-dh-text-muted hover:text-dh-text'}`}
              title={showAvatar ? '隐藏形象' : '显示形象'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Chat panel */}
          <div className={`flex-1 flex flex-col min-w-0 ${showAvatar ? 'md:border-r border-dh-border' : ''}`}>
            <ChatInterface
              messages={messages}
              isStreaming={isStreaming}
              onSend={sendMessage}
            />
          </div>

          {/* Live2D panel (desktop) */}
          {showAvatar && (
            <div className="hidden md:flex md:w-[380px] lg:w-[440px] shrink-0 flex-col bg-dh-card/20">
              <div className="flex-1 relative overflow-hidden">
                <Live2DViewer
                  currentEmotion={currentEmotion}
                  lipSync={lipSync}
                  audioQueue={audioQueue}
                  onAudioComplete={clearAudioQueue}
                />
              </div>
              {/* Emotion indicator */}
              <div className="h-12 border-t border-dh-border flex items-center justify-center gap-3 px-4">
                {['neutral', 'happy', 'sad', 'romantic', 'shy'].map(emo => {
                  const activeEmotion = currentEmotion
                    ? emotionToKey(currentEmotion) === emo
                    : emo === 'neutral';
                  return (
                    <div
                      key={emo}
                      className={`text-xs px-2 py-1 rounded-full transition-all duration-300
                        ${activeEmotion
                          ? 'bg-dh-accent/20 text-dh-accent font-medium'
                          : 'text-dh-text-muted'
                        }`}
                    >
                      {emotionEmoji(emo)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile avatar toggle */}
        <button
          onClick={() => setShowAvatar(!showAvatar)}
          className="md:hidden fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-dh-accent to-dh-accent-dim
            text-white shadow-lg shadow-dh-accent/30 flex items-center justify-center z-30
            active:scale-95 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        {/* Mobile avatar overlay */}
        {showAvatar && (
          <div className="md:hidden fixed inset-0 top-14 bg-dh-bg/95 z-20 animate-fade-in flex flex-col">
            <div className="flex-1">
              <Live2DViewer
                currentEmotion={currentEmotion}
                lipSync={lipSync}
                audioQueue={audioQueue}
                onAudioComplete={clearAudioQueue}
              />
            </div>
            <div className="flex justify-center pb-4">
              <button
                onClick={() => setShowAvatar(false)}
                className="px-6 py-2 rounded-full bg-dh-card border border-dh-border text-sm text-dh-text-muted"
              >
                返回聊天
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function emotionLabel(emotion: string): string {
  const map: Record<string, string> = {
    happy: '开心',
    sad: '难过',
    anxious: '焦虑',
    excited: '兴奋',
    lonely: '孤独',
    affectionate: '深情',
    neutral: '平静',
    shy: '害羞',
    romantic: '浪漫',
  };
  return map[emotion] || emotion;
}

function emotionToKey(emotion: string): string {
  const map: Record<string, string> = {
    happy: 'happy',
    sad: 'sad',
    excited: 'happy',
    affectionate: 'romantic',
    romantic: 'romantic',
    shy: 'shy',
    angry: 'sad',
    anxious: 'sad',
    lonely: 'sad',
    neutral: 'neutral',
  };
  return map[emotion] || 'neutral';
}

function emotionEmoji(emo: string): string {
  const map: Record<string, string> = {
    neutral: '😊 平静',
    happy: '😄 开心',
    sad: '😢 难过',
    romantic: '💕 浪漫',
    shy: '😳 害羞',
  };
  return map[emo] || emo;
}
