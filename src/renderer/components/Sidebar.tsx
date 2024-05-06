import { useState, FunctionComponent } from 'react';

import './Sidebar.css';

import { Note } from '../../types/general';

interface SidebarProps {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
  onNewNote: () => void;
  onDelete: (noteID: number) => void;
}

const Sidebar: FunctionComponent<SidebarProps> = function Sidebar({
  notes,
  onNoteSelect,
  onNewNote,
  onDelete,
}) {
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);

  return (
    <div className="sidebar">
      <div className="search-bar">
        <input type="text" placeholder="Search notes..." />
        <button type="button" className="new-note-button" onClick={onNewNote}>
          +
        </button>
      </div>
      <ul>
        {notes.map((note) => (
          <li
            key={note.id}
            onMouseEnter={() => setHoveredNote(note.id)}
            onMouseLeave={() => setHoveredNote(null)}
            onClick={() => onNoteSelect(note)}
          >
            <span>{note.title}</span>
            {hoveredNote === note.id && (
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="delete-btn"
              >
                X
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
