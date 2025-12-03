# Render Deployment Guide

## Quick Start

### Step 1: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Blueprint"
3. Connect repository: `Hari569-h/GrowthMak-AI---ALIA-Lead-Qualification-Chat`
4. Branch: `main`
5. Add environment variables:
   - `VAPI_SECRET_KEY`
   - `VAPI_ASSISTANT_ID`
   - `OPENAI_API_KEY`
6. Click "Apply" to deploy
7. Copy your backend URL (e.g., `https://growthmak-ai-backend.onrender.com`)

### Step 2: Update Frontend

Add this script to the `<head>` section of `index.html` (around line 10):

```html
<script>
    window.BACKEND_URL = 'https://YOUR-RENDER-URL.onrender.com/api/alia-text-chat';
</script>
```

Replace `YOUR-RENDER-URL` with your actual Render URL.

### Step 3: Push and Test

```bash
git add index.html
git commit -m "Configure backend URL for production"
git push origin main
```

Visit: `https://hari569-h.github.io/GrowthMak-AI---ALIA-Lead-Qualification-Chat/`

## Troubleshooting

### Connection Failed
- Verify `BACKEND_URL` matches your Render URL exactly
- Check Render logs for errors
- Ensure environment variables are set in Render dashboard

### CORS Errors
Update `server.js` line 10:
```javascript
res.header('Access-Control-Allow-Origin', 'https://hari569-h.github.io');
```

### Backend Sleeping (Free Tier)
- Render free tier spins down after 15 minutes
- First request takes 30-60 seconds to wake up
- Consider upgrading to paid tier for always-on service

## Environment Variables

Set these in Render Dashboard → Environment:

```
VAPI_SECRET_KEY=your_vapi_secret_key_here
VAPI_ASSISTANT_ID=your_vapi_assistant_id_here
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note**: Use the actual values from your `.env` file. Do not commit these to GitHub.

## Testing

Test backend directly:
```bash
curl -X POST https://YOUR-RENDER-URL.onrender.com/api/alia-text-chat \
  -H "Content-Type: application/json" \
  -d '{"userText":"Hello"}'
```

Expected response:
```json
{
  "success": true,
  "assistantText": "Hi there! Thanks for calling...",
  "assistantAudioUrl": "data:audio/mp3;base64,...",
  ...
}
```
