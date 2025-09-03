import { ipcMain } from 'electron';
import AtlasDatabase from '../db/AtlasDatabase';
import type { Link } from '../../types/general';

export function registerLinksIpc() {
  const notesDb = AtlasDatabase.getInstance();

  ipcMain.handle('links:list', async () => {
    try {
      const allLinks = await notesDb.getAllLinks();
      return { success: true, allLinks };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });

  ipcMain.handle('links:add', async (_e, link: Link) => {
    try {
      await notesDb.addLink(link);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });

  ipcMain.handle('links:delete', async (_e, id: number) => {
    try {
      await notesDb.deleteLink(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });
}

