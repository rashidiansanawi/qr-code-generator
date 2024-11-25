// QR Code Form Handler
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

// Fetch and Display Links in Dashboard
async function fetchLinks(query = '') {
  const tableBody = document.querySelector('#linksTable tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  try {
    // Dynamically determine API endpoint
    const apiBaseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://qr-code-generator-4xvi.onrender.com'; // Replace with your Render app URL

    // Fetch links
    const response = await fetch(`${apiBaseUrl}/links?query=${query}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch links: ${response.statusText}`);
    }

    const links = await response.json();

    // Populate table rows
    links.forEach((link) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${link.id}</td>
        <td>${link.originalUrl}</td>
        <td><a href="${link.dynamicUrl}" target="_blank">${link.dynamicUrl}</a></td>
        <td>${link.redirectCount}</td>
        <td>
          <button class="delete-btn" data-id="${link.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Add delete functionality
    document.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', () => deleteLink(button.dataset.id));
    });
  } catch (error) {
    console.error('Error fetching links:', error);
  }
}

// Delete Link
async function deleteLink(id) {
  if (!confirm('Are you sure you want to delete this link?')) return;

  try {
    // Dynamically determine API endpoint
    const apiBaseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://qr-code-generator-4xvi.onrender.com'; // Replace with your Render app URL

    // Send delete request
    const response = await fetch(`${apiBaseUrl}/links/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete link: ${response.statusText}`);
    }

    alert('Link deleted successfully!');
    fetchLinks(); // Refresh the table
  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Failed to delete the link. Please try again.');
  }
}

// Search Links
document.getElementById('searchBtn').addEventListener('click', (e) => {
  e.preventDefault();
  const query = document.getElementById('searchQuery').value.trim();
  fetchLinks(query);
});

// Fetch links on page load
fetchLinks();

// Utility function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
