// server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Show env vars only in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Loaded Environment Variables:', {
    HF_MODEL: process.env.HF_MODEL || 'Not set',
    HF_API_KEY: process.env.HF_API_KEY ? 'Set' : 'Not set',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Set' : 'Not set',
    PORT: process.env.PORT || 5000,
  });
}

// Initialize Firebase Admin
try {
  const serviceAccount = require('./config/firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'resume-ai-a2edc.appspot.com',
  });
  console.log('🔥 Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

// Initialize Express
const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes with error check
const routes = [
  { path: '/api/auth', file: './routes/authRoutes' },
  { path: '/api/resume', file: './routes/resumeRoutes' },
  { path: '/api/payment', file: './routes/paymentRoutes' },
  { path: '/api/admin', file: './routes/adminRoutes' },
  { path: '/api/ai', file: './routes/aiRoutes' },
];

routes.forEach(r => {
  try {
    app.use(r.path, require(r.file));
  } catch (error) {
    console.error(`❌ Failed to load route ${r.path}:`, error.message);
    process.exit(1);
  }
});

// --- OpenAI Haiku API ---
app.post('/api/haiku', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, message: 'Prompt is required and must be a string' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: 'OpenAI API key is missing' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates haikus.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 50,
      },
      {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 30000,
      }
    );

    res.json({ success: true, haiku: response.data.choices[0].message.content });
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'OpenAI API request failed',
      error: error.response?.data || error.message,
    });
  }
});

// --- HuggingFace API ---
app.post('/api/huggingface', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, message: 'Prompt is required and must be a string' });
    }
    if (!process.env.HF_API_KEY) {
      return res.status(500).json({ success: false, message: 'HuggingFace API key is missing' });
    }
    if (!process.env.HF_MODEL) {
      return res.status(500).json({ success: false, message: 'HuggingFace model is not specified' });
    }

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${process.env.HF_MODEL}`,
      { inputs: prompt, parameters: { max_length: 100, return_full_text: false } },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
      res.json({ success: true, generated_text: response.data[0].generated_text });
    } else {
      res.status(500).json({ success: false, message: 'Invalid response from HuggingFace API' });
    }
  } catch (error) {
    console.error('❌ HuggingFace API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'HuggingFace API request failed',
      error: error.response?.data || error.message,
    });
  }
});

// --- Google Gemini API ---
const geminiAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;
app.post('/api/gemini', async (req, res) => {
  try {
    if (!geminiAI) {
      return res.status(500).json({ success: false, message: 'Google Gemini API key is missing' });
    }
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, message: 'Prompt is required and must be a string' });
    }

    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    res.json({ success: true, prompt, response: result.response.text() });
  } catch (error) {
    console.error('❌ Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Gemini API request failed', error: error.message });
  }
});

// --- Default route ---
app.get('/', (req, res) => res.send('🚀 Resume AI Backend is running'));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Something broke!', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
