import { useEffect, useState, FunctionComponent } from 'react';
import './Sidebar.css';
import { Menu } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Link, Note } from '../../types/general';

interface LinkNavProps {
  activeNote?: Note; // Allow activeNote to be undefined
  notes: Note[];
  links: Link[];
  onNoteSelect: (note: Note) => void;
  onDelete: (noteID: number) => void;
}

const LinkNav: FunctionComponent<LinkNavProps> = function LinkNav({
  activeNote,
  notes,
  links,
  onNoteSelect,
}) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(activeNote ? [activeNote.id.toString()] : []);

  useEffect(() => {
    if (activeNote) {
      setSelectedKeys([activeNote.id.toString()]);
    }
  }, [activeNote]);

  const parentsByTags = links.reduce<Record<string, Note[]>>((acc, link) => {
    if (activeNote && link.target === activeNote.id) {
      if (!acc[link.linkTag]) {
        acc[link.linkTag] = [];
      }
      const parentNote = notes.find(note => note.id === link.source);
      if (parentNote) {
        acc[link.linkTag].push(parentNote);
      }
    }
    return acc;
  }, {});

  const childrenByTags = links.reduce<Record<string, Note[]>>((acc, link) => {
    if (activeNote && link.source === activeNote.id) {
      if (!acc[link.linkTag]) {
        acc[link.linkTag] = [];
      }
      const childNote = notes.find(note => note.id === link.target);
      if (childNote) {
        acc[link.linkTag].push(childNote);
      }
    }
    return acc;
  }, {});

  // Convert to Ant Design Menu items format
  const parentItems = Object.keys(parentsByTags).map(tag => ({
    key: `parent-${tag}`,
    label: tag,
    children: parentsByTags[tag].map(note => ({
      key: `parent-${note.id}`,
      label: note.title,
      icon: <FileOutlined />,
      onClick: () => onNoteSelect(note),
    })),
  }));

  const childItems = Object.keys(childrenByTags).map(tag => ({
    key: `child-${tag}`,
    label: tag,
    children: childrenByTags[tag].map(note => ({
      key: `child-${note.id}`,
      label: note.title,
      icon: <FileOutlined />,
      onClick: () => onNoteSelect(note),
    })),
  }));

  const items: MenuProps['items'] = [
    ...(activeNote && parentItems.length > 0
      ? [
          {
            key: 'parents',
            label: 'Parents',
            children: parentItems,
          },
        ]
      : []),
    ...(activeNote && childItems.length > 0
      ? [
          {
            key: 'children',
            label: 'children',
            children: childItems,
          },
        ]
      : []),
  ];

  return (
    <div className="sidebar-container">
      <Menu
        style={{ width: '100%' }}
        className="menu-container"
        mode="inline"
        items={items}
        selectedKeys={selectedKeys}
      />
    </div>
  );
};

export default LinkNav;
