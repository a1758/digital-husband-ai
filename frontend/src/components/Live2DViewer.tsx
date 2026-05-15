'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Live2DViewerProps {
  currentEmotion: string | null;
  lipSync: Array<{ mouthOpen: number; duration: number }>;
  audioQueue: Array<{ audio: string; format: string }>;
  onAudioComplete: () => void;
}

type Expression = 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry' | 'shy' | 'romantic';

export default function Live2DViewer({ currentEmotion, lipSync, audioQueue, onAudioComplete }: Live2DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState<Expression>('neutral');
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lipFrameRef = useRef<number>(0);
  const lipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map emotion to expression
  const emotionToExpression: Record<string, Expression> = {
    happy: 'happy',
    excited: 'happy',
    sad: 'sad',
    lonely: 'sad',
    anxious: 'surprised',
    shy: 'shy',
    romantic: 'romantic',
    affectionate: 'romantic',
    neutral: 'neutral',
  };

  useEffect(() => {
    if (currentEmotion) {
      const expr = emotionToExpression[currentEmotion] || 'neutral';
      setExpression(expr);
      // Auto-return to neutral after a delay
      const timer = setTimeout(() => setExpression('neutral'), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentEmotion]);

  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Lip sync animation
  useEffect(() => {
    if (!lipSync.length) return;

    let frameIdx = 0;
    const playFrame = () => {
      if (frameIdx >= lipSync.length) {
        setMouthOpen(0);
        return;
      }
      const frame = lipSync[frameIdx];
      setMouthOpen(frame.mouthOpen);
      frameIdx++;
      lipTimerRef.current = setTimeout(playFrame, frame.duration);
    };

    playFrame();

    return () => {
      if (lipTimerRef.current) clearTimeout(lipTimerRef.current);
    };
  }, [lipSync]);

  // Audio playback
  useEffect(() => {
    if (audioQueue.length === 0) return;

    const audioItem = audioQueue[0];
    const audio = new Audio(`data:audio/${audioItem.format};base64,${audioItem.audio}`);

    audio.onended = () => {
      onAudioComplete();
      setMouthOpen(0);
    };

    audio.onerror = () => {
      onAudioComplete();
    };

    audio.play().catch(console.error);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioQueue]);

  // Draw the avatar on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    // Face center and size
    const cx = W / 2;
    const cy = H / 2 - 20;
    const headSize = Math.min(W, H) * 0.28;

    let time = 0;

    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Gentle floating idle animation
      const idleY = Math.sin(time * 0.8) * 3;
      const idleTilt = Math.sin(time * 0.5) * 1.5;
      const breathScale = 1 + Math.sin(time * 1.2) * 0.008;

      ctx.save();
      ctx.translate(cx, cy + idleY);
      ctx.rotate((idleTilt * Math.PI) / 180);
      ctx.scale(breathScale, breathScale);

      drawCharacter(ctx, headSize, expression, blinking, mouthOpen);

      ctx.restore();

      // Particles for emotional ambiance
      drawParticles(ctx, time, W, H, expression);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animId);
  }, [expression, blinking, mouthOpen]);

  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxHeight: '500px' }}
      />
    </div>
  );
}

// Character drawing functions
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  size: number,
  expression: Expression,
  blinking: boolean,
  mouthOpen: number
) {
  const hairColors: Record<Expression, string> = {
    neutral: '#2d1b4e',
    happy: '#3d1f5e',
    sad: '#251545',
    surprised: '#301d50',
    angry: '#2a1848',
    shy: '#2d1b4e',
    romantic: '#351d55',
  };

  const eyeColors: Record<Expression, string> = {
    neutral: '#7b5ea7',
    happy: '#9b7ec7',
    sad: '#5a4a7a',
    surprised: '#8b6eb7',
    angry: '#6a4a8a',
    shy: '#7b5ea7',
    romantic: '#9b7ec7',
  };

  const blushIntensity: Record<Expression, number> = {
    neutral: 0.15,
    happy: 0.4,
    sad: 0.05,
    surprised: 0.2,
    angry: 0.3,
    shy: 0.7,
    romantic: 0.5,
  };

  // Hair (back)
  ctx.fillStyle = hairColors[expression];
  ctx.beginPath();
  ctx.arc(0, -size * 0.1, size * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#f5e6d3';
  ctx.fillRect(-size * 0.08, size * 0.45, size * 0.16, size * 0.3);

  // Collar
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.moveTo(-size * 0.25, size * 0.7);
  ctx.lineTo(0, size * 0.55);
  ctx.lineTo(size * 0.25, size * 0.7);
  ctx.lineTo(size * 0.35, size * 0.95);
  ctx.lineTo(-size * 0.35, size * 0.95);
  ctx.closePath();
  ctx.fill();

  // Face
  ctx.fillStyle = '#fce4d6';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.65, size * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();

  // Blush
  const blushAlpha = blushIntensity[expression];
  ctx.fillStyle = `rgba(255, 150, 150, ${blushAlpha})`;
  ctx.beginPath();
  ctx.ellipse(-size * 0.35, size * 0.12, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.35, size * 0.12, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = size * 0.035;
  ctx.lineCap = 'round';
  drawEyebrows(ctx, size, expression);

  // Eyes
  if (blinking) {
    // Closed eyes
    ctx.strokeStyle = '#4a3728';
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.12);
    ctx.lineTo(-size * 0.1, -size * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.1, -size * 0.12);
    ctx.lineTo(size * 0.3, -size * 0.12);
    ctx.stroke();
  } else {
    // Open eyes
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, -size * 0.12, size * 0.12, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.2, -size * 0.12, size * 0.12, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = eyeColors[expression];
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.11, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.2, -size * 0.11, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.11, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.2, -size * 0.11, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-size * 0.17, -size * 0.15, size * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.23, -size * 0.15, size * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose
  ctx.strokeStyle = '#d4a574';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.02);
  ctx.quadraticCurveTo(-size * 0.04, size * 0.06, 0, size * 0.07);
  ctx.stroke();

  // Mouth (with lip sync)
  drawMouth(ctx, size, expression, mouthOpen);

  // Hair (front)
  ctx.fillStyle = hairColors[expression];
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.1, size * 0.7, size * 0.25, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Hair strands
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.3);
  ctx.quadraticCurveTo(-size * 0.65, size * 0.1, -size * 0.55, size * 0.4);
  ctx.lineTo(-size * 0.3, size * 0.05);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(size * 0.5, -size * 0.3);
  ctx.quadraticCurveTo(size * 0.65, size * 0.1, size * 0.55, size * 0.4);
  ctx.lineTo(size * 0.3, size * 0.05);
  ctx.fill();
}

