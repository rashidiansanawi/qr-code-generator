async function fetchLinks() {
    const response = await fetch('/links');
    const links = await response.json();
  
    const tableBody = document.getElementById('linkTableBody');
    tableBody.innerHTML = '';
  
    links.forEach((link) => {
      const row = `
        <tr>
          <td>${link.id}</td>
          <td>${link.originalUrl}</td>
          <td><a href="${link.dynamicUrl}" target="_blank">${link.dynamicUrl}</a></td>
          <td>${link.redirectCount || 0}</td>
          <td>
            <button onclick="deleteLink('${link.id}')">Delete</button>
            <button onclick="updateLink('${link.id}')">Update</button>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }
  
  async function deleteLink(id) {
    if (confirm('Are you sure you want to delete this link?')) {
      await fetch(`/links/${id}`, { method: 'DELETE' });
      fetchLinks();
    }
  }
  
  async function updateLink(id) {
    const newUrl = prompt('Enter the new URL:');
    if (newUrl) {
      await fetch(`/links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: newUrl }),
      });
      fetchLinks();
    }
  }
  
  // Load links on page load
  fetchLinks();
  