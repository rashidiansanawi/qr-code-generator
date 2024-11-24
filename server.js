const express = require('express');
const cors = require('cors'); // For handling CORS
const qr = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000; // Render will set the PORT environment variable

// Middleware
app.use(
  cors({
    origin: 'https://qr-code-generator-4xvi.onrender.com', // Replace with your Render app URL
  })
); // Enable CORS for frontend requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve frontend files from the 'public' folder

// In-memory "database" for URL mapping
let urlDatabase = {};

// Route: Generate QR Code
app.post('/generate', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Create a unique ID and map it to the original URL
    const id = uuidv4();
    urlDatabase[id] = url;

    // Generate the dynamic URL
    const dynamicUrl = `${req.protocol}://${req.get('host')}/redirect/${id}`;
    console.log('Generated dynamic URL:', dynamicUrl);

    // Create QR code with the dynamic URL
    const qrCode = await qr.toDataURL(dynamicUrl);

    // Return the QR code and dynamic URL
    res.json({ qrCode, dynamicUrl });
  } catch (error) {
    console.error('QR Code Generation Error:', error.message);
    res.status(500).json({ error: 'Error generating QR code', details: error.message });
  }
});

// Route: Redirect to Original URL
app.get('/redirect/:id', (req, res) => {
  const id = req.params.id;

  // Find the original URL based on the unique ID
  const originalUrl = urlDatabase[id];

  if (originalUrl) {
    return res.redirect(originalUrl);
  }

  res.status(404).send('URL not found');
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
