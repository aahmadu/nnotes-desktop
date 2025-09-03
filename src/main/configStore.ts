import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export type AppConfig = {
  nnotesFilePath: string;
};

const DEFAULT_CONFIG: AppConfig = {
  nnotesFilePath: '',
};

function getConfigDir() {
  return app.getPath('userData');
}

function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

export function ensureConfig(): AppConfig {
  const cfgPath = getConfigPath();
  try {
    if (!fs.existsSync(cfgPath)) {
      fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
      fs.writeFileSync(cfgPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
      return DEFAULT_CONFIG;
    }
    const parsed: AppConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    // Fallback to default if file is unreadable
    return DEFAULT_CONFIG;
  }
}

export function writeConfig(next: Partial<AppConfig>): AppConfig {
  const current = ensureConfig();
  const merged: AppConfig = { ...current, ...next };
  fs.writeFileSync(getConfigPath(), JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function getConfigPathForDebug(): string {
  return getConfigPath();
}

