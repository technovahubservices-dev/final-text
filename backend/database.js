const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./technova.db');

// Initialize the database table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS extractions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        keywords TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Function to save results
const saveExtraction = (filename, keywords) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO extractions (filename, keywords) VALUES (?, ?)`;
        db.run(query, [filename, keywords], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

module.exports = { saveExtraction };