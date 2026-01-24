# Voice Conversation Feature Setup (Updated)

## Overview

The voice conversation feature allows users to have voice conversations with AI agents using:
- **Web Speech API** (browser-based speech-to-text) - no API key needed
- **Gemini** for generating agent responses
- **Kokoro (Replicate)** for text-to-speech

## Key Features

- ✅ **Pause-based recording**: Automatically stops after 4 seconds of silence
- ✅ **Real-time transcription**: Shows interim results while speaking
- ✅ **Loading states**: Shows processing indicator during API calls
- ✅ **Context-aware**: Uses email conversation history for better responses
- ✅ **Audio playback**: Automatically plays agent's voice response

## Backend Setup

### 1. Install Dependencies

```bash
cd csp-backend
npm install replicate
```

**Note**: No longer need `multer` or `@types/multer` since we're not handling audio files.

### 2. Environment Variables

Add to your `.env` file:

```env
# Gemini API (already configured)
GEMINI_API_KEY=your_gemini_api_key_here

# Replicate API for Kokoro TTS
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

### 3. Get Replicate API Token

1. Go to: https://replicate.com/
2. Sign up/Login
3. Go to Account Settings > API Tokens
4. Create a new token
5. Copy and add to `.env` as `REPLICATE_API_TOKEN`

## Frontend Setup

No additional dependencies needed! The Web Speech API is built into modern browsers.

### Browser Support

- ✅ Chrome/Edge (Chromium)
- ✅ Safari
- ⚠️ Firefox (limited support)

## How It Works

1. **User clicks "Start Recording"** → Web Speech API starts listening
2. **User speaks** → Real-time transcription shown (interim results)
3. **4 seconds of silence** → Recording automatically stops
4. **Frontend sends text** → Transcribed text sent to backend
5. **Backend processes**:
   - Sends text to Gemini with conversation context
   - Gets text response from Gemini
   - Sends text to Kokoro (Replicate) for TTS
   - Saves exchange to database
6. **Frontend receives**:
   - Agent's text response
   - Agent's audio response (URL)
7. **Audio plays automatically** → User hears agent's response

## API Endpoints

- `POST /conversations/:id/voice` - Process voice text
  - Body: `{ text: "user's transcribed text" }`
  - Returns: `{ exchange: { id, userTranscript, agentResponse, agentAudioUrl } }`

- `GET /conversations/:id/voice` - Get all voice exchanges
  - Returns: `{ exchanges: [...] }`

## Implementation Details

### Frontend (VoiceSidebar.tsx)

- Uses Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`)
- Continuous recording with interim results
- Auto-stop after 4 seconds of silence
- Shows loading state during processing
- Displays interim transcript while recording

### Backend (voice/index.ts)

- Receives text (not audio)
- Processes with Gemini using conversation context
- Generates audio with Kokoro via Replicate
- Saves exchange to database

## Database Schema

`VoiceExchange` model:
- `id` - Unique identifier
- `conversationId` - Foreign key to EmailConversation
- `userAudioUrl` - Not used (null)
- `userTranscript` - Transcribed text from Web Speech API
- `agentResponse` - Agent's text response from Gemini
- `agentAudioUrl` - URL to agent's audio (from Kokoro)
- `createdAt`, `updatedAt` - Timestamps

## Notes

- **No API key needed for speech-to-text**: Uses browser's built-in Web Speech API
- **Privacy**: Speech recognition happens in the browser, only text is sent to backend
- **Silence detection**: 4-second timeout can be adjusted in `VoiceSidebar.tsx`
- **Kokoro voice**: Currently using "af_bella" - can be changed in `src/core/voice/index.ts`
- **Gemini model**: Uses same model as text conversations (gemini-2.5-flash-lite)
