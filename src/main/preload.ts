// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import type { Note, Link } from '../types/general';

type Ok<T> = { success: true } & T;
type Err = { success: false; error: string };
type IpcResponse<T> = Ok<T> | Err;

const api = {
  config: {
    get: (): Promise<IpcResponse<{ config: { nnotesFilePath: string } }>> =>
      ipcRenderer.invoke('config:get'),
    selectDirectory: (): Promise<IpcResponse<{ filePath: string }>> =>
      ipcRenderer.invoke('config:selectDirectory'),
    updatePath: (dir: string): Promise<IpcResponse<{}>> =>
      ipcRenderer.invoke('config:updatePath', dir),
  },
  notes: {
    list: (): Promise<IpcResponse<{ notes: Note[] }>> =>
      ipcRenderer.invoke('notes:list'),
    add: (note: Note): Promise<IpcResponse<{ activeNote: Note }>> =>
      ipcRenderer.invoke('notes:add', note),
    update: (note: Note): Promise<IpcResponse<{ changes: number }>> =>
      ipcRenderer.invoke('notes:update', note),
    delete: (id: number): Promise<IpcResponse<{}>> =>
      ipcRenderer.invoke('notes:delete', id),
  },
  links: {
    list: (): Promise<IpcResponse<{ allLinks: Link[] }>> =>
      ipcRenderer.invoke('links:list'),
    add: (link: Link): Promise<IpcResponse<{}>> =>
      ipcRenderer.invoke('links:add', link),
    delete: (id: number): Promise<IpcResponse<{}>> =>
      ipcRenderer.invoke('links:delete', id),
  },
  events: {
    onOpenSettings: (handler: () => void) => {
      const listener = () => handler();
      ipcRenderer.on('open-settings', listener);
      return () => ipcRenderer.removeListener('open-settings', listener);
    },
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ApiType = typeof api;
