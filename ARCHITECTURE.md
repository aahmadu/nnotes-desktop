# Architecture Overview

This document summarizes the structure and flows in NNotes Desktop.

## Processes

- Main (`src/main`): Creates the BrowserWindow, manages app lifecycle, menus, config, and database. Registers IPC handlers.
- Renderer (`src/renderer`): React UI. Talks to main via the `window.api` bridge exposed by `preload`.
- Preload (`src/main/preload.ts`): Safe bridge. Exposes a typed `window.api` surface to the renderer.

## Shared Contracts

- `src/shared/types.ts`: Core domain types (`Note`, `Link`).
- `src/shared/ipc.ts`: Canonical IPC channel names and generic response types (`IpcResponse`).
- `src/shared/api.ts`: Types for the renderer API (`window.api`).

Keeping these in `src/shared` ensures the main and renderer remain in sync.

## IPC Flow

1. Renderer calls `window.api.notes.list()`.
2. Preload invokes `ipcRenderer.invoke(Channels.Notes.List)`.
3. Main has a handler in `src/main/ipc/notes.ts` that talks to `AtlasDatabase` and returns a typed `IpcResponse`.
4. Renderer receives the result and updates UI.

## Data Layer

- `src/main/db/AtlasDatabase.ts` wraps SQLite (`sqlite3`). It initializes tables on first use and exposes CRUD for notes and links.

## UI Composition

- Layout uses `react-resizable-panels` for resizable panes.
- Main pieces:
  - `Sidebar`: note list + actions
  - `Editor`: note content editing, debounced persistence
  - `LinkRelations`: inbound/outbound links for current note
  - `GraphView`: visual graph (Sigma + Graphology)
  - `TopBar` and `SettingsMenu`: global actions, initial DB path setup

## Extending the App

- Add a new IPC endpoint:
  - Add a channel in `src/shared/ipc.ts`.
  - Register a handler under `src/main/ipc`.
  - Add a typed method to `src/shared/api.ts` and implement it in `preload.ts`.
  - Consume via `window.api.*` in the renderer.

- Add a new domain type:
  - Define it in `src/shared/types.ts`.
  - Extend `AtlasDatabase` as needed and wire through IPC.

## Dev Scripts

- `npm start`: runs the renderer dev server
- `npm run start:main`: runs the Electron main process (watch)
- `npm run start:preload`: builds the preload (watch)
- `npm run dev`: runs all three concurrently

