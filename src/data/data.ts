import fs from 'fs';
import path from 'path';
import os from 'os';

const sqlite3 = require('sqlite3').verbose();

// Define path for SQLite database
let googleDrivePath;
if (os.platform() === 'darwin') {
  googleDrivePath = '/Users/ahmedahmadu/Google Drive/NNotes/';
} else {
  googleDrivePath = 'G:\\My Drive\\NNotes';
}
const dbName = 'notesdbfull.sqlite';
const dbPath = path.join(googleDrivePath, dbName);

// Check if the database file exists
const isDbExist = fs.existsSync(dbPath);

// Create a new database instance
const db = new sqlite3.Database(dbPath, (err: Error) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database opened successfully');
    // If the database file doesn't exist or tables are not created, initialize tables
    if (!isDbExist) {
      console.log('Initializing database tables...');
      // Create nodes table
      db.run(
        `CREATE TABLE nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        (err2: Error) => {
          if (err2) {
            console.error('Error creating nodes table', err2);
          } else {
            console.log('Nodes table created successfully');
          }
        },
      );

      // Create semantic_relationships table
      db.run(
        `CREATE TABLE links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceID INTEGER,
        targetID INTEGER,
        linkTag TEXT,
        FOREIGN KEY (sourceID) REFERENCES nodes(id),
        FOREIGN KEY (targetID) REFERENCES nodes(id))`,
        (err3: Error) => {
          if (err) {
            console.error('Error creating semantic_relationships table', err3);
          } else {
            console.log('Relationships table created successfully');
          }
        },
      );
    }
  }
});

export default db;
