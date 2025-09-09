import React, { useState, useEffect, FunctionComponent, useRef } from 'react';
import './Editor.css';
import { FloatButton } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { Note } from '../../types/general';

type EditorProps = {
  activeNote: Note | undefined;
  updateDatabase: (note: Note) => void;
  onLinkMenu: () => void;
  notes: Note[];
  onCreateInlineLink: (note: Note) => void;
};

const Editor: FunctionComponent<EditorProps> = function Editor({
  activeNote,
  updateDatabase,
  onLinkMenu,
  notes,
  onCreateInlineLink,
}) {
  const [title, setTitle] = useState(activeNote ? activeNote.title : '');
  const [content, setContent] = useState(activeNote ? activeNote.content : '');
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setTitle(activeNote ? activeNote.title ?? '' : '');
    setContent(activeNote ? activeNote.content ?? '' : '');
    setMentionActive(false);
    setMentionQuery('');
    setMentionStart(null);
  }, [activeNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    const updatedNote = activeNote
      ? { ...activeNote, title: e.target.value, content }
      : ({ title: e.target.value, content } as Note);
    updateDatabase(updatedNote);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const updatedNote = activeNote
      ? { ...activeNote, title, content: e.target.value }
      : ({ title, content: e.target.value } as Note);
    updateDatabase(updatedNote);
  };

  const filteredNotes = notes
    .filter((n) => (n.title || '').toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 8);

  const insertMention = (note: Note) => {
    if (!textareaRef.current || mentionStart === null) return;
    const ta = textareaRef.current;
    const end = ta.selectionStart ?? content.length;
    const before = content.slice(0, mentionStart);
    const after = content.slice(end);
    const insertion = `@${note.title || `Untitled #${note.id}`}`;
    const newContent = `${before}${insertion}${after}`;
    setContent(newContent);
    const updatedNote = activeNote
      ? { ...activeNote, title, content: newContent }
      : ({ title, content: newContent } as Note);
    updateDatabase(updatedNote);
    onCreateInlineLink(note);
    setMentionActive(false);
    setMentionQuery('');
    setMentionStart(null);
    // move caret to end of inserted text
    requestAnimationFrame(() => {
      const pos = (before + insertion).length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      const target = e.currentTarget;
      setMentionActive(true);
      setMentionQuery('');
      setMentionStart(target.selectionStart ?? 0);
      return;
    }
    if (mentionActive) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Tab') {
        setMentionActive(false);
        setMentionQuery('');
        setMentionStart(null);
        return;
      }
      if (e.key === 'Backspace') {
        setMentionQuery((q) => q.slice(0, -1));
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setMentionQuery((q) => q + e.key);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredNotes.length > 0) insertMention(filteredNotes[0]);
        return;
      }
    }
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
          onKeyDown={onKeyDown}
          ref={textareaRef}
          className="content-input"
        />
        {mentionActive && (
          <div
            style={{
              position: 'absolute',
              bottom: 70,
              left: 20,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              padding: 8,
              maxWidth: 320,
              zIndex: 5,
            }}
          >
            {filteredNotes.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No matches…</div>
            ) : (
              filteredNotes.map((n) => (
                <div
                  key={n.id}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => insertMention(n)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                  }}
                >
                  {n.title || `Untitled #${n.id}`}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {activeNote ? (
        <FloatButton
          className="float-button"
          icon={<LinkOutlined />}
          onClick={onLinkMenu}
        />
      ) : null}
    </div>
  );
};

export default Editor;
