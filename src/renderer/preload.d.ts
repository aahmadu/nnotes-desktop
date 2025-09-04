import type { ApiType } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    api: ApiType;
  }
}

export {};
