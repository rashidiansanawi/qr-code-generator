document.getElementById('qrForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = document.getElementById('url').value;

  try {
    // Dynamically determine API endpoint
    const apiBaseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://qr-code-generator-4xvi.onrender.com'; // Replace with your Render app URL

    // Send request to backend
    const response = await fetch(`${apiBaseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }

    // Parse the response
    const data = await response.json();

    // Render the QR code
    document.getElementById('output').innerHTML = `
      <p>Dynamic URL: <a href="${data.dynamicUrl}" target="_blank">${data.dynamicUrl}</a></p>
      <img src="${data.qrCode}" alt="QR Code">
    `;
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('output').innerText = 'Failed to generate QR code.';
  }
});
