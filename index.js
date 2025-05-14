// index.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dbFile = './terms.db';
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize DB
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS terms (
      lang TEXT PRIMARY KEY,
      content TEXT
    )
  `);

  const enText = fs.readFileSync('./terms_en.txt', 'utf8');
  const svText = fs.readFileSync('./terms_sv.txt', 'utf8');

  db.run(
    `INSERT OR REPLACE INTO terms (lang, content) VALUES (?, ?)`,
    ['en', enText]
  );
  db.run(
    `INSERT OR REPLACE INTO terms (lang, content) VALUES (?, ?)`,
    ['sv', svText]
  );
});

// Health check
app.get('/', (req, res) => {
  res.send('API is working!');
});

// GET terms by lang
app.get('/api/terms', (req, res) => {
  const lang = req.query.lang || 'en';
  db.get('SELECT content FROM terms WHERE lang = ?', [lang], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Terms not found' });
    res.json({ content: row.content });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
