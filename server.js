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

    db.run(
      `INSERT INTO links (id, originalUrl, dynamicUrl) VALUES (?, ?, ?)`,
      [id, url, dynamicUrl],
      (err) => {
        if (err) {
          console.error('Database Insert Error:', err.message);
          return res.status(500).json({ error: 'Failed to save link to the database', details: err.message });
        }
      }
    );

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

  db.get(`SELECT originalUrl FROM links WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Database Select Error:', err.message);
      return res.status(500).send('Internal Server Error');
    }

    if (row) {
      return res.redirect(row.originalUrl);
    } else {
      res.status(404).send('URL not found');
    }
  });
});

// Route: Fetch All Links
app.get('/links', (req, res) => {
  db.all(`SELECT * FROM links`, [], (err, rows) => {
    if (err) {
      console.error('Database Fetch Error:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve links', details: err.message });
    }
    res.json(rows);
  });
});

// Start the server
app.listen(PORT, () => log(`Server running on port ${PORT}`));

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
