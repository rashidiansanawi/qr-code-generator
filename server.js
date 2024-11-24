const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // For security
const qr = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('./database'); // SQLite database setup

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ['https://qr-code-generator-4xvi.onrender.com', 'http://localhost:3000'],
  })
);
app.use(helmet()); // Security headers
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

    const isValidUrl = (string) => {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    };

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const id = uuidv4();
    const dynamicUrl = `${req.protocol}://${req.get('host')}/redirect/${id}`;
    log(`Generated dynamic URL: ${dynamicUrl}`);

    // Save to database
    const stmt = db.prepare(
      `INSERT INTO links (id, originalUrl, dynamicUrl) VALUES (?, ?, ?)`
    );
    stmt.run(id, url, dynamicUrl);

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

  // Retrieve original URL
  const stmt = db.prepare(`SELECT originalUrl FROM links WHERE id = ?`);
  const row = stmt.get(id);

  if (row) {
    return res.redirect(row.originalUrl);
  } else {
    res.status(404).send('URL not found');
  }
});

// Route: Fetch All Links
app.get('/links', (req, res) => {
  const stmt = db.prepare(`SELECT * FROM links`);
  const rows = stmt.all();

  res.json(rows);
});

// Start the server
app.listen(PORT, () => log(`Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down server...');
  db.close();
  process.exit(0);
});
