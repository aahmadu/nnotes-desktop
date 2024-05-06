import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';

import './App.css';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { Note, Link } from '../types/general';

import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import LinkMenu from './components/LinkMenu';
import GraphView from './components/GraphView';

import { debounce } from '../utils/general';

function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allLinks, setallLinks] = useState<Link[]>([]);
  const [allLinkTags, setallLinkTags] = useState<string[]>([]);
  const [showLinkMenu, setShowLinkMenu] = useState(false);

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

  fetchNotes();

  const fetchLinks = async () => {
    try {
      const noteResponse =
        await window.electron.ipcRenderer.invokeMessage('get-all-links');
      if (noteResponse && noteResponse.success) {
        setallLinks(noteResponse.allLinks);
        setallLinkTags(
          Array.from(
            new Set(noteResponse.allLinks.map((link) => link.linkTag)),
          ),
        );
      } else {
        console.error('Failed to get tags:', noteResponse.error);
      }
    } catch (error) {
      console.error('Error when getting tags:', (error as Error).message);
    }
  };

  fetchLinks();

  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const handleNoteSelect = (note: Note) => {
    setActiveNote(note);
  };

  const handleNewNote = () => {
    setActiveNote(null);
  };

  const handleDeleteNote = (noteID: number) => {
    window.electron.ipcRenderer.sendMessage('delete-note', { noteID });
  };

  const handleClickLinkMenu = () => {
    console.log(allLinks[0]);
    setShowLinkMenu(true);
  };

  const handleCancelLinkMenu = () => {
    console.log('Cancel link menu');
    setShowLinkMenu(false);
  };

  const handleCreateLink = async (linkOption: string, note: Note, linkTag: string) => {
    let sourceID: number;
    let targetID: number;
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
      sourceID = activeNote!.id;
      targetID = noteID;
    } else {
      sourceID = noteID;
      targetID = activeNote!.id;
    }
    try {
      console.log('Create link:', sourceID, targetID, linkTag);
      window.electron.ipcRenderer.sendMessage('add-link', {
        sourceID,
        targetID,
        linkTag,
      });
    } catch (error) {
      console.error('Error when adding link:', (error as Error).message);
    }
    setShowLinkMenu(false);
  };

  const handleAddNote = async (note: Note) => {
    try {
      const response = await window.electron.ipcRenderer.invokeMessage(
        'add-note',
        { updatedNote: note },
      );
      if (response && response.success) {
        return(response.activeNote);
      }
      console.error('Failed to add note:', response.error);
    } catch (error) {
      console.error('Error when adding note:', (error as Error).message);
    }
  };

  // Function to update database with content
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateDatabase = useCallback(
    debounce(async (updatedNote: Note) => {
      if (updatedNote.id === undefined) {
        try {
          const response = await window.electron.ipcRenderer.invokeMessage(
            'add-note',
            { updatedNote },
          );
          if (response && response.success) {
            setActiveNote(response.activeNote); // Update the noteID state with the new ID from the database
          } else {
            console.error('Failed to add note:', response.error);
          }
        } catch (error) {
          console.error('Error when adding note:', (error as Error).message);
        }
      } else {
        try {
          window.electron.ipcRenderer.sendMessage('update-note', {
            updatedNote,
          });
        } catch (error) {
          console.error('Error when updating note:', (error as Error).message);
        }
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
      <PanelGroup className="container" direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <Sidebar
            notes={notes}
            onNoteSelect={handleNoteSelect}
            onNewNote={handleNewNote}
            onDelete={handleDeleteNote}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel minSize={30}>
          <Editor
            activeNote={activeNote as Note}
            updateDatabase={updateDatabase}
            onLinkMenu={handleClickLinkMenu}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={30} minSize={20}>
          <GraphView allNotes={notes} allLinks={allLinks} />
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
