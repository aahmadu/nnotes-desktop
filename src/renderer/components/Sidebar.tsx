import { useEffect, useState, FunctionComponent } from 'react';
import './Sidebar.css';
import { Menu, Input, Button, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Note } from '../../types/general';

interface SidebarProps {
  activeNote: Note;
  notes: Note[];
  onNoteSelect: (note: Note) => void;
  onNewNote: () => void;
  onDelete: (noteID: number) => void;
}

const Sidebar: FunctionComponent<SidebarProps> = function Sidebar({
  activeNote,
  notes,
  onNoteSelect,
  onNewNote,
  onDelete,
}) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(activeNote ? [activeNote.id.toString()] : []);

  useEffect(() => {
    if (activeNote) {
      setSelectedKeys([activeNote.id.toString()]);
    }
  }, [activeNote]);

  const handleDelete = (noteId: number) => {
    onDelete(noteId);
  };

  const contextMenuItems: MenuProps['items'] = [
    {
      label: 'Link',
      key: 'link',
      children: [
        { label: 'To', key: 'to', children: notes.map((note) => ({
          key: `link-${note.id}`,
          label: note.title,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            const linkTo = parseInt(key.split('-')[1], 10);
            console.log('Linking to:', linkTo);
          },
        })), },
        { label: 'From', key: 'from', children: notes.map((note) => ({
          key: `link-${note.id}`,
          label: note.title,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            const linkTo = parseInt(key.split('-')[1], 10);
            console.log('Linking to:', linkTo);
          },
        })), },
      ],
    },
    {
      icon: <DeleteOutlined />,
      label: 'Delete',
      key: 'delete',
      onClick: ({ key, domEvent }) => {
        domEvent.stopPropagation();
        const noteId = parseInt(key.split('-')[1], 10);
        handleDelete(noteId);
      },
    },
  ];

  const items: MenuProps['items'] = [
    {
      key: 'search',
      type: 'group',
      label: (
        <Input
          className="search-item"
          placeholder="Search notes..."
          style={{ width: '100%', marginBottom: '10px' }}
        />
      ),
    },
    {
      type: 'divider',
    },
    ...notes.map((note) => ({
      key: note.id,
      label: (
        <Dropdown
          menu={{ items: contextMenuItems.map((item) => ({ ...item, key: `delete-${note.id}` })) }}
          trigger={['contextMenu']}
        >
          <div style={{ display: 'inline-block', width: '100%' }}>
            {note.title}
          </div>
        </Dropdown>
      ),
      onClick: ({ key }) => {
        onNoteSelect(note);
        setSelectedKeys([key]);
      },
    })),
  ];

  const handleAddNote = () => {
    setSelectedKeys([]);
    onNewNote();
  };

  return (
    <div className="sidebar-container">
      <Menu
        style={{ width: '100%' }}
        className="menu-container"
        mode="inline"
        items={items}
        selectedKeys={selectedKeys}
      />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddNote}
        style={{ position: 'absolute', bottom: 10, left: 15, right: 20 }}
      >
        Add Note
      </Button>
    </div>
  );
};

export default Sidebar;
