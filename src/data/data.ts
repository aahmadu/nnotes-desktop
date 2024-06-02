import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

import { Note, Link } from '../types/general';

class AtlasDatabase {
  private static instance: AtlasDatabase;

  private dbPath: string;

  private db: sqlite3.Database;

  private configPath: string;

  private config: { nnotesFilePath: string } | null;

  public isInitialized: boolean = false;

  private constructor() {
    this.configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(this.configPath)) {
      const defaultConfig = { nnotesFilePath: '' };
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(defaultConfig, null, 2),
        'utf-8',
      );
    }
    this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));

    if (fs.existsSync(this.config!.nnotesFilePath)) {
      console.log('nnotesFilePath:', this.config!.nnotesFilePath);
      this.initialize();
      this.isInitialized = true;
    }
  }

  public initialize(): AtlasDatabase {
    console.log('nnotesFilePath2:', AtlasDatabase.instance);
    // eslint-disable-next-line prefer-destructuring
    const nnotesFilePath = this.config!.nnotesFilePath;
    this.dbPath = path.join(nnotesFilePath, 'notesdbbook.sqlite'); // renamed as atlas
    this.db = new sqlite3.Database(this.dbPath);

    this.initializeTables();
  }

  public static getInstance(): AtlasDatabase {
    if (!AtlasDatabase.instance) {
      AtlasDatabase.instance = new AtlasDatabase();
    }
    return AtlasDatabase.instance;
  }

  private initializeTables() {
    const isDbExist = fs.existsSync(this.dbPath);

    if (!isDbExist) {
      this.db.serialize(() => {
        this.db.run(
          `CREATE TABLE nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          (err) => {
            if (err) console.error('Error creating nodes table', err);
            else console.log('Nodes table created successfully');
          }
        );

        this.db.run(
          `CREATE TABLE links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source INTEGER,
            target INTEGER,
            linkTag TEXT,
            FOREIGN KEY (source) REFERENCES nodes(id),
            FOREIGN KEY (target) REFERENCES nodes(id)
          )`,
          (err) => {
            if (err) console.error('Error creating links table', err);
            else console.log('Links table created successfully');
          }
        );
      });
    }
  }

  public getPath(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.config) {
        resolve(this.config.nnotesFilePath);
      } else {
        reject(new Error('Config not found'));
      }
    });
  }

  public updateConfigPath(newPath: string): void {
    const nnotesFilePath = newPath;
    this.dbPath = path.join(nnotesFilePath, 'notesdbbook.sqlite');

    if (this.config) {
      this.config.nnotesFilePath = newPath;
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }

    this.db = new sqlite3.Database(this.dbPath);
    this.initializeTables();
  }

  public fetchNotes(noteID?: number): Promise<Note | Note[]> {
    let sql = 'SELECT * FROM nodes';
    const params: (number | string)[] = [];

    if (noteID) {
      sql += ' WHERE id = ?';
      params.push(noteID);
    }

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(noteID ? rows[0] : rows);
      });
    });
  }

  public insertNote(note: Note): Promise<number> {
    const sql = 'INSERT INTO nodes (title, content) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [note.title, note.content], function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  public updateNote(updatedNote: Note): Promise<number> {
    const sql = 'UPDATE nodes SET title = ?, content = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        [updatedNote.title, updatedNote.content, updatedNote.id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  public deleteNote(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM links WHERE source = ? OR target = ?',
        [id, id],
        (linkErr) => {
          if (linkErr) reject(linkErr);
          else {
            this.db.run('DELETE FROM nodes WHERE id = ?', [id], (err) => {
              if (err) reject(err);
              else resolve();
            });
          }
        }
      );
    });
  }

  public addLink(link: Link): Promise<void> {
    const { source, target, linkTag } = link;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO links (source, target, linkTag) VALUES (?, ?, ?)',
        [source, target, linkTag],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  public getAllLinks(): Promise<Link[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM links', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  public deleteLink(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM links WHERE id = ?', id, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export default AtlasDatabase;
