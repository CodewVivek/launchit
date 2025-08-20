import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LaunchIT Backend is running' });
});

// Basic AI endpoints (you can expand these later)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'LaunchIT AI Backend' });
});

app.listen(PORT, () => {
  console.log(`LaunchIT Backend running on port ${PORT}`);
}); 