import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { ensureConfig, writeConfig } from '../configStore';
import type { Note, Link } from '../../types/general';

export default class AtlasDatabase {
  private static instance: AtlasDatabase;

  private dbPath: string | null = null;

  private db: sqlite3.Database | null = null;

  public isInitialized = false;

  private constructor() {
    const cfg = ensureConfig();
    if (cfg.nnotesFilePath && fs.existsSync(cfg.nnotesFilePath)) {
      this.initialize(cfg.nnotesFilePath);
    }
  }

  public static getInstance(): AtlasDatabase {
    if (!AtlasDatabase.instance) {
      AtlasDatabase.instance = new AtlasDatabase();
    }
    return AtlasDatabase.instance;
  }

  public initialize(baseDir: string) {
    this.dbPath = path.join(baseDir, 'notesdbbook.sqlite');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeTables();
    this.isInitialized = true;
  }

  public updateConfigPath(newPath: string) {
    writeConfig({ nnotesFilePath: newPath });
    this.initialize(newPath);
  }

  private initializeTables() {
    if (!this.db || !this.dbPath) return;
    const exists = fs.existsSync(this.dbPath);
    if (exists) return;

    this.db.serialize(() => {
      this.db!.run(
        `CREATE TABLE nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
      );

      this.db!.run(
        `CREATE TABLE links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source INTEGER,
            target INTEGER,
            linkTag TEXT,
            FOREIGN KEY (source) REFERENCES nodes(id),
            FOREIGN KEY (target) REFERENCES nodes(id)
          )`,
      );
    });
  }

  public async getPath(): Promise<string> {
    return ensureConfig().nnotesFilePath;
  }

  public async fetchNotes(noteID?: number): Promise<Note | Note[]> {
    if (!this.db) throw new Error('Database not initialized');
    let sql = 'SELECT id, title, content, created_at FROM nodes';
    const params: (number | string)[] = [];
    if (noteID) {
      sql += ' WHERE id = ?';
      params.push(noteID);
    }
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        const mapRow = (r: any): Note => ({
          id: r.id,
          title: r.title ?? '',
          content: r.content ?? '',
          date: r.created_at ?? '',
        });
        if (noteID) return resolve(rows[0] ? mapRow(rows[0]) : undefined);
        return resolve(rows.map(mapRow));
      });
    });
  }

  public async insertNote(note: Note): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const sql = 'INSERT INTO nodes (title, content) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
      this.db!.run(sql, [note.title ?? '', note.content ?? ''], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }

  public async updateNote(updatedNote: Note): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const sql = 'UPDATE nodes SET title = ?, content = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      this.db!.run(
        sql,
        [updatedNote.title ?? '', updatedNote.content ?? '', updatedNote.id],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        },
      );
    });
  }

  public async deleteNote(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      this.db!.run(
        'DELETE FROM links WHERE source = ? OR target = ?',
        [id, id],
        (linkErr) => {
          if (linkErr) return reject(linkErr);
          this.db!.run('DELETE FROM nodes WHERE id = ?', [id], (err) => {
            if (err) return reject(err);
            resolve();
          });
        },
      );
    });
  }

  public async addLink(link: Link): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const { source, target, linkTag } = link;
    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT INTO links (source, target, linkTag) VALUES (?, ?, ?)',
        [source, target, linkTag],
        (err) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });
  }

  public async getAllLinks(): Promise<Link[]> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      this.db!.all('SELECT * FROM links', (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  public async deleteLink(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      this.db!.run('DELETE FROM links WHERE id = ?', id, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

