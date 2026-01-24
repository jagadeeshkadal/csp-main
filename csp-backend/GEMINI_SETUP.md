# Gemini API Key Setup Guide

## How to Get Your Gemini API Key

### Option 1: Google AI Studio (Recommended - Easiest)

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/
   - Sign in with your Google account

2. **Get API Key**
   - Click on "Get API Key" in the left sidebar
   - Or go directly to: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Choose to create a new Google Cloud project or use an existing one
   - Copy your API key

3. **Add to Environment Variables**
   - Add the key to your `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### Option 2: Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Enable Gemini API**
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Library"
   - Search for "Generative Language API"
   - Click "Enable"

3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - (Optional) Restrict the API key to "Generative Language API" for security

4. **Add to Environment Variables**
   - Add the key to your `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

## Important Notes

- **Free Tier**: Google AI Studio provides free API access with rate limits
- **Quotas**: Free tier typically includes:
  - 15 requests per minute (RPM)
  - 1,500 requests per day (RPD)
- **Pricing**: Check current pricing at: https://ai.google.dev/pricing
- **Security**: Never commit your API key to version control. Always use `.env` files and add `.env` to `.gitignore`

## Model Options

You can specify which Gemini model to use in your `.env`:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp  # Latest experimental
# Or use:
# GEMINI_MODEL=gemini-1.5-flash     # Stable version
# GEMINI_MODEL=gemini-1.5-pro      # More capable but slower
```

## Testing Your API Key

After adding the key, restart your backend server and try sending a message. The agent should automatically respond using Gemini.
