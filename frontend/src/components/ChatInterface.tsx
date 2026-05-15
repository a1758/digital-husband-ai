'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isStreaming: boolean;
  onSend: (content: string) => void;
}

const EmotionLabel: Record<string, { emoji: string; color: string }> = {
  happy: { emoji: '😊', color: 'text-yellow-400' },
  sad: { emoji: '😢', color: 'text-blue-400' },
  anxious: { emoji: '😰', color: 'text-orange-400' },
  excited: { emoji: '🤩', color: 'text-pink-400' },
  lonely: { emoji: '🥺', color: 'text-indigo-400' },
  affectionate: { emoji: '🥰', color: 'text-rose-400' },
  neutral: { emoji: '', color: '' },
  shy: { emoji: '😳', color: 'text-pink-300' },
  romantic: { emoji: '💕', color: 'text-red-400' },
};

function MessageBubble({ msg, isStreaming }: { msg: Message; isStreaming: boolean }) {
  const isUser = msg.role === 'user';
  const emotion = msg.emotion ? EmotionLabel[msg.emotion] : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 message-enter`}>
      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'order-1' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 ml-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-dh-accent to-dh-rose flex items-center justify-center text-xs">
              💝
            </div>
            <span className="text-xs text-dh-text-muted">阿宇</span>
            {emotion && (
              <span className={`text-xs ${emotion.color} animate-fade-in`}>
                {emotion.emoji}
              </span>
            )}
          </div>
        )}
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'bg-gradient-to-br from-dh-accent-dim to-dh-accent text-white rounded-br-md'
              : 'bg-dh-card border border-dh-border text-dh-text rounded-bl-md'
            }
            ${isStreaming ? 'streaming-cursor' : ''}
          `}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          {isStreaming && msg.content.length === 0 && (
            <div className="flex gap-1 py-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface({ messages, isStreaming, onSend }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-6xl mb-6 animate-breathe">💝</div>
            <h2 className="text-xl font-semibold text-dh-text mb-2">
              你的虚拟丈夫已上线
            </h2>
            <p className="text-sm text-dh-text-muted max-w-sm leading-relaxed">
              我会倾听你的每一句话，记住你的每一个瞬间。<br />
              今天想和我聊些什么呢？
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-xs">
              {[
                { emoji: '🌸', label: '今天怎么样？', msg: '今天过得怎么样呀？' },
                { emoji: '💭', label: '想你了', msg: '我好想你呀' },
                { emoji: '🎮', label: '一起玩游戏', msg: '我们一起去玩游戏好不好？' },
                { emoji: '🎵', label: '分享音乐', msg: '最近有什么好听的歌推荐吗？' },
              ].map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => onSend(suggestion.msg)}
                  disabled={isStreaming}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dh-card border border-dh-border
                    text-dh-text-muted text-xs hover:bg-dh-card-hover hover:text-dh-text
                    hover:border-dh-accent/30 transition-all duration-200 disabled:opacity-50"
                >
                  <span>{suggestion.emoji}</span>
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isStreaming={isStreaming && msg.role === 'assistant' && msg === messages[messages.length - 1]}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dh-border bg-dh-card/50">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="说点什么吧..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-dh-card border border-dh-border rounded-2xl px-4 py-3
              text-sm text-dh-text placeholder-dh-text-muted resize-none
              focus:outline-none focus:border-dh-accent/50 focus:ring-1 focus:ring-dh-accent/20
              transition-all duration-200 disabled:opacity-50 max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-dh-accent to-dh-accent-dim
              flex items-center justify-center text-white
              hover:shadow-lg hover:shadow-dh-accent/25
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