function drawEyebrows(ctx: CanvasRenderingContext2D, size: number, expression: Expression) {
  const positions: Record<Expression, { left: number[][]; right: number[][] }> = {
    neutral: {
      left: [[-0.3, -0.25], [-0.12, -0.26]],
      right: [[0.12, -0.26], [0.3, -0.25]],
    },
    happy: {
      left: [[-0.3, -0.24], [-0.12, -0.28]],
      right: [[0.12, -0.28], [0.3, -0.24]],
    },
    sad: {
      left: [[-0.3, -0.28], [-0.12, -0.22]],
      right: [[0.12, -0.22], [0.3, -0.28]],
    },
    surprised: {
      left: [[-0.3, -0.32], [-0.12, -0.28]],
      right: [[0.12, -0.28], [0.3, -0.32]],
    },
    angry: {
      left: [[-0.3, -0.28], [-0.14, -0.22]],
      right: [[0.14, -0.22], [0.3, -0.28]],
    },
    shy: {
      left: [[-0.3, -0.27], [-0.12, -0.24]],
      right: [[0.12, -0.24], [0.3, -0.27]],
    },
    romantic: {
      left: [[-0.3, -0.24], [-0.12, -0.27]],
      right: [[0.12, -0.27], [0.3, -0.24]],
    },
  };

  const pos = positions[expression];
  ctx.beginPath();
  ctx.moveTo(pos.left[0][0] * size, pos.left[0][1] * size);
  ctx.lineTo(pos.left[1][0] * size, pos.left[1][1] * size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.right[0][0] * size, pos.right[0][1] * size);
  ctx.lineTo(pos.right[1][0] * size, pos.right[1][1] * size);
  ctx.stroke();
}

function drawMouth(ctx: CanvasRenderingContext2D, size: number, expression: Expression, mouthOpenVal: number) {
  const mouthY = size * 0.18;
  const baseOpen = mouthOpenVal * size * 0.15;

  ctx.strokeStyle = '#c47a6a';
  ctx.fillStyle = '#c47a6a';

  switch (expression) {
    case 'happy':
      ctx.beginPath();
      ctx.arc(0, mouthY + baseOpen * 0.3, size * 0.12 + baseOpen * 0.5, 0.1, Math.PI - 0.1);
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
      break;
    case 'sad':
      ctx.beginPath();
      ctx.arc(0, mouthY + size * 0.08, size * 0.1, Math.PI + 0.3, -0.3);
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
      break;
    case 'surprised':
      ctx.beginPath();
      ctx.ellipse(0, mouthY, size * 0.08, size * 0.06 + baseOpen, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'angry':
      ctx.beginPath();
      ctx.arc(0, mouthY + size * 0.06, size * 0.1, 0.2, Math.PI - 0.2, true);
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
      break;
    case 'shy':
      ctx.beginPath();
      ctx.moveTo(-size * 0.08, mouthY);
      ctx.quadraticCurveTo(0, mouthY + size * 0.04, size * 0.08, mouthY);
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
      break;
    default:
      // Neutral
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, mouthY);
      ctx.quadraticCurveTo(0, mouthY + baseOpen * 0.5, size * 0.1, mouthY);
      ctx.lineWidth = size * 0.025;
      ctx.stroke();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, time: number, W: number, H: number, expression: Expression) {
  const particleColors: Record<Expression, string> = {
    neutral: 'rgba(199, 125, 255, 0.15)',
    happy: 'rgba(255, 200, 100, 0.2)',
    sad: 'rgba(130, 160, 220, 0.15)',
    surprised: 'rgba(255, 180, 200, 0.2)',
    angry: 'rgba(255, 100, 100, 0.15)',
    shy: 'rgba(255, 180, 200, 0.25)',
    romantic: 'rgba(255, 150, 180, 0.25)',
  };

  ctx.fillStyle = particleColors[expression];

  for (let i = 0; i < 8; i++) {
    const px = W / 2 + Math.sin(time * (0.5 + i * 0.3) + i) * W * 0.4;
    const py = H / 2 + Math.cos(time * (0.4 + i * 0.25) + i) * H * 0.35;
    const alpha = 0.3 + Math.sin(time * 1.5 + i) * 0.2;
    const radius = 2 + Math.sin(time + i) * 1.5;

    ctx.globalAlpha = Math.max(0, alpha);
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
