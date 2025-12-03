const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Configuration
const VAPI_SECRET_KEY = process.env.VAPI_SECRET_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SERVER_INSTANCE_ID = Date.now().toString(); // Unique per server restart

// In-memory session storage
const sessions = {};

console.log('✅ Server Instance ID:', SERVER_INSTANCE_ID);
console.log('✅ VAPI_ASSISTANT_ID:', VAPI_ASSISTANT_ID ? 'Configured' : '❌ MISSING');
console.log('✅ OPENAI_API_KEY:', OPENAI_API_KEY ? 'Configured' : '❌ MISSING');

// ===== CORE ENDPOINT =====
app.post('/api/alia-text-chat', async (req, res) => {
  try {
    const { userText, sessionId, userMetadata, serverInstanceId } = req.body;

    // Validate input
    if (!userText || userText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userText is required'
      });
    }

    if (userText.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message exceeds 2000 character limit'
      });
    }

    // CRITICAL: Check if server restarted
    if (serverInstanceId && serverInstanceId !== SERVER_INSTANCE_ID) {
      console.warn('⚠️ Server instance mismatch - resetting session');
      return res.json({
        success: false,
        error: 'Server restarted. Please refresh the page.',
        serverRestarted: true,
        newServerInstanceId: SERVER_INSTANCE_ID
      });
    }

    // Initialize or retrieve session
    const currentSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!sessions[currentSessionId]) {
      sessions[currentSessionId] = {
        messages: [],
        previousChatId: null,
        createdAt: new Date(),
        metadata: userMetadata || {}
      };
      console.log('📝 New session created:', currentSessionId);
    } else {
      console.log('♻️ Existing session found:', currentSessionId);
    }

    // Add user message to history
    sessions[currentSessionId].messages.push({
      role: 'user',
      content: userText
    });

    // ==== CALL VAPI CHAT API ====
    const vapiPayload = {
      assistantId: VAPI_ASSISTANT_ID,
      input: sessions[currentSessionId].messages
    };

    console.log('📤 Sending to Vapi:', {
      assistantId: VAPI_ASSISTANT_ID,
      messageCount: sessions[currentSessionId].messages.length
    });

    const vapiResponse = await axios.post(
      'https://api.vapi.ai/chat',
      vapiPayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📥 Vapi Response Status:', vapiResponse.status);

    // ==== EXTRACT ASSISTANT RESPONSE ====
    const vapiData = vapiResponse.data;

    // Store chat ID for context (Vapi uses 'id' field)
    if (vapiData.id) {
      sessions[currentSessionId].chatId = vapiData.id;
    }

    // Get assistant's response from output array
    if (!vapiData.output || vapiData.output.length === 0) {
      throw new Error('No assistant response received from Vapi');
    }

    // Get the LAST assistant message from output
    const assistantMessages = vapiData.output.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length === 0) {
      throw new Error('No assistant message in Vapi response');
    }

    const latestAssistantMessage = assistantMessages[assistantMessages.length - 1];
    let assistantText = latestAssistantMessage.content;

    // CRITICAL: Remove tool call noise from display
    // Filter out lines that mention "Calling tool" or show function parameters
    assistantText = assistantText
      .split('\n')
      .filter(line => !line.includes('Calling tool') && !line.includes('Tool call'))
      .join('\n')
      .trim();

    // Add to session history
    sessions[currentSessionId].messages.push({
      role: 'assistant',
      content: assistantText
    });

    // ==== GENERATE TEXT-TO-SPEECH ====
    let audioUrl = null;
    try {
      // Clean text for TTS (remove newlines that break OpenAI TTS)
      const cleanText = assistantText.replace(/\n+/g, ' ').trim();

      const ttsResponse = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          voice: 'alloy',
          input: cleanText,
          response_format: 'mp3'
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // Convert audio buffer to base64
      const audioBuffer = Buffer.from(ttsResponse.data);
      const base64Audio = audioBuffer.toString('base64');
      audioUrl = `data:audio/mp3;base64,${base64Audio}`;

      console.log('✅ TTS Generated:', cleanText.substring(0, 50) + '...');
    } catch (ttsError) {
      console.error('⚠️ TTS Error:', ttsError.message);
      // Continue without audio - don't fail the entire request
    }

    // ==== RETURN RESPONSE ====
    const response = {
      success: true,
      assistantText: assistantText,
      assistantAudioUrl: audioUrl,
      sessionId: currentSessionId,
      chatId: vapiData.id || null,
      serverInstanceId: SERVER_INSTANCE_ID,
      metadata: {
        conversationLength: sessions[currentSessionId].messages.length,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Response sent:', {
      textLength: assistantText.length,
      hasAudio: !!audioUrl,
      sessionId: currentSessionId
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Check VAPI_SECRET_KEY.'
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Assistant not found. Check VAPI_ASSISTANT_ID.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process message. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    serverInstanceId: SERVER_INSTANCE_ID,
    activeSessionCount: Object.keys(sessions).length
  });
});

// Serve static files (index.html)
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
});
