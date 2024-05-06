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
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import db from '../data/data';

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

// Handle IPC event for adding a new note
ipcMain.handle('add-note', async (event, note) => {
  const { updatedNote } = note;
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO nodes (title, content) VALUES (?, ?)", [updatedNote.title, updatedNote.content], function(err) {
        if (err) {
            reject(new Error(err.message)); // Reject the promise with an error
        } else {
          db.get("SELECT * FROM nodes WHERE id = ?", [this.lastID], (err, row) => {
            if (err) {
                reject(new Error(err.message));
            } else {
                resolve({ success: true, activeNote: row });
            }
        });
        }
    });
  });
});

// Handle IPC event for updating a note
ipcMain.on('update-note', async (event, note) => {
  const { updatedNote } = note;
  db.run("UPDATE nodes SET title = ?, content = ? WHERE id = ?", [updatedNote.title, updatedNote.content, updatedNote.id], function(err) {
    if (err) {
        event.reply('update-note-response', { success: false, error: err.message });
    } else {
      console.log(updatedNote);
      event.reply('update-note-response', { success: true });
    }
});
});


// Handle IPC event for reading all notes
ipcMain.handle('get-all-notes', async (event) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM nodes", (err, rows) => {
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve({ success: true, notes: rows });
      }
    });
  });
});

// Handle IPC event for deleting a note
ipcMain.on('delete-note', (event, note) => {
  const { noteID } = note;
  db.run("DELETE FROM nodes WHERE id = ?", noteID, function(err) {
      if (err) {
      event.reply('delete-note-response', {
        success: false,
        error: err.message,
      });
      } else {
          event.reply('delete-note-response', { success: true });
      }
  });
});


// Handle IPC event for adding a semantic link
ipcMain.on('add-link', (event, link) => {
  const { sourceNodeId, targetNodeId, relationshipType } = link;
  console.log(link);
  db.run(
    'INSERT INTO relationships (source_node_id, target_node_id, relationship_type) VALUES (?, ?, ?)',
    [sourceNodeId, targetNodeId, relationshipType],
    function (err) {
      if (err) {
        event.reply('add-link-response', {
          success: false,
          error: err.message,
        });
      } else {
          event.reply('add-link-response', { success: true });
      }
  });
});

// Handle IPC event for getting all links
ipcMain.handle('get-all-tags', async (event) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT DISTINCT relationship_type FROM relationships',
      (err, rows) => {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve({
            success: true,
            allTags: rows.map((item) => item.relationship_type),
          });
        }
      },
    );
  });
});


// Handle IPC event for deleting a semantic link
ipcMain.on('delete-link', (event, id) => {
  db.run('DELETE FROM relationships WHERE id = ?', id, function (err) {
      if (err) {
      event.reply('delete-link-response', {
        success: false,
        error: err.message,
      });
      } else {
          event.reply('delete-link-response', { success: true });
      }
  });
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
