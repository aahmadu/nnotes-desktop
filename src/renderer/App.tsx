import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';

import { FloatButton } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

import './App.css';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { Note, Link } from '../types/general';

import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import LinkMenu from './components/LinkMenu';
import GraphView from './components/GraphView';
import LinkNav from './components/LinkNav';
import SettingsMenu from './components/SettingsMenu';

import { debounce } from '../utils/general';

function Home() {
  const [activeNote, setActiveNote] = useState<Note>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [allLinks, setallLinks] = useState<Link[]>([]);
  const [allLinkTags, setallLinkTags] = useState<string[]>([]);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const fetchNotes = async () => {
    try {
      const noteResponse =
        await window.electron.ipcRenderer.invokeMessage('get-all-notes');
      if (noteResponse && noteResponse.success) {
        setNotes(noteResponse.notes);
      } else {
        console.error('Failed to get notes:', noteResponse.error);
      }
    } catch (error) {
      console.error('Error when getting notes:', (error as Error).message);
    }
  };

  const fetchLinks = async () => {
    try {
      const noteResponse =
        await window.electron.ipcRenderer.invokeMessage('get-all-links');
      if (noteResponse && noteResponse.success) {
        setallLinks(noteResponse.allLinks);
        setallLinkTags(
          Array.from(
            new Set(noteResponse.allLinks.map((link: Link) => link.linkTag)),
          ),
        );
      } else {
        console.error('Failed to get tags:', noteResponse.error);
      }
    } catch (error) {
      console.error('Error when getting tags:', (error as Error).message);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchLinks();
  }, []);

  const handleSelectDirectory = () => {
    window.electron.ipcRenderer.sendMessage('select-directory');
  };

  const handleNoteSelect = (note: Note) => {
    setActiveNote(note);
  };

  const handleNewNote = () => {
    setActiveNote(undefined);
  };

  const handleDeleteNote = (noteID: number) => {
    setActiveNote(undefined);
    window.electron.ipcRenderer.sendMessage('delete-note', { noteID });
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteID));
  };

  const handleClickLinkMenu = () => {
    setShowLinkMenu(true);
  };

  const handleCancelLinkMenu = () => {
    setShowLinkMenu(false);
  };

  const handleAddNote = async (note: Note) => {
    try {
      const response = await window.electron.ipcRenderer.invokeMessage(
        'add-note',
        { newNote: note },
      );
      if (response && response.success) {
        return response.activeNote;
      }
      console.error('Failed to add note:', response.error);
    } catch (error) {
      console.error('Error when adding note:', (error as Error).message);
    }
    return null;
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
      console.log('Create link:', source, target, linkTag);
      window.electron.ipcRenderer.sendMessage('add-link', {
        source,
        target,
        linkTag,
      });
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
        try {
          const response = await window.electron.ipcRenderer.invokeMessage(
            'add-note',
            { newNote: updatedNote },
          );
          if (response && response.success) {
            setActiveNote(response.activeNote); // Update the noteID state with the new ID from the database
          } else {
            console.error('Failed to add note:', response.error);
          }
        } catch (error) {
          console.error('Error when adding note:', (error as Error).message);
        }
        fetchNotes();
      } else {
        try {
          window.electron.ipcRenderer.sendMessage('update-note', {
            updatedNote,
          });
        } catch (error) {
          console.error('Error when updating note:', (error as Error).message);
        }
        fetchNotes();
      }
    }, 2000),
    [],
  ); // Debounce for 2 seconds

  return (
    <>
      {showLinkMenu && (
        <LinkMenu
          allNotes={notes}
          allLinkTags={allLinkTags}
          onCancelMenu={handleCancelLinkMenu}
          onCreateLink={handleCreateLink}
        />
      )}
      {showSettingsMenu && (
        <SettingsMenu
          onCancelMenu={handleCancelLinkMenu}
          handleSelectDirectory={handleSelectDirectory}
        />
      )}
      <FloatButton
        icon={<SettingOutlined />}
        onClick={() => setShowSettingsMenu(true)}
      />
      <PanelGroup className="container" direction="horizontal">
        <Panel defaultSize={20} minSize={20} maxSize={30}>
          <Sidebar
            activeNote={activeNote as Note}
            notes={notes}
            onNoteSelect={handleNoteSelect}
            onNewNote={handleNewNote}
            onDelete={handleDeleteNote}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={40} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={80} minSize={30}>
              <Editor
                activeNote={activeNote}
                updateDatabase={updateDatabase}
                onLinkMenu={handleClickLinkMenu}
              />
            </Panel>
            <PanelResizeHandle />
            <Panel defaultSize={20} minSize={20} style={{ overflowY: 'auto' }}>
              <LinkNav
                activeNote={activeNote as Note}
                notes={notes}
                links={allLinks}
                onNoteSelect={handleNoteSelect}
                onDelete={handleDeleteNote}
              />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={40} minSize={30}>
          <GraphView
            activeNote={activeNote as Note}
            allNotes={notes}
            allLinks={allLinks}
            onNoteSelect={handleNoteSelect}
          />
        </Panel>
      </PanelGroup>
    </>
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
