import React, { useState, FunctionComponent } from 'react';
import { Note } from '../../types/general';
import './LinkMenu.css';
import { Modal, Radio, Select, Input, Space, Typography, Divider } from 'antd';
import { ArrowRightOutlined, ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons';

interface LinkMenuProps {
  allNotes: Note[];
  allLinkTags: string[];
  onCreateLink: (linkto: string, note: Note, linkTag: string) => void;
  onCancelMenu: () => void;
}

const LinkMenu: FunctionComponent<LinkMenuProps> = ({
  allNotes,
  allLinkTags,
  onCreateLink,
  onCancelMenu,
}) => {
  // Direction must match existing consumer logic ('To'|'From')
  const [linkOption, setLinkOption] = useState<'To' | 'From'>('To');
  const [noteOption, setNoteOption] = useState<string>(
    allNotes.length > 0 ? String(allNotes[0].id) : 'new',
  );
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [tagValue, setTagValue] = useState<string>('');

  const isNewNote = noteOption === 'new';
  const selectedNote = allNotes.find((n) => String(n.id) === noteOption);
  const canCreate = (isNewNote ? newNoteTitle.trim().length > 0 : !!selectedNote) && tagValue.trim().length > 0;

  const handleCreate = () => {
    const note: Note = isNewNote
      ? { title: newNoteTitle.trim(), content: '' }
      : (selectedNote as Note);
    onCreateLink(linkOption, note, tagValue.trim());
  };

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />
          <span>Create Link</span>
        </Space>
      }
      centered
      open
      okText="Create"
      okButtonProps={{ disabled: !canCreate }}
      onOk={handleCreate}
      onCancel={onCancelMenu}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Typography.Text strong>Direction</Typography.Text>
          <div>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={linkOption}
              onChange={(e) => setLinkOption(e.target.value)}
            >
              <Radio.Button value="To">To <ArrowRightOutlined /></Radio.Button>
              <Radio.Button value="From">From <ArrowLeftOutlined /></Radio.Button>
            </Radio.Group>
          </div>
        </div>

        <div>
          <Typography.Text strong>Note</Typography.Text>
          <Select
            showSearch
            placeholder="Search note…"
            style={{ width: '100%' }}
            value={noteOption}
            onChange={(v) => setNoteOption(v)}
            options={[
              ...allNotes.map((n) => ({ label: n.title || `Untitled #${n.id}`, value: String(n.id) })),
              { label: 'Create new note…', value: 'new' },
            ]}
            filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
          />
          {isNewNote && (
            <Input
              autoFocus
              style={{ marginTop: 8 }}
              placeholder="New note title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
          )}
        </div>

        <div>
          <Typography.Text strong>Tag</Typography.Text>
          <Select
            mode="tags"
            maxTagCount={1}
            placeholder="Choose or type a tag"
            style={{ width: '100%' }}
            value={tagValue ? [tagValue] : []}
            onChange={(vals) => setTagValue((Array.isArray(vals) ? vals[0] : vals) || '')}
            tokenSeparators={[',']}
            options={allLinkTags.map((t) => ({ label: t, value: t }))}
          />
        </div>

        <Divider style={{ margin: '8px 0' }} />
        <Typography.Text type="secondary">
          {linkOption === 'To' ? 'Active note → Selected note' : 'Selected note → Active note'}
          {tagValue ? ` · tag: ${tagValue}` : ''}
        </Typography.Text>
      </Space>
    </Modal>
  );
};

export default LinkMenu;
