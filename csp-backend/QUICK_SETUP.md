# Quick Gemini API Key Setup for Your Project

Since you're using Firebase project `csp-dev-36bf8`, here's the fastest way to get your Gemini API key:

## Step 1: Get API Key

1. **Go to Google AI Studio**: https://aistudio.google.com/app/apikey
2. **Sign in** with the same Google account that owns your Firebase project (`csp-dev-36bf8`)
3. **Click "Create API Key"**
4. **Select your project** (it should show `csp-dev-36bf8` or create a new one)
5. **Copy the API key**

## Step 2: Add to Backend

Add the API key to your `csp-backend/.env` file:

```env
GEMINI_API_KEY=AIzaSy...your_key_here
```

## Step 3: Restart Backend

Restart your backend server and you're done!

## Your Firebase Config (for reference)

Your frontend Firebase config:
- Project ID: `csp-dev-36bf8`
- This is the same project you'll use for Gemini API key

## That's It!

The API key from Google AI Studio will work with your Firebase project since they're both under the same Google account. No additional setup needed!
