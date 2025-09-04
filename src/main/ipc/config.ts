import { dialog, ipcMain, BrowserWindow } from 'electron';
import { ensureConfig } from '../configStore';
import db from '../db/AtlasDatabase';

export function registerConfigIpc(mainWindow: BrowserWindow | null) {
  ipcMain.handle('config:get', async () => {
    const cfg = ensureConfig();
    return { success: true, config: cfg };
  });

  ipcMain.handle('config:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
      properties: ['openDirectory'],
    });
    if (result.canceled) {
      return { success: false, error: 'Selection cancelled' };
    }
    return { success: true, filePath: result.filePaths[0] };
  });

  ipcMain.handle('config:updatePath', async (_event, nnoteDir: string) => {
    try {
      db.getInstance().updateConfigPath(nnoteDir);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });
}

