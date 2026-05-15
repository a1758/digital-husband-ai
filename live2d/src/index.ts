/**
 * Live2D Integration Module for Digital Husband AI
 *
 * Supports two modes:
 * 1. Native Cubism SDK (requires Live2D Cubism 4 SDK for Web)
 * 2. Canvas fallback (works without SDK)
 */

export interface Live2DExpression {
  id: string;
  name: string;
  parameters: { id: string; value: number }[];
}

export interface Live2DMotion {
  id: string;
  name: string;
  duration: number;
  loop: boolean;
}

export interface LipSyncFrame {
  mouthOpen: number;   // 0-1
  duration: number;    // ms
}

export interface Live2DConfig {
  modelPath: string;
  canvasId: string;
  width: number;
  height: number;
  autoBlink: boolean;
  autoBreath: boolean;
}

// Map emotions to Live2D expression IDs
export const EMOTION_TO_EXPRESSION: Record<string, string> = {
  happy: 'smile',
  sad: 'sad',
  anxious: 'worried',
  excited: 'surprised',
  lonely: 'lonely',
  affectionate: 'warm_smile',
  neutral: 'neutral',
  shy: 'blush',
  romantic: 'romantic',
};

// Map emotions to parameter overrides for lip-sync and eye behavior
export const EMOTION_PARAMS: Record<string, Record<string, number>> = {
  happy: {
    ParamMouthOpenY: 1.2,
    ParamEyeLOpen: 1.1,
    ParamEyeROpen: 1.1,
    ParamBrowLY: 0.3,
    ParamBrowRY: 0.3,
  },
  sad: {
    ParamMouthOpenY: 0.7,
    ParamEyeLOpen: 0.8,
    ParamEyeROpen: 0.8,
    ParamBrowLY: -0.5,
    ParamBrowRY: -0.5,
  },
  surprised: {
    ParamMouthOpenY: 1.4,
    ParamEyeLOpen: 1.3,
    ParamEyeROpen: 1.3,
    ParamBrowLY: 0.8,
    ParamBrowRY: 0.8,
  },
  angry: {
    ParamMouthOpenY: 0.9,
    ParamEyeLOpen: 1.0,
    ParamEyeROpen: 1.0,
    ParamBrowLY: -0.8,
    ParamBrowRY: -0.8,
  },
  romantic: {
    ParamMouthOpenY: 0.8,
    ParamEyeLOpen: 0.7,
    ParamEyeROpen: 0.7,
    ParamBrowLY: 0.1,
    ParamBrowRY: 0.1,
  },
  shy: {
    ParamMouthOpenY: 0.5,
    ParamEyeLOpen: 0.9,
    ParamEyeROpen: 0.9,
    ParamBrowLY: -0.2,
    ParamBrowRY: -0.2,
  },
  neutral: {
    ParamMouthOpenY: 1.0,
    ParamEyeLOpen: 1.0,
    ParamEyeROpen: 1.0,
    ParamBrowLY: 0.0,
    ParamBrowRY: 0.0,
  },
};

/**
 * Generate lip-sync frames from text.
 * Analyzes text for vowels and punctuation to create mouth movement data.
 */
export function generateLipSync(text: string): LipSyncFrame[] {
  const vowels = 'aeiouAEIOU啊哦呃诶喔呜育奥爱欧安恩昂应翁aeiouy';
  const frames: LipSyncFrame[] = [];
  const chars = [...text];

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
    } else if (/[，。！？、,\.!\?]/.test(char)) {
      if (isOpen) {
        frames.push({ mouthOpen: 0.7, duration: frameDuration });
        isOpen = false;
        frameDuration = 0;
      }
      frames.push({ mouthOpen: 0, duration: 200 });
    } else {
      if (isOpen) {
        frames.push({ mouthOpen: 0.4, duration: frameDuration });
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
    frames.push({ mouthOpen: isOpen ? 0.4 : 0, duration: frameDuration });
  }

  return frames.length > 0 ? frames : [{ mouthOpen: 0, duration: 500 }];
}

/**
 * Idle animation timer - returns expressions to cycle through
 */
export function* idleExpressionCycle(): Generator<string> {
  const expressions = ['neutral', 'neutral', 'neutral', 'happy', 'neutral', 'neutral', 'shy', 'neutral'];
  let i = 0;
  while (true) {
    yield expressions[i % expressions.length];
    i++;
  }
}

/**
 * Blink pattern generator
 * Returns delay in ms until next blink
 */
export function blinkPattern(): number {
  // Natural blinking: rapid double-blinks sometimes, regular blinks most times
  const rand = Math.random();
  if (rand < 0.05) return 200;  // rapid follow-up blink
  if (rand < 0.1) return 400;   // delayed follow-up
  return 2500 + Math.random() * 4000;  // normal interval
}
