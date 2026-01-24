# Gemini API Key Setup - Firebase or Google AI Studio

**Good news!** Both Firebase and Google AI Studio use the **same Google Generative AI SDK**. The only difference is where you get the API key from.

## Quick Answer

You can get the API key from either:
1. **Google AI Studio** (Easiest, Free Tier) - Recommended
2. **Firebase Console** (Same project, if you prefer)

Both work the same way - just add the API key to your `.env` file!

## Option 1: Google AI Studio (Recommended - Free Tier)

**Best for**: Getting started quickly, free tier access

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

**Benefits**: 
- ✅ Free tier (15 requests/min, 1,500 requests/day)
- ✅ No credit card required
- ✅ Works immediately

## Option 2: Use Same Firebase Project

**Best for**: Keeping everything in one Firebase project

Since you're already using Firebase (project: `csp-dev-36bf8`), you can:

1. **Option A: Get API key from Google AI Studio** (same Google account)
   - Use the same Google account that owns your Firebase project
   - Get API key from: https://aistudio.google.com/app/apikey
   - It will be linked to the same Google Cloud project

2. **Option B: Use Vertex AI** (requires Blaze plan)
   - Enable Vertex AI API in Google Cloud Console
   - Use service account credentials
   - More complex setup, but integrated with Firebase billing

## Which Should You Use?

- **Just starting / Free tier**: Use **Option 1** (Google AI Studio)
- **Already on Firebase Blaze plan**: Use **Option 2B** (Vertex AI)
- **Want simplicity**: Use **Option 1** (Google AI Studio) - it still works with your Firebase project!

## Setup Steps

1. Get API key from either source above
2. Add to your `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Restart your backend server
4. Send a message - the agent will automatically respond!

## Important Notes

- **Same SDK**: Both methods use the same `@google/generative-ai` package
- **Same Project**: If you use the same Google account, the API key works with your Firebase project
- **No Special Setup**: The code works the same regardless of where you got the key from

## Testing

After adding the API key, restart your backend and send a message. The agent should automatically respond using Gemini!
