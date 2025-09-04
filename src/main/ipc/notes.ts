import { ipcMain } from 'electron';
import AtlasDatabase from '../db/AtlasDatabase';
import type { Note } from '../../types/general';

export function registerNotesIpc() {
  const notesDb = AtlasDatabase.getInstance();

  ipcMain.handle('notes:list', async () => {
    try {
      const notes = await notesDb.fetchNotes(undefined);
      return { success: true, notes };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });

  ipcMain.handle('notes:add', async (_e, newNote: Note) => {
    try {
      const id = await notesDb.insertNote(newNote);
      const activeNote = (await notesDb.fetchNotes(id)) as Note;
      return { success: true, activeNote };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });

  ipcMain.handle('notes:update', async (_e, updatedNote: Note) => {
    try {
      const changes = await notesDb.updateNote(updatedNote);
      return { success: true, changes };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });

  ipcMain.handle('notes:delete', async (_e, id: number) => {
    try {
      await notesDb.deleteNote(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  });
}

