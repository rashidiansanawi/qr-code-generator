const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000'
  : 'https://qr-code-generator-4xvi.onrender.com';

// Fetch links with pagination
async function fetchLinks(searchQuery = '', limit = 10, offset = 0) {
  const url = searchQuery
    ? `${API_BASE_URL}/links/search?query=${searchQuery}`
    : `${API_BASE_URL}/links?limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  return response.json();
}

// Delete a link
async function deleteLink(id) {
  const response = await fetch(`${API_BASE_URL}/links/${id}`, { method: 'DELETE' });
  return response.ok;
}

// Update a link
async function updateLink(id, newUrl) {
  const response = await fetch(`${API_BASE_URL}/links/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalUrl: newUrl }),
  });
  return response.ok;
}

// Render links in the table
function renderLinksTable(links) {
  const tableBody = document.querySelector('#linksTable tbody');
  tableBody.innerHTML = ''; // Clear previous rows

  links.forEach(link => {
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
      const links = await fetchLinks();
      renderLinksTable(links);
    } else {
      alert('Failed to delete link.');
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
      const links = await fetchLinks();
      renderLinksTable(links);
    } else {
      alert('Failed to update link.');
    }
  }
}

// Initial load
(async () => {
  const links = await fetchLinks();
  renderLinksTable(links);
})();
