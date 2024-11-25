const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const qr = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'https://qr-code-generator-4xvi.onrender.com',
];

// Middleware: CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

// Middleware: Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
  })
);

app.use(express.json());
app.use(express.static('public'));

// Utility: Log with timestamp
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);

// Utility: Validate URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Utility: Apply Schema Migrations
const applyMigrations = () => {
  log('Applying database schema migrations...');
  const migrations = [
    {
      name: 'create_links_table',
      sql: `
        CREATE TABLE IF NOT EXISTS links (
          id TEXT PRIMARY KEY,
          originalUrl TEXT NOT NULL,
          dynamicUrl TEXT NOT NULL,
          redirectCount INTEGER DEFAULT 0
        )
      `,
    },
  ];

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  migrations.forEach(({ name, sql }) => {
    const alreadyApplied = db
      .prepare('SELECT COUNT(*) AS count FROM migrations WHERE name = ?')
      .get(name).count;

    if (!alreadyApplied) {
      try {
        db.exec(sql);
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
        log(`Migration applied: ${name}`);
      } catch (error) {
        log(`Error applying migration ${name}: ${error.message}`);
      }
    } else {
      log(`Migration already applied: ${name}`);
    }
  });
};

// Apply schema migrations on startup
applyMigrations();

// Route: Generate QR Code
app.post('/generate', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cleanUrl = url.trim();

    if (!isValidUrl(cleanUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const id = uuidv4();
    const dynamicUrl = `${req.protocol}://${req.get('host')}/redirect/${id}`;
    log(`Generated dynamic URL: ${dynamicUrl}`);

    const stmt = db.prepare(
      `INSERT INTO links (id, originalUrl, dynamicUrl, redirectCount) VALUES (?, ?, ?, 0)`
    );
    stmt.run(id, cleanUrl, dynamicUrl);

    const qrCode = await qr.toDataURL(dynamicUrl);
    res.json({ qrCode, dynamicUrl });
  } catch (error) {
    console.error('QR Code Generation Error:', error.message);
    res.status(500).json({ error: 'Error generating QR code', details: error.message });
  }
});

// Route: Redirect to Original URL
app.get('/redirect/:id', (req, res) => {
  const id = req.params.id;

  try {
    const stmt = db.prepare(`SELECT originalUrl FROM links WHERE id = ?`);
    const row = stmt.get(id);

    if (row) {
      db.prepare(`UPDATE links SET redirectCount = redirectCount + 1 WHERE id = ?`).run(id);
      log(`Redirecting to: ${row.originalUrl}`);
      return res.redirect(row.originalUrl);
    } else {
      res.status(404).json({ error: 'URL not found', id });
    }
  } catch (error) {
    console.error('Database Query Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Route: Fetch All Links
app.get('/links', (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const stmt = db.prepare(`SELECT * FROM links LIMIT ? OFFSET ?`);
    const rows = stmt.all(parseInt(limit), parseInt(offset));
    res.json(rows);
  } catch (error) {
    console.error('Database Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve links', details: error.message });
  }
});

// Route: Delete a Link
app.delete('/links/:id', (req, res) => {
  const id = req.params.id;

  try {
    const stmt = db.prepare(`DELETE FROM links WHERE id = ?`);
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ success: true, id });
  } catch (error) {
    console.error('Database Delete Error:', error.message);
    res.status(500).json({ error: 'Failed to delete link', details: error.message });
  }
});

// Route: Update a Link
app.put('/links/:id', (req, res) => {
  const id = req.params.id;
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }

  try {
    const stmt = db.prepare(`UPDATE links SET originalUrl = ? WHERE id = ?`);
    const result = stmt.run(originalUrl, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ success: true, id, originalUrl });
  } catch (error) {
    console.error('Database Update Error:', error.message);
    res.status(500).json({ error: 'Failed to update link', details: error.message });
  }
});

// Route: Search Links
app.get('/links/search', (req, res) => {
  const { query = '' } = req.query;

  try {
    const stmt = db.prepare(`
      SELECT * FROM links WHERE originalUrl LIKE ? OR dynamicUrl LIKE ?
    `);
    const rows = stmt.all(`%${query}%`, `%${query}%`);
    res.json(rows);
  } catch (error) {
    console.error('Database Search Error:', error.message);
    res.status(500).json({ error: 'Failed to search links', details: error.message });
  }
});

// Route: Serve Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

app.listen(PORT, () => log(`Server running on port ${PORT}`));
