import { FunctionComponent } from 'react';
import './TopBar.css';
import { Button, Space, Tooltip, Switch } from 'antd';
import { SettingOutlined, BulbOutlined } from '@ant-design/icons';

interface TopBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

const TopBar: FunctionComponent<TopBarProps> = ({
  isDark,
  onToggleTheme,
  onOpenSettings,
}) => {
  return (
    <div className="topbar" data-tauri-drag-region>
      <div className="brand">
        <div className="dot" />
        <span className="title">nNotes</span>
      </div>
      <div className="center" />
      <Space size="middle" className="actions">
        <Tooltip title={isDark ? 'Switch to light' : 'Switch to dark'}>
          <div className="toggle">
            <BulbOutlined />
            <Switch size="small" checked={isDark} onChange={onToggleTheme} />
          </div>
        </Tooltip>
        <Tooltip title="Settings">
          <Button
            size="small"
            type="default"
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export default TopBar;
