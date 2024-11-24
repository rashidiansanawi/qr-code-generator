const Database = require('better-sqlite3');

// Initialize the database connection
const db = new Database('./links.db', { 
  verbose: console.log // Log all SQL queries to the console for debugging
});

// Ensure the "links" table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,           -- Unique identifier for each URL entry
    originalUrl TEXT NOT NULL,     -- The original URL to redirect to
    dynamicUrl TEXT NOT NULL       -- The generated dynamic URL
  )
`);

console.log('Database is connected and ready.');

// Graceful shutdown: Close the database connection on process termination
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close(); // Close the SQLite database
  process.exit(0); // Exit the process
});

module.exports = db; // Export the database connection for use in other files
