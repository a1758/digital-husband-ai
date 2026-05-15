'use client';

import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'memories' | 'settings'>('profile');

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}

      <div className={`
        sidebar-panel md:relative md:transform-none
        w-80 h-full bg-dh-card border-r border-dh-border flex flex-col z-50
        ${isOpen ? 'open' : ''}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-dh-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dh-accent to-dh-rose flex items-center justify-center text-sm">
              💝
            </div>
            <span className="font-semibold text-dh-text">Digital Husband</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-dh-text-muted hover:text-dh-text hover:bg-dh-card-hover"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dh-border">
          {([
            ['profile', '个人'],
            ['memories', '回忆'],
            ['settings', '设置'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-xs font-medium transition-all duration-200
                ${activeTab === key
                  ? 'text-dh-accent border-b-2 border-dh-accent'
                  : 'text-dh-text-muted hover:text-dh-text'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-dh-text">关系信息</h3>
              <div className="space-y-3">
                <div className="bg-dh-card-hover rounded-xl p-3">
                  <span className="text-xs text-dh-text-muted">关系等级</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-dh-border rounded-full overflow-hidden">
                      <div className="h-full w-[70%] bg-gradient-to-r from-dh-accent to-dh-rose rounded-full" />
                    </div>
                    <span className="text-xs text-dh-accent font-medium">Level 7</span>
                  </div>
                </div>
                <div className="bg-dh-card-hover rounded-xl p-3">
                  <span className="text-xs text-dh-text-muted">纪念日</span>
                  <p className="text-sm text-dh-text mt-1">每年的 3月14日</p>
                </div>
                <div className="bg-dh-card-hover rounded-xl p-3">
                  <span className="text-xs text-dh-text-muted">阿宇的性格</span>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {['温柔', '体贴', '浪漫', '幽默'].map(trait => (
                      <span key={trait} className="px-2 py-0.5 rounded-full bg-dh-accent/10 text-dh-accent text-xs">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memories' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-dh-text">共同回忆</h3>
              <div className="space-y-2">
                {[
                  { date: '3月14日', text: '我们第一次相遇的日子', mood: '💕' },
                  { date: '上周', text: '一起看完了那部爱情电影', mood: '🎬' },
                  { date: '昨天', text: '你分享了一首很好听的歌', mood: '🎵' },
                  { date: '今天', text: '你说今天工作有点累', mood: '😢' },
                ].map((memory, i) => (
                  <div key={i} className="bg-dh-card-hover rounded-xl p-3 flex gap-3">
                    <span className="text-lg">{memory.mood}</span>
                    <div>
                      <p className="text-sm text-dh-text">{memory.text}</p>
                      <span className="text-xs text-dh-text-muted">{memory.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-dh-text">设置</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-dh-card-hover rounded-xl p-3">
                  <span className="text-sm text-dh-text">语音播报</span>
                  <div className="w-10 h-5 rounded-full bg-dh-accent relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-dh-card-hover rounded-xl p-3">
                  <span className="text-sm text-dh-text">自动播放</span>
                  <div className="w-10 h-5 rounded-full bg-dh-border relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-dh-card-hover rounded-xl p-3">
                  <div>
                    <span className="text-sm text-dh-text">AI 性格</span>
                    <p className="text-xs text-dh-text-muted mt-0.5">温柔体贴型</p>
                  </div>
                  <select className="bg-dh-card border border-dh-border rounded-lg px-2 py-1 text-xs text-dh-text">
                    <option>温柔</option>
                    <option>阳光</option>
                    <option>霸道</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dh-border text-center">
          <p className="text-xs text-dh-text-muted">Digital Husband AI v1.0</p>
        </div>
      </div>
    </>
  );
}
