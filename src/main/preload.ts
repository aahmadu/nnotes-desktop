// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

type IpcResponse<T> = { success: true } & T | { success: false; error: string };

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
    list: (): Promise<IpcResponse<{ notes: any }>> =>
      ipcRenderer.invoke('notes:list'),
    add: (note: any): Promise<IpcResponse<{ activeNote: any }>> =>
      ipcRenderer.invoke('notes:add', note),
    update: (note: any): Promise<IpcResponse<{ changes: number }>> =>
      ipcRenderer.invoke('notes:update', note),
    delete: (id: number): Promise<IpcResponse<{}>> =>
      ipcRenderer.invoke('notes:delete', id),
  },
  links: {
    list: (): Promise<IpcResponse<{ allLinks: any[] }>> =>
      ipcRenderer.invoke('links:list'),
    add: (link: any): Promise<IpcResponse<{}>> =>
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
