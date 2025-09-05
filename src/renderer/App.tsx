import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useRef, useState, useCallback, useEffect } from 'react';

import { ConfigProvider, theme as antdTheme } from 'antd';

import './App.css';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { Note, Link } from '../types/general';

import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import LinkMenu from './components/LinkMenu';
import GraphView from './components/GraphView';
import LinkInspector from './components/LinkInspector';
import SettingsMenu from './components/SettingsMenu';
import TopBar from './components/TopBar';

import { debounce } from '../utils/general';

function Home() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : false;
    } catch {
      return false;
    }
  });
  const [activeNote, setActiveNote] = useState<Note>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [allLinks, setallLinks] = useState<Link[]>([]);
  const [allLinkTags, setallLinkTags] = useState<string[]>([]);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  const fetchNotes = async () => {
    const res = await window.api.notes.list();
    if (res.success) setNotes(res.notes);
    else console.error('Failed to get notes:', res.error);
  };

  const fetchLinks = async () => {
    const res = await window.api.links.list();
    if (res.success) {
      setallLinks(res.allLinks);
      setallLinkTags(Array.from(new Set(res.allLinks.map((l: Link) => l.linkTag))));
    } else {
      console.error('Failed to get tags:', res.error);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  useEffect(() => {
    const init = async () => {
      const cfg = await window.api.config.get();
      const hasPath = cfg.success && !!cfg.config.nnotesFilePath;
      if (hasPath) {
        setDbConnected(true);
        fetchNotes();
        fetchLinks();
      } else {
        setDbConnected(false);
        setShowSettingsMenu(true);
      }
    };
    init();

    const unsubscribe = window.api.events.onOpenSettings(() => setShowSettingsMenu(true));
    return () => { unsubscribe(); };
  }, []);

  const handleNoteSelect = (note: Note) => {
    setActiveNote(note);
  };

  const handleNewNote = () => {
    setActiveNote(undefined);
  };

  const handleDeleteNote = (noteID: number) => {
    setActiveNote(undefined);
    window.api.notes.delete(noteID).then((res) => {
      if (!res.success) console.error('Delete failed:', res.error);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteID));
    });
  };

  const handleClickLinkMenu = () => {
    setShowLinkMenu(true);
  };

  const handleAddNote = async (note: Note) => {
    const response = await window.api.notes.add(note);
    if (response.success) return response.activeNote;
    console.error('Failed to add note:', response.error);
    return note;
  };

  const handleCreateLink = async (
    linkOption: string,
    note: Note,
    linkTag: string,
  ) => {
    let source: number;
    let target: number;
    let noteID = note.id;
    if (note.id === undefined) {
      try {
        const result = await handleAddNote(note);
        noteID = result.id;
      } catch (error) {
        console.error('Error when adding note:', error);
      }
    }

    if (linkOption === 'To') {
      source = activeNote!.id;
      target = noteID;
    } else {
      source = noteID;
      target = activeNote!.id;
    }
    try {
      await window.api.links.add({ source, target, linkTag });
    } catch (error) {
      console.error('Error when adding link:', (error as Error).message);
    }
    fetchNotes();
    fetchLinks();
    setShowLinkMenu(false);
  };

  // Function to update database with content
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateDatabase = useCallback(
    debounce(async (updatedNote: Note) => {
      if (updatedNote.id === undefined) {
        const response = await window.api.notes.add(updatedNote);
        if (response.success) {
          setActiveNote(response.activeNote);
        } else {
          console.error('Failed to add note:', response.error);
        }
      } else {
        const res = await window.api.notes.update(updatedNote);
        if (!res.success) console.error('Failed to update note:', res.error);
      }
      fetchNotes();
    }, 2000),
    [],
  ); // Debounce for 2 seconds

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <div className="app-shell">
        <TopBar
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onOpenSettings={() => setShowSettingsMenu(true)}
        />
        <div className="topbar-spacer" />
        {showLinkMenu && (
          <LinkMenu
            allNotes={notes}
            allLinkTags={allLinkTags}
            onCancelMenu={() => setShowLinkMenu(false)}
            onCreateLink={handleCreateLink}
          />
        )}
        {showSettingsMenu && (
          <SettingsMenu
            onCancelMenu={() => {
              setShowSettingsMenu(false);
              setDbConnected(true);
              fetchNotes();
              fetchLinks();
            }}
            dbConnected={dbConnected}
          />
        )}
        <PanelGroup className="container" direction="horizontal">
          <Panel className="panel-surface" defaultSize={20} minSize={20} maxSize={30}>
            <Sidebar
              activeNote={activeNote as Note}
              notes={notes}
              onNoteSelect={handleNoteSelect}
              onNewNote={handleNewNote}
              onDelete={handleDeleteNote}
            />
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel className="panel-surface" defaultSize={40} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel className="panel-surface" defaultSize={80} minSize={30}>
                <Editor
                  activeNote={activeNote}
                  updateDatabase={updateDatabase}
                  onLinkMenu={handleClickLinkMenu}
                  notes={notes}
                  onCreateInlineLink={async (note) => {
                    if (!activeNote) return;
                    await window.api.links.add({ source: activeNote.id as number, target: note.id as number, linkTag: 'ref' });
                    fetchLinks();
                  }}
                />
              </Panel>
              <PanelResizeHandle className="resize-handle" />
              <Panel className="panel-surface" defaultSize={20} minSize={20} style={{ overflowY: 'auto' }}>
                <LinkInspector
                  activeNote={activeNote}
                  notes={notes}
                  links={allLinks}
                  onNoteSelect={handleNoteSelect}
                  onLinksChanged={() => { fetchLinks(); fetchNotes(); }}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel className="panel-surface" defaultSize={40} minSize={30}>
            <GraphView
              activeNote={activeNote as Note}
              allNotes={notes}
              allLinks={allLinks}
              onNoteSelect={handleNoteSelect}
            />
          </Panel>
        </PanelGroup>
      </div>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
