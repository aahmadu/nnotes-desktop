import React, { useState, useEffect } from 'react';
import './Editor.css';
import { Note } from '../../types/notes';

type EditorProps = {
  activeNote: Note;
  updateDatabase: (note: Note) => void;
};

const Editor: React.FC<EditorProps> = ({activeNote, updateDatabase}) => {
  const [title, setTitle] = useState(activeNote ? activeNote.title : '');
  const [content, setContent] = useState(activeNote ? activeNote.content : '');

  useEffect(() => {
    setTitle(activeNote ? activeNote.title ?? '' : '');
    setContent(activeNote ? activeNote.content ?? '' : '');
  }, [activeNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    const updatedNote = activeNote
        ? { ...activeNote, title: e.target.value, content: content }
        : { title: e.target.value, content: content } as Note;
    updateDatabase(updatedNote);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const updatedNote = activeNote
      ? { ...activeNote, title: title, content: e.target.value }
      : ({ title: title, content: e.target.value } as Note);
    updateDatabase(updatedNote);
  };

  return (
    <div className="editor">
      <div className="title-area">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={handleTitleChange}
          className="title-input"
        />
      </div>
      <div className="body-area">
        <textarea
          placeholder="Start typing..."
          value={content}
          onChange={handleContentChange}
          className="content-input"
        />
      </div>
    </div>
  );
};

export default Editor;
