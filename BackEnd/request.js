import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = process.env.FRONTEND_DIR
  ? path.resolve(__dirname, process.env.FRONTEND_DIR)
  : path.resolve(__dirname, '../frontend');

app.use(express.json({ limit: '2mb' }));
app.use(cors());

// Healthcheck simples
app.get('/api/health', (req, res) => res.send('ok'));

// Compat com probe do frontend (usa /health relativo ao endpoint)
app.get('/api/health', (req, res) => res.send('ok'));
app.get('/health', (req, res) => res.send('ok'));

// Proxy Gemini
app.post('/api/gemini-chat', async (req, res) => {
  try {
    const { model = 'gemini-1.5-flash', contents } = req.body || {};
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY ausente no servidor' });
    }
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'contents inválido' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!r.ok) {
      const bodyText = await r.text();
      return res.status(r.status).json({ error: bodyText });
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Sirva o frontend estático (opcional: prod/dev juntos)
app.use(express.static(FRONTEND_DIR));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
  console.log(`Servindo frontend de ${FRONTEND_DIR}`);
});