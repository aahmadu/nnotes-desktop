import { FunctionComponent, useMemo, useState } from 'react';
import { Badge, Button, Empty, Space, Tag, Tooltip, Typography } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { Link, Note } from '../../types/general';

interface LinkInspectorProps {
  activeNote?: Note;
  notes: Note[];
  links: Link[];
  onNoteSelect: (note: Note) => void;
  onLinksChanged: () => void;
}

type Dir = 'in' | 'out';

const LinkInspector: FunctionComponent<LinkInspectorProps> = ({
  activeNote,
  notes,
  links,
  onNoteSelect,
  onLinksChanged,
}) => {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const byDirAndTag = useMemo(() => {
    const result: Record<Dir, Record<string, { link: Link; other: Note }[]>> = {
      in: {},
      out: {},
    };
    if (!activeNote) return result;
    for (const l of links) {
      if (l.target === activeNote.id) {
        const tag = l.linkTag;
        const note = notes.find((n) => n.id === l.source);
        if (!note) continue;
        result.in[tag] = result.in[tag] || [];
        result.in[tag].push({ link: l, other: note });
      } else if (l.source === activeNote.id) {
        const tag = l.linkTag;
        const note = notes.find((n) => n.id === l.target);
        if (!note) continue;
        result.out[tag] = result.out[tag] || [];
        result.out[tag].push({ link: l, other: note });
      }
    }
    return result;
  }, [activeNote, links, notes]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    Object.keys(byDirAndTag.in).forEach((t) => s.add(t));
    Object.keys(byDirAndTag.out).forEach((t) => s.add(t));
    return Array.from(s).sort();
  }, [byDirAndTag]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const isTagActive = (tag: string) => activeTags.length === 0 || activeTags.includes(tag);

  const removeLink = async (id?: number) => {
    if (!id) return;
    const res = await window.api.links.delete(id);
    if (!res.success) return;
    onLinksChanged();
  };

  const reverseLink = async (l: Link) => {
    // reverse by deleting and adding new
    if (l.id) await window.api.links.delete(l.id);
    await window.api.links.add({ source: l.target, target: l.source, linkTag: l.linkTag });
    onLinksChanged();
  };

  const Section = ({ dir }: { dir: Dir }) => {
    const data = byDirAndTag[dir];
    const entries = Object.entries(data).filter(([tag]) => isTagActive(tag));
    if (entries.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={dir === 'in' ? 'No parents' : 'No children'} />;
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {entries.map(([tag, items]) => (
          <div key={`${dir}-${tag}`} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Space>
                <Tag color="default">{tag}</Tag>
                <Badge count={items.length} size="small" style={{ backgroundColor: 'var(--brand-primary)' }} />
              </Space>
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              {items.map(({ link, other }) => (
                <div key={link.id ?? `${link.source}-${link.target}-${link.linkTag}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                >
                  <Button type="link" onClick={() => onNoteSelect(other)} style={{ padding: 0 }}>
                    {other.title || `Untitled #${other.id}`}
                  </Button>
                  <Space>
                    <Tooltip title="Reverse">
                      <Button size="small" icon={<SwapOutlined />} onClick={() => reverseLink(link)} />
                    </Tooltip>
                    <Tooltip title="Delete link">
                      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeLink(link.id)} />
                    </Tooltip>
                  </Space>
                </div>
              ))}
            </Space>
          </div>
        ))}
      </Space>
    );
  };

  return (
    <div style={{ padding: 12 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Typography.Text strong>Tags</Typography.Text>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allTags.length === 0 ? (
              <Typography.Text type="secondary">No tags</Typography.Text>
            ) : (
              allTags.map((t) => (
                <Tag
                  key={t}
                  color={activeTags.includes(t) ? 'processing' : 'default'}
                  onClick={() => toggleTag(t)}
                  style={{ cursor: 'pointer' }}
                >
                  {t}
                </Tag>
              ))
            )}
          </div>
        </div>

        <div>
          <Space align="center" style={{ marginBottom: 6 }}>
            <ArrowLeftOutlined />
            <Typography.Text strong>Parents</Typography.Text>
          </Space>
          <Section dir="in" />
        </div>

        <div>
          <Space align="center" style={{ marginBottom: 6 }}>
            <Typography.Text strong>Children</Typography.Text>
            <ArrowRightOutlined />
          </Space>
          <Section dir="out" />
        </div>
      </Space>
    </div>
  );
};

export default LinkInspector;

