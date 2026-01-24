# Fix API_KEY_SERVICE_BLOCKED Error

You're getting a `403 Forbidden` error with `API_KEY_SERVICE_BLOCKED`. This means your API key doesn't have access to the Generative Language API.

## Solution 1: Enable Generative Language API (Recommended)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project: `csp-dev-36bf8` (or the project where you created the API key)

2. **Enable the API**
   - Go to "APIs & Services" > "Library"
   - Search for "Generative Language API"
   - Click on it and click "Enable"
   - Wait for it to enable (may take a minute)

3. **Verify API Key Permissions**
   - Go to "APIs & Services" > "Credentials"
   - Find your API key
   - Click on it to edit
   - Under "API restrictions", make sure:
     - Either "Don't restrict key" is selected, OR
     - "Restrict key" is selected AND "Generative Language API" is in the allowed APIs list

4. **Restart your backend server**

## Solution 2: Create a New API Key

If the above doesn't work, create a new API key:

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Select your project or create a new one
   - Copy the new API key

2. **Update your .env file**
   ```env
   GEMINI_API_KEY=your_new_api_key_here
   ```

3. **Restart your backend server**

## Solution 3: Use a Different Model

The code has been updated to use `gemini-1.5-flash` by default (more stable). If you want to try a different model, update your `.env`:

```env
GEMINI_MODEL=gemini-1.5-flash
# Or try:
# GEMINI_MODEL=gemini-1.5-pro
```

## Why This Happens

- The API key might have been created before the Generative Language API was enabled
- The API key might have restrictions that block this API
- The model `gemini-2.0-flash-exp` might not be available for your API key type

## After Fixing

1. Restart your backend server
2. Try sending a message again
3. The agent should now respond using Gemini
