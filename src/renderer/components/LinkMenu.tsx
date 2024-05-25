import React, { useRef, useState, FunctionComponent, useEffect } from 'react';
import { Note } from '../../types/general';
import './LinkMenu.css';
import { Modal } from 'antd';
import * as d3 from 'd3';
import { colours } from './utils';

interface LinkMenuProps {
  allNotes: Note[];
  allLinkTags: string[];
  onCreateLink: (linkto: string, note: Note, linkTag: string) => void;
  onCancelMenu: () => void;
}

const LinkMenu: FunctionComponent<LinkMenuProps> = function LinkMenu({
  allNotes,
  allLinkTags,
  onCreateLink,
  onCancelMenu,
}) {
  const d3Container = useRef(null);
  const [linkOption, setLinkOption] = useState('To');
  const [noteOption, setNoteOption] = useState(
    allNotes.length > 0 ? allNotes[0].id.toString() : 'new',
  );
  const [tagOption, setTagOption] = useState(
    allLinkTags.length > 0 ? allLinkTags[0] : 'new',
  );
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const svg = d3
      .select(d3Container.current)

    svg
      .append('defs')
      .selectAll("marker")
      .data(['link', 'outLink', 'inLink'])
      .join("marker")
      .attr('id', (d) => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', -0.5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', (d) => colours[d])
      .attr('d', 'M0,-5L10,0L0,5');

    svg.append('circle').attr('r', 4)
  }, []);

  const handleLinkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLinkOption(event.target.value);
  };

  const handleNoteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNoteOption(event.target.value);
    if (event.target.value === 'new') {
      // If the user selects 'new', show the text field
      setNewNote('');
    }
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTagOption(event.target.value);
    if (event.target.value === 'new') {
      // If the user selects 'new', show the text field
      setNewTag('');
    }
  };

  const onClickCreate = () => {
    console.log(
      'Creating link...',
      noteOption,
      allNotes.find((note) => note.id === +noteOption),
    );
    const finalNoteOption =
      noteOption === 'new'
        ? { title: newNote, content: '' }
        : allNotes.find((note) => note.id === +noteOption);
    const finalTagOption = tagOption === 'new' ? newTag : tagOption;
    onCreateLink(linkOption, finalNoteOption, finalTagOption);
  };

  return (
    <Modal
      title="Vertically centered modal dialog"
      centered
      open
      okText="Create"
      onOk={onClickCreate}
      onCancel={onCancelMenu}
    >
      <svg ref={d3Container} style={{ width: '100%', height: '100%' }} />
      <label>
        Link:
        <select value={linkOption} onChange={handleLinkChange} style={{ width: 120 }}>
          <option value="to">To</option>
          <option value="from">From</option>
        </select>
      </label>
      <label>
        Note:
        <select value={noteOption} onChange={handleNoteChange}>
          {allNotes.map(note => (
            <option key={note.id} value={note.id}>
              {note.title}
            </option>
          ))}
          <option value="new">New</option>
        </select>
        {noteOption === 'new' && (
          <input
            type="text"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
          />
        )}
      </label>
      <label>
        Tag:
        <select value={tagOption} onChange={handleTagChange}>
          {allLinkTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
          <option value="new">New</option>
        </select>
        {tagOption === 'new' && (
          <input
            type="text"
            value={newTag}
            onChange={(event) => setNewTag(event.target.value)}
          />
        )}
      </label>
    </Modal>
  );
};

export default LinkMenu;
