const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // For security
const qr = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('./database'); // SQLite database setup

const app = express();
const PORT = process.env.PORT || 3000;

// Define allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'https://qr-code-generator-4xvi.onrender.com',
];

// Middleware: CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl)
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
        imgSrc: ["'self'", 'data:'], // Allow QR code images
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

// Route: Generate QR Code
app.post('/generate', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cleanUrl = url.trim();
    const isValidUrl = (string) => {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    };

    if (!isValidUrl(cleanUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const id = uuidv4();
    const dynamicUrl = `${req.protocol}://${req.get('host')}/redirect/${id}`;
    log(`Generated dynamic URL: ${dynamicUrl}`);

    // Save to database
    try {
      const stmt = db.prepare(
        `INSERT INTO links (id, originalUrl, dynamicUrl) VALUES (?, ?, ?)`
      );
      stmt.run(id, cleanUrl, dynamicUrl);
    } catch (error) {
      console.error('Database Insert Error:', error.message);
      return res.status(500).json({ error: 'Failed to save link to the database', details: error.message });
    }

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
    const stmt = db.prepare(`SELECT * FROM links`);
    const rows = stmt.all();

    res.json(rows);
  } catch (error) {
    console.error('Database Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve links', details: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database connection:', err.message);
    } else {
      log('Database connection closed.');
    }
    process.exit(0);
  });
});

// Ensure the database schema exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      originalUrl TEXT NOT NULL,
      dynamicUrl TEXT NOT NULL
    )
  `);
  log('Database initialized successfully.');
} catch (error) {
  console.error('Error initializing database:', error.message);
  process.exit(1);
}

// Start the server
app.listen(PORT, () => log(`Server running on port ${PORT}`));
