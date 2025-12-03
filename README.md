# GrowthMak AI - ALIA Lead Qualification Chat

A text-based chat interface powered by Vapi.ai for lead qualification conversations with ALIA (AI Lead Intelligence Assistant).

## Features

- 💬 **Text Chat Interface** - Clean, modern chat UI for conversing with ALIA
- 🔊 **Text-to-Speech** - Automatic audio playback using OpenAI TTS
- 💾 **Session Persistence** - Conversations maintain context across page refreshes
- 🛠️ **Tool Integration** - Supports website scraping and lead data saving via Vapi tools
- 🎨 **Premium UI** - Glassmorphism design with smooth animations

## Prerequisites

- Node.js (v14 or higher)
- Vapi.ai account with API key
- OpenAI API key (for TTS)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   The `.env` file is already configured with your credentials:
   ```env
   VAPI_SECRET_KEY=22171d0c-5138-4cad-8bb3-75d445a1bfa6
   VAPI_ASSISTANT_ID=ce3510e6-bba0-4edf-bc6c-5776c46affc0
   OPENAI_API_KEY=sk-proj-...
   PORT=3000
   NODE_ENV=development
   ```

## Usage

1. **Start the server**:
   ```bash
   node server.js
   ```

2. **Open the chat interface**:
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

3. **Start chatting**:
   
   Type your message and click Send. ALIA will respond with text and audio.

## Project Structure

```
GrowthMak Voice Agent/
├── server.js          # Express backend with Vapi integration
├── index.html         # Frontend chat interface
├── .env              # Environment variables (credentials)
├── package.json      # Node.js dependencies
└── README.md         # This file
```

## How It Works

### Backend (`server.js`)

1. **Session Management**: Stores conversation history in memory for context continuity
2. **Vapi Integration**: Sends messages to Vapi's `/chat` endpoint with assistant ID
3. **Response Processing**: Extracts assistant messages and filters out tool call logs
4. **TTS Generation**: Converts text responses to audio using OpenAI's TTS API
5. **Server Instance Tracking**: Detects server restarts and prompts client refresh

### Frontend (`index.html`)

1. **User Input**: Captures messages from input field
2. **API Communication**: Sends messages to `/api/alia-text-chat` endpoint
3. **Session Persistence**: Stores session ID in localStorage
4. **Message Display**: Shows user and assistant messages in chat bubbles
5. **Audio Playback**: Automatically plays TTS audio for responses

## API Endpoints

### `POST /api/alia-text-chat`

Send a message to ALIA.

**Request Body**:
```json
{
  "userText": "Hello",
  "sessionId": "session-123-abc",
  "serverInstanceId": "1764753815770",
  "userMetadata": {
    "timestamp": "2025-12-03T09:22:47.355Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "assistantText": "Hi there! Thanks for calling...",
  "assistantAudioUrl": "data:audio/mp3;base64,...",
  "sessionId": "session-123-abc",
  "chatId": "7c038304-fe82-4693-9460-d53957268d96",
  "serverInstanceId": "1764753815770",
  "metadata": {
    "conversationLength": 2,
    "timestamp": "2025-12-03T09:22:47.355Z"
  }
}
```

### `GET /health`

Check server health and status.

**Response**:
```json
{
  "status": "ok",
  "serverInstanceId": "1764753815770",
  "activeSessionCount": 3
}
```

## Vapi Assistant Configuration

Your assistant is configured with:

- **Assistant ID**: `ce3510e6-bba0-4edf-bc6c-5776c46affc0`
- **Model**: GPT-4 Turbo
- **Voice**: ElevenLabs (Rachel)
- **Tools**: 
  - `scrape_website` - Analyzes company websites
  - `save_lead_data` - Saves qualified leads to database

## Troubleshooting

### "Assistant not found" Error
- Verify `VAPI_ASSISTANT_ID` in `.env` matches your Vapi dashboard
- Check that `VAPI_SECRET_KEY` is valid

### No Audio Playing
- Ensure `OPENAI_API_KEY` is valid and has credits
- Check browser console for audio playback errors
- Verify browser allows autoplay (some browsers block it)

### Session Not Persisting
- Check browser localStorage is enabled
- Verify server hasn't restarted (changes `SERVER_INSTANCE_ID`)

### Tools Not Being Called
- Verify tool webhooks are configured in Vapi dashboard
- Check server logs for Vapi API responses
- Ensure assistant system prompt mentions when to call tools

## Development

### Running in Development Mode

The server is already configured for development with:
- Detailed error messages
- Console logging for debugging
- CORS enabled for local testing

### Testing

1. **Basic Chat**: Send "Hello" and verify response
2. **Session Persistence**: Refresh page and verify conversation continues
3. **Tool Calling**: Send "My website is https://example.com" to test scraper
4. **Audio**: Verify TTS audio plays automatically

## Production Deployment

1. Update `.env` with production values:
   ```env
   NODE_ENV=production
   PORT=3000
   ```

2. Remove detailed error messages from responses

3. Enable HTTPS for secure communication

4. Consider using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name growthmak-ai
   ```

## License

Proprietary - GrowthMak

## Support

For issues or questions, contact the GrowthMak development team.
