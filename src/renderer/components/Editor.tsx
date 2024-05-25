import React, { useState, useEffect, FunctionComponent } from 'react';
import './Editor.css';
import { Note } from '../../types/general';
import { Menu, Input, FloatButton, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

type EditorProps = {
  activeNote: Note | undefined;
  updateDatabase: (note: Note) => void;
  onLinkMenu: () => void;
};

const Editor: FunctionComponent<EditorProps> = function Editor({
  activeNote,
  updateDatabase,
  onLinkMenu,
}) {
  const [title, setTitle] = useState(activeNote ? activeNote.title : '');
  const [content, setContent] = useState(activeNote ? activeNote.content : '');

  useEffect(() => {
    setTitle(activeNote ? activeNote.title ?? '' : '');
    setContent(activeNote ? activeNote.content ?? '' : '');
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

  const [selectedWord, setSelectedWord] = useState('');

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const word = window.getSelection()?.toString();
    if (word) {
      setSelectedWord(word);
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'log') {
      console.log(selectedWord);
    }
  };

  const menu: MenuProps['items'] = [
    {
      key: "link",
      label: 'Link',
    }
  ];
  // <Menu onClick={handleMenuClick}>
  //   <Menu.Item key="log">Link</Menu.Item>
  // </Menu>

  return (
    <div className="editor" onContextMenu={handleRightClick}>

      <div className="title-area">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={handleTitleChange}
          className="title-input"
        />
      </div>
      <Dropdown menu={{ items: menu }} trigger={['contextMenu']}>
        <div className="body-area">
          <textarea
            placeholder="Start typing..."
            value={content}
            onChange={handleContentChange}
            className="content-input"
          />
        </div>
      </Dropdown>
      {activeNote ? (
        <FloatButton className="float-button" icon={<LinkOutlined />} onClick={onLinkMenu} />
      ) : null}
    </div>
  );
};

export default Editor;
