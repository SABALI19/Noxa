// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/ai', async (req, res) => {
  try {
    console.log('📥 Request received:', JSON.stringify(req.body, null, 2));
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    console.log('📤 Response status:', response.status);
    console.log('📤 Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ API Error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('💥 Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Proxy running on http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);
});