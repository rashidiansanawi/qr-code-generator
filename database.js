const sqlite3 = require('sqlite3').verbose();

// Create or open the database file
const db = new sqlite3.Database('./links.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(
      `CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        originalUrl TEXT NOT NULL,
        dynamicUrl TEXT NOT NULL
      )`,
      (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
      }
    );
  }
});

module.exports = db;
