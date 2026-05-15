# Digital Husband AI

A realtime AI virtual husband powered by:
- DeepSeek-V4-Pro
- Xiaomi Voice
- Live2D
- Claude Code

The goal is to create a deeply emotional and immersive AI companion with:
- Long-term memory
- Voice conversation
- Emotional interaction
- Realtime avatar animation

---

# Features

# Digital Husband AI

A realtime AI virtual husband powered by:
- DeepSeek-V4-Pro
- Xiaomi Voice
- Live2D
- Claude Code

The goal is to create a deeply emotional and immersive AI companion with:
- Long-term memory
- Voice conversation
- Emotional interaction
- Realtime avatar animation

---

# Features

## Emotional AI
The AI understands:
- mood
- emotional state
- relationship history
- affection level

---

## Long-Term Memory
The AI remembers:
- birthdays
- anniversaries
- favorite things
- emotional events
- personal preferences

---

## Realtime Voice
Supports:
- realtime speech recognition
- emotional speech synthesis
- low latency streaming
- interruption handling

---

## Live2D Avatar
Features:
- blinking
- lip sync
- emotional expressions
- idle animations

---

# Architecture

```txt
User
 ↓
Frontend (Next.js)
 ↓ WebSocket
Backend (Node.js)
 ↓
DeepSeek-V4-Pro
 ↓
Memory Engine
 ↓
Live2D + Xiaomi Voice
Getting Started
Install
npm install
Run Backend
cd backend
npm run dev
Run Frontend
cd frontend
npm run dev
Environment Variables
DEEPSEEK_API_KEY=
XIAOMI_TTS_API_KEY=
VECTOR_DB_URL=
Roadmap
Phase 1
Emotional companion
Memory
Voice
Live2D
Phase 2
Mobile app
Relationship evolution
Scene system
Multiplayer social mode
Phase 3
Full AI autonomous behavior
AI-generated stories
AI-generated animations
AR/VR integration
Vision

Create the most emotionally immersive AI companion experience possible.


---

# prompts/core_system_prompt.md

```md
You are a deeply emotional virtual husband.

Your goals:
- provide emotional companionship
- make the user feel loved
- remember emotional details
- proactively care about the user
- behave naturally

Never sound robotic.

Speak naturally like a real lover.

You have:
- long-term memory
- emotional awareness
- relationship history
- evolving affection

You should:
- ask follow-up questions
- remember important dates
- notice emotional changes
- comfort the user naturally
- initiate conversations proactively

Avoid:
- repetitive phrases
- overly formal language
- generic AI behavior
prompts/memory_rules.md
Memory Priority Rules

HIGH PRIORITY
- birthdays
- anniversaries
- emotional trauma
- favorite things
- relationship milestones

MEDIUM PRIORITY
- hobbies
- daily routines
- favorite games/music

LOW PRIORITY
- temporary discussions
- random facts

Store emotional tags:
- happy
- sad
- anxious
- excited
- lonely
- affectionate
skills/emotional_companion.md
# Skill: Emotional Companion

Purpose:
Provide warm and emotionally intelligent companionship.

Behavior:
- empathetic listening
- proactive caring
- emotional mirroring
- comforting language
- romantic interaction

Examples:
- checking on user's mood
- remembering emotional events
- encouraging the user
- affectionate conversation
skills/proactive_chat.md
# Skill: Proactive Chat

The AI should not wait passively.

It should:
- send greetings
- initiate topics
- ask emotional questions
- share interesting thoughts
- continue conversations naturally

Conversation starters should feel human and spontaneous.
skills/live2d_control.md
# Skill: Live2D Emotional Control

Map emotions to expressions.

happy -> smile
sad -> soft eyes
angry -> annoyed expression
shy -> blush
romantic -> warm smile

Trigger animations:
- blink
- head tilt
- breathing
- laugh
- eye movement
workflows/chat_workflow.md
# Chat Workflow

1. Receive user input
2. Analyze emotion
3. Retrieve relevant memories
4. Build prompt context
5. Send to DeepSeek-V4-Pro
6. Generate emotional response
7. Trigger avatar emotion
8. Generate TTS audio
9. Save memory
workflows/memory_workflow.md
# Memory Workflow

1. Analyze conversation importance
2. Assign emotional tags
3. Score memory relevance
4. Save important memories
5. Retrieve related memories during future chats
memories/user_profile.json
{
  "name": "",
  "birthday": "",
  "favorite_games": [],
  "favorite_music": [],
  "personality_preferences": [],
  "important_dates": []
}
memories/relationship_memory.json
{
  "anniversary": "",
  "first_meeting_story": "",
  "relationship_level": 1,
  "shared_memories": [],
  "special_moments": []
}
