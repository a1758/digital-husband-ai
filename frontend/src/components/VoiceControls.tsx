'use client';

import { useState, useRef, useCallback } from 'react';

interface VoiceControlsProps {
  onVoiceInput: (text: string) => void;
  isStreaming: boolean;
}

export default function VoiceControls({ onVoiceInput, isStreaming }: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别，请使用Chrome浏览器。');
      return;
    }

    try {
      // Start audio context for visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current || !isRecording) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVoiceLevel(avg / 255);
        if (isRecording) requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Start speech recognition
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text.trim()) {
          onVoiceInput(text);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [onVoiceInput, isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setVoiceLevel(0);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Voice level indicator */}
      {isRecording && (
        <div className="flex items-center gap-1 px-2">
          <div className="voice-wave">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bar"
                style={{
                  height: `${Math.max(4, voiceLevel * 28 * (0.5 + Math.random() * 0.5))}px`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-dh-rose animate-pulse ml-1">录音中...</span>
        </div>
      )}

      {/* Record button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isStreaming}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
          ${isRecording
            ? 'bg-dh-rose text-white animate-pulse shadow-lg shadow-dh-rose/30'
            : 'bg-dh-card border border-dh-border text-dh-text-muted hover:text-dh-text hover:border-dh-accent/30'
          }
          disabled:opacity-40 disabled:cursor-not-allowed`}
        title={isRecording ? '停止录音' : '语音输入'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* Mute button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
          ${isMuted
            ? 'bg-dh-rose/20 border border-dh-rose/50 text-dh-rose'
            : 'bg-dh-card border border-dh-border text-dh-text-muted hover:text-dh-text hover:border-dh-accent/30'
          }`}
        title={isMuted ? '取消静音' : '静音'}
      >
        {isMuted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}
