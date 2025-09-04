import React, { useState, FunctionComponent, useEffect } from 'react';
import './LinkMenu.css';
import { Space, Modal, Input, Button, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface SettingsMenuProps {
  onCancelMenu: () => void;
  dbConnected: boolean;
}

const SettingsMenu: FunctionComponent<SettingsMenuProps> = ({
  onCancelMenu,
  dbConnected,
}) => {
  const [nnotePath, setNnotePath] = useState<string>('');
  const [isPathValid, setIsPathValid] = useState<boolean>(false);
  const [selecting, setSelecting] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const res = await window.api.config.get();
      if (res.success) {
        setNnotePath(res.config.nnotesFilePath || '');
        setIsPathValid(!!res.config.nnotesFilePath);
      } else {
        message.error(`Failed to load config: ${res.error}`);
      }
    };
    load();
  }, []);

  const handleSelectDirectory = async () => {
    setSelecting(true);
    try {
      const result = await window.api.config.selectDirectory();
      if (result.success) {
        setNnotePath(result.filePath);
        setIsPathValid(true);
        message.success('Directory selected');
      }
    } catch (err) {
      message.error('Error selecting directory');
    } finally {
      setSelecting(false);
    }
  };

  const handleOnOk = async () => {
    if (!isPathValid) return;
    const res = await window.api.config.updatePath(nnotePath);
    if (!res.success) {
      message.error(`Failed to update path: ${res.error}`);
      return;
    }
    onCancelMenu();
  };

  return (
    <Modal
      title="Select Save Directory"
      centered
      open
      okText="Save"
      onOk={handleOnOk}
      onCancel={dbConnected ? onCancelMenu : undefined}
      closeIcon={dbConnected ? <CloseOutlined /> : null}
      cancelButtonProps={{ disabled: !dbConnected }}
      okButtonProps={{ disabled: !isPathValid }}
    >
      <Space.Compact style={{ width: '100%' }}>
        <Input placeholder="Select a directory" value={nnotePath} readOnly />
        <Button
          key="select"
          type="primary"
          loading={selecting}
          onClick={handleSelectDirectory}
        >
          Select Directory
        </Button>
      </Space.Compact>
    </Modal>
  );
};

export default SettingsMenu;
