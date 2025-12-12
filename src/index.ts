import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateNewsletter } from './generate';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Niches Hunter Newsletter Generator',
    timestamp: new Date().toISOString()
  });
});

// Manual trigger endpoint
app.post('/generate', async (req, res) => {
  console.log('📰 Manual newsletter generation triggered');
  
  // Respond immediately
  res.json({ 
    success: true, 
    message: 'Newsletter generation started...' 
  });

  // Generate in background
  generateNewsletter().catch(err => {
    console.error('❌ Newsletter generation failed:', err);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Newsletter Generator running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Generate: POST http://localhost:${PORT}/generate`);
});

