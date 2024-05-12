/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, IpcMainEvent } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import db from '../data/data';
import { Note, Link } from '../types/general';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

const insertNote = (note: Note) => {
  const sql = 'INSERT INTO nodes (title, content) VALUES (?, ?)';
  return new Promise((resolve, reject) => {
    db.run(sql, [note.title, note.content], function (this: any, err: Error) {
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve(this.lastID); // 'this' refers to the statement context
      }
    });
  });
};

const fetchNotes = (noteID?: number): Promise<any[]> => {
  let sql = 'SELECT * FROM nodes';
  const params: number[] = [];

  // If a noteID is provided, modify the query to fetch only that specific note
  if (noteID) {
    sql += ' WHERE id = ?';
    params.push(noteID);
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error, rows: Note[]) => {
      if (err) {
        reject(new Error(err.message));
      } else {
        // If noteID is provided, there should ideally be only one note or none
        const result = noteID ? rows[0] : rows;
        resolve(result as any[]); // Cast result to any[]
      }
    });
  });
};

const updateNote = (updatedNote: Note) => {
  const sql = 'UPDATE nodes SET title = ?, content = ? WHERE id = ?';
  return new Promise((resolve, reject) => {
    db.run(
      sql,
      [updatedNote.title, updatedNote.content, updatedNote.id],
      function (this: any, err: Error) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes); // 'this' refers to the statement context
        }
      },
    );
  });
};

const deleteNote = async (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM links WHERE source = ? OR target = ?',
      [id, id],
      (linkErr: Error) => {
        if (linkErr) {
          reject(new Error(linkErr.message));
        } else {
          db.run('DELETE FROM nodes WHERE id = ?', [id], (err: Error) => {
            if (err) {
              reject(new Error(err.message));
            } else {
              resolve();
            }
          });
        }
      },
    );
  });
};

const addLink = async (link: Link): Promise<void> => {
  const { source, target, linkTag } = link;
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO links (source, target, linkTag) VALUES (?, ?, ?)',
      [source, target, linkTag],
      (err: Error) => {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve();
        }
      },
    );
  });
};

const getAllLinks = async (): Promise<{
  success: boolean;
  allLinks?: any[];
  error?: string;
}> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM links', (err: Error, rows: Link[]) => {
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve({ success: true, allLinks: rows });
      }
    });
  });
};

const deleteLink = async (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM links WHERE id = ?', id, (err: Error) => {
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve();
      }
    });
  });
};

ipcMain.handle('add-note', async (_event, { newNote }) => {
  try {
    const id = await insertNote(newNote);
    const activeNote = await fetchNotes(id as number);
    return { success: true, activeNote };
  } catch (error: any) {
    throw new Error(error.message);
  }
});

ipcMain.on('update-note', async (event, { updatedNote }) => {
  try {
    const changes = await updateNote(updatedNote);
    console.log('Updated note:', updatedNote);
    event.reply('update-note-response', { success: true, changes });
  } catch (error: any) {
    console.error('Update failed:', error);
    event.reply('update-note-response', {
      success: false,
      error: error.message,
    });
  }
});

// Handle IPC event for reading all notes
ipcMain.handle(
  'get-all-notes',
  async (): Promise<{
    success: boolean;
    notes?: any[];
    error: Error | undefined;
  }> => {
    try {
      const notes = await fetchNotes();
      return { success: true, notes, error: undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
);

// IPC event for deleting a note
ipcMain.on(
  'delete-note',
  async (event: IpcMainEvent, { noteID }: { noteID: number }) => {
    try {
      await deleteNote(noteID);
      event.reply('delete-note-response', { success: true });
    } catch (error: any) {
      event.reply('delete-note-response', {
        success: false,
        error: error.message,
      });
      console.error('Error deleting note:', error);
    }
  },
);

// IPC event for adding a link
ipcMain.on('add-link', async (event: IpcMainEvent, link: Link) => {
  try {
    await addLink(link);
    event.reply('add-link-response', { success: true });
  } catch (error: any) {
    event.reply('add-link-response', {
      success: false,
      error: error.message,
    });
    console.error('Error adding link:', error);
  }
});

// IPC event for getting all links
ipcMain.handle('get-all-links', async () => {
  try {
    const result = await getAllLinks();
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// IPC event for deleting a link
ipcMain.on('delete-link', async (event: IpcMainEvent, id: number) => {
  try {
    await deleteLink(id);
    event.reply('delete-link-response', { success: true });
  } catch (error: any) {
    event.reply('delete-link-response', {
      success: false,
      error: error.message,
    });
    console.error('Error deleting link:', error);
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
