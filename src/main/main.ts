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
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  IpcMainEvent,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import AtlasDatabase from '../data/data';
import { Note, Link } from '../types/general';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const notesDb = AtlasDatabase.getInstance();
console.log('notesDb:', notesDb.isInitialized);

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('check-db', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('check-db', notesDb.isInitialized);
});

ipcMain.on('get-nnote-path', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  event.reply('directory-selected', result.filePaths);
});

ipcMain.on('update-nnote-path', async (event, newPath) => {
  const { nnoteDir } = newPath;
  try {
    notesDb.updateConfigPath(nnoteDir);
    return { success: true };
  } catch (error) {
    console.error('Error updating config path:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  'get-nnote-path',
  async (): Promise<{
    success: boolean;
    nnotePath?: string;
    error: Error | undefined;
  }> => {
    try {
      const nnotePath = await notesDb.getPath();
      return { success: true, nnotePath, error: undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
);

ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });

    if (result.canceled) {
      return { success: false, error: 'Directory selection was cancelled.' };
    }

    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    console.error('Error selecting directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  'get-all-notes',
  async (): Promise<{
    success: boolean;
    notes?: any[];
    error: Error | undefined;
  }> => {
    try {
      const notes = await notesDb.fetchNotes(undefined);
      return { success: true, notes, error: undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
);

ipcMain.handle('add-note', async (_event, { newNote }) => {
  try {
    const id = await notesDb.insertNote(newNote);
    const activeNote = await notesDb.fetchNotes(id as number);
    return { success: true, activeNote };
  } catch (error: any) {
    throw new Error(error.message);
  }
});

ipcMain.on('update-note', async (event, { updatedNote }) => {
  try {
    const changes = await notesDb.updateNote(updatedNote);
    event.reply('update-note-response', { success: true, changes });
  } catch (error: any) {
    console.error('Update failed:', error);
    event.reply('update-note-response', {
      success: false,
      error: error.message,
    });
  }
});

ipcMain.on(
  'delete-note',
  async (event: IpcMainEvent, { noteID }: { noteID: number }) => {
    try {
      await notesDb.deleteNote(noteID);
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

ipcMain.on('add-link', async (event: IpcMainEvent, link: Link) => {
  try {
    await notesDb.addLink(link);
    event.reply('add-link-response', { success: true });
  } catch (error: any) {
    event.reply('add-link-response', {
      success: false,
      error: error.message,
    });
    console.error('Error adding link:', error);
  }
});

ipcMain.handle('get-all-links', async () => {
  try {
    const result = await notesDb.getAllLinks();
    return { success: true, allLinks:result, error: undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('delete-link', async (event: IpcMainEvent, id: number) => {
  try {
    await notesDb.deleteLink(id);
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

  const menuBuilder = new MenuBuilder(mainWindow, );
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
    if (!notesDb.isInitialized) {
      console.log('Sending message:', notesDb.isInitialized, mainWindow);
      mainWindow.webContents.send('show-settings');
    }
  })
  .catch(console.log);
