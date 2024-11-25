document.getElementById('qrForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent default form submission

  const url = document.getElementById('url').value.trim(); // Trim whitespace
  const loading = document.getElementById('loading');
  const output = document.getElementById('output');

  // Clear previous messages and set loading state
  output.innerHTML = '';
  loading.style.display = 'none';

  // Validate URL format (additional client-side validation)
  if (!url || !isValidUrl(url)) {
    output.innerHTML = `
      <p style="color: red;">
        Invalid URL! Please enter a valid URL starting with http or https.
      </p>`;
    return;
  }

  try {
    // Show loading message
    loading.style.display = 'block';

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
      const errorMsg = `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    // Parse the response
    const data = await response.json();

    // Render the QR code and dynamic URL
    output.innerHTML = `
      <p>Dynamic URL: 
        <a href="${data.dynamicUrl}" target="_blank">${data.dynamicUrl}</a>
      </p>
      <img src="${data.qrCode}" alt="Generated QR Code">
    `;
  } catch (error) {
    console.error('Error:', error); // Log error details
    const errorMessage =
      error.message.includes('NetworkError') || error.message.includes('Failed to fetch')
        ? 'Failed to connect to the server. Please check your network and try again.'
        : 'Failed to generate QR code. Please try again later.';
    output.innerHTML = `
      <p style="color: red;">${errorMessage}</p>
    `;
  } finally {
    // Always hide loading message
    loading.style.display = 'none';
  }
});

// Utility function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
