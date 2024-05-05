import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';

import './App.css';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { Note } from '../types/notes';

import Sidebar from './components/Sidebar';
import Editor from './components/Editor';

import { debounce } from '../utils/general';

function Home() {
  const [notes, setNotes] = useState<Note[]>([]);

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
      console.error('Error when getting notes:', error.message);
    }
  };

  fetchNotes();

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  // const [note, setNote] = useState(null);

  const handleNoteSelect = (note: Note) => {
    console.log(note);
    setActiveNote(note);
  };

  const handleNewNote = (note: Note) => {
    setActiveNote(null);
  };

  const handleDeleteNote = (noteID: number) => {
    window.electron.ipcRenderer.sendMessage('delete-note', { noteID });
  };

  // Function to update database with content
  const updateDatabase = useCallback(debounce(async (updatedNote) => {
    console.log(updatedNote)
    if (updatedNote.id === undefined) {
        try {
            const response = await window.electron.ipcRenderer.invokeMessage('add-note', { updatedNote });
            if (response && response.success) {
                console.log(response.activeNote)
                setActiveNote(response.activeNote);  // Update the noteID state with the new ID from the database
            } else {
                console.error('Failed to add note:', response.error);
            }
        } catch (error) {
            console.error('Error when adding note:', error.message);
        }
    } else {
        console.log(updatedNote.id, updatedNote.content)
        try {
          window.electron.ipcRenderer.sendMessage('update-note', {
            updatedNote,
          });
        } catch (error) {
            console.error('Error when updating note:', error.message);
        }

    }
  }, 2000), []);// Debounce for 2 seconds

  return (
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
          activeNote={activeNote}
          setActiveNote={setActiveNote}
          updateDatabase={updateDatabase}
        />
      </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={30} minSize={20}>
        right
      </Panel>
    </PanelGroup>
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
