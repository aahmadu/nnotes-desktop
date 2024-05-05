import React, { useState }  from 'react';

import './Sidebar.css';

interface Note {
    id: number;
    title: string;
}

interface SidebarProps {
    notes: Note[];
    onNoteSelect: (note: Note) => void;
    onNewNote: () => void; // Add this prop for the new note creation function
    onDelete: (noteID: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ notes, onNoteSelect, onNewNote, onDelete }) => {
    const [hoveredNote, setHoveredNote] = useState<number | null>(null);

    return (
        <div className="sidebar">
            <div className="search-bar">
                <input type="text" placeholder="Search notes..." />
                <button className="new-note-button" onClick={onNewNote}>+</button> {/* Add this button for creating a new note */}
            </div>
            <ul>
                {notes.map(note => (
                    <li key={note.id} 
                    onMouseEnter={() => setHoveredNote(note.id)} 
                    onMouseLeave={() => setHoveredNote(null)}
                    onClick={() => onNoteSelect(note)}>
                        <span>{note.title}</span>
                        {hoveredNote === note.id && (
                            <button onClick={() => onDelete(note.id)} className="delete-btn">X</button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
