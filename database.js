const Database = require('better-sqlite3');

// Create or open the database file
const db = new Database('./links.db', { verbose: console.log });

// Create the table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    originalUrl TEXT NOT NULL,
    dynamicUrl TEXT NOT NULL
  )
`);

console.log('Database is ready.');

process.on('SIGINT', () => {
  console.log('Shutting down database connection...');
  db.close();
  process.exit(0);
});

module.exports = db;
