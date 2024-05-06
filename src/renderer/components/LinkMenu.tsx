import { useState, FunctionComponent } from 'react';
import { Note } from '../../types/general';
import './LinkMenu.css';

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
  const [linkOption, setLinkOption] = useState('To');
  const [noteOption, setNoteOption] = useState(allNotes.length > 0 ? allNotes[0] : 'new');
  const [tagOption, setTagOption] = useState(allLinkTags.length > 0 ? allLinkTags[0] : 'new');
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');

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
    console.log('Creating link...');
    const finalNoteOption =
      noteOption === 'new' ? { title: newNote, content: '' } : noteOption;
    const finalTagOption = tagOption === 'new' ? newTag : tagOption;
    onCreateLink(linkOption, finalNoteOption, finalTagOption);
  };

  return (
    <div className="link-menu">
      <label>
        Link:
        <select value={linkOption} onChange={handleLinkChange}>
          <option value="to">To</option>
          <option value="from">From</option>
        </select>
      </label>
      <label>
        Note:
        <select value={noteOption} onChange={handleNoteChange}>
          {allNotes.map(note => (
            <option key={note.id} value={note.id}>{note.title}</option>
          ))}
          <option value="new">New</option>
        </select>
        {noteOption === 'new' && (
          <input type="text" value={newNote} onChange={event => setNewNote(event.target.value)} />
        )}
      </label>
      <label>
        Tag:
        <select value={tagOption} onChange={handleTagChange}>
          {allLinkTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
          <option value="new">New</option>
        </select>
        {tagOption === 'new' && (
          <input type="text" value={newTag} onChange={event => setNewTag(event.target.value)} />
        )}
      </label>
      <button type="button" onClick={onClickCreate}>
        Create
      </button>
      <button type="button" onClick={onCancelMenu}>Cancel</button>
    </div>
  );
}

export default LinkMenu;
