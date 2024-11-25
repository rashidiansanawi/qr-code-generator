const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000'
  : 'https://qr-code-generator-4xvi.onrender.com';

// State variables for pagination
let currentPage = 0;
const LIMIT = 10;

// Fetch links with pagination or search
async function fetchLinks(searchQuery = '', limit = LIMIT, offset = currentPage * LIMIT) {
  try {
    const url = searchQuery
      ? `${API_BASE_URL}/links/search?query=${searchQuery}`
      : `${API_BASE_URL}/links?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch links: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching links:', error);
    alert('Failed to fetch links. Please try again later.');
    return [];
  }
}

// Delete a link
async function deleteLink(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/links/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete link: ${response.statusText}`);
    return true;
  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Failed to delete link. Please try again later.');
    return false;
  }
}

// Update a link
async function updateLink(id, newUrl) {
  try {
    if (!isValidUrl(newUrl)) throw new Error('Invalid URL format');
    const response = await fetch(`${API_BASE_URL}/links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalUrl: newUrl }),
    });
    if (!response.ok) throw new Error(`Failed to update link: ${response.statusText}`);
    return true;
  } catch (error) {
    console.error('Error updating link:', error);
    alert(error.message);
    return false;
  }
}

// Render links in the table
function renderLinksTable(links) {
  const tableBody = document.querySelector('#linksTable tbody');
  tableBody.innerHTML = ''; // Clear previous rows

  if (links.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No links found.</td></tr>';
    return;
  }

  links.forEach((link) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${link.id}</td>
      <td>${link.originalUrl}</td>
      <td><a href="${link.dynamicUrl}" target="_blank">${link.dynamicUrl}</a></td>
      <td>${link.redirectCount}</td>
      <td class="actions">
        <button onclick="handleDelete('${link.id}')">Delete</button>
        <button onclick="handleUpdate('${link.id}', '${link.originalUrl}')">Update</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Handle search
document.getElementById('searchButton').addEventListener('click', async () => {
  const searchInput = document.getElementById('searchInput').value.trim();
  const links = await fetchLinks(searchInput);
  renderLinksTable(links);
});

// Handle delete
async function handleDelete(id) {
  if (confirm('Are you sure you want to delete this link?')) {
    const success = await deleteLink(id);
    if (success) {
      alert('Link deleted successfully.');
      refreshTable();
    }
  }
}

// Handle update
async function handleUpdate(id, currentUrl) {
  const newUrl = prompt('Enter the new URL:', currentUrl);
  if (newUrl && newUrl !== currentUrl) {
    const success = await updateLink(id, newUrl);
    if (success) {
      alert('Link updated successfully.');
      refreshTable();
    }
  }
}

// Refresh table (handles pagination and search)
async function refreshTable() {
  const searchInput = document.getElementById('searchInput').value.trim();
  const links = await fetchLinks(searchInput);
  renderLinksTable(links);
}

// Handle pagination
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 0) {
    currentPage -= 1;
    refreshTable();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  currentPage += 1;
  refreshTable();
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

// Initial load
(async () => {
  await refreshTable();
})();
