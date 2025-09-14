import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./suporte.db', (err) => {
  if (err) console.error('Erro ao conectar no banco:', err.message);
  else console.log('Conectado ao banco suporte.db');
});

// Cria tabela se não existir
db.serialize(() => {
  // Cria tabela de Departamentos se não existir
  db.run(`CREATE TABLE IF NOT EXISTS departamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE
  );`);

  // Cria tabela de Chamados se não existir
  db.run(`CREATE TABLE IF NOT EXISTS chamados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    departamento_id INTEGER NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aberto',
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
  );`);
});




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

// Abrir um chamado
app.post('/api/chamados', (req, res) => {
  const { titulo, departamento_id, descricao } = req.body;
  if (!titulo || !descricao || !departamento_id) {
    return res.status(400).json({ error: 'Título, departamento e descrição são obrigatórios' });
  }

  db.run(
    `INSERT INTO chamados (titulo, departamento_id, descricao, status) VALUES (?, ?, ?, ?)`,
    [titulo, departamento_id, descricao, 'aberto'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, titulo, departamento_id, descricao, status: 'aberto' });
    }
  );
});




// Listar chamados
app.get('/api/chamados', (req, res) => {
  const query = `
    SELECT c.id, c.titulo, c.descricao, c.status, c.departamento_id, d.nome AS departamento
    FROM chamados c
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    ORDER BY c.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});




// Atualizar status de um chamado
app.put('/api/chamados/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status obrigatório' });

  db.run(
    'UPDATE chamados SET status = ? WHERE id = ?',
    [status, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Chamado não encontrado' });
      res.json({ id, status });
    }
  );
});

// Listar departamentos
app.get('/api/departamentos', (req, res) => {
  db.all('SELECT * FROM departamentos ORDER BY nome', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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

// Remover chamado
app.delete('/api/chamados/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM chamados WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Chamado não encontrado' });
    res.json({ id });
  });
});
