import { FunctionComponent } from 'react';

import './Sidebar.css';
import { Menu, Input, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { MenuProps } from 'antd';
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
  const items: MenuProps['items'] = [
    {
      key: 'search',
      label: (
        <Input
          placeholder="Search notes..."
          style={{ width: '100%', marginBottom: '10px' }}
        />
      ),
    },
    {
      type: 'divider',
    },
    ...notes.map((note) => ({
      key: note.id.toString(),
      label: note.title,
      onClick: () => onNoteSelect(note),
    })),
  ];

  return (
    <div className="sidebar-container">
      <Menu
        // onClick={onClick}
        style={{ width: '100%' }}
        className="menu-container"
        mode="inline"
        items={items}
      />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onNewNote}
        style={{ position: 'absolute', bottom: 10, left: 15, right: 20 }}
      >
        Add Note
      </Button>
    </div>
  );
};

export default Sidebar;
