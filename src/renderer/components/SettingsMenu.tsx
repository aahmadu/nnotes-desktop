import React, { useRef, useState, FunctionComponent, useEffect } from 'react';
import './LinkMenu.css';
import { Space, Modal, Input, Button, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface SettingsMenuProps {
  onCancelMenu: () => void;
  dbConnected: boolean;
}

const SettingsMenu: FunctionComponent<SettingsMenuProps> =
  function SettingsMenu({ onCancelMenu, dbConnected }) {
    useEffect(() => {
      getPath();
    }, []);

    const [nnotePath, setNnotePath] = useState<string>('');
    const [isPathValid, setIsPathValid] = useState<boolean>(false);

    const getPath = async () => {
      const res = await window.api.config.get();
      if (res.success) {
        setNnotePath(res.config.nnotesFilePath);
        setIsPathValid(!!res.config.nnotesFilePath);
      } else {
        console.error('Failed to get config:', res.error);
      }
    };

    const handleSelectDirectory = async () => {
      try {
        // Invoke the select-directory IPC message to open the directory dialog
        const result = await window.api.config.selectDirectory();

        // Check if the directory selection was successful
        if (result.success) {
          setNnotePath(result.filePath);
          setIsPathValid(true); // Set the path as valid

          console.log('Directory selected:', result.filePath); // Log the selected directory path
          message.success(`Directory selected: ${result.filePath}`); // Show success message
        } else {
          message.warning('Directory selection was cancelled.'); // Show cancellation message
        }
      } catch (error) {
        // Log the error message
        console.error(
          'Error selecting directory:',
          error instanceof Error ? error.message : error,
        );

        // Show error message
        message.error(
          `Error selecting directory: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    };

    const handleOnOk = async (nnoteDir: string) => {
      console.log('Selected path:', nnoteDir);
      const res = await window.api.config.updatePath(nnoteDir);
      if (!res.success) {
        console.error('Error when updating path:', res.error);
      }
      onCancelMenu();
    };

    return (
      <Modal
        title="Select Save Directory"
        centered
        open
        okText="Ok"
        onOk={() => handleOnOk(nnotePath)}
        onCancel={dbConnected ? onCancelMenu : undefined}
        // closable={dbConnected}
        closeIcon={dbConnected ? <CloseOutlined /> : null}
        cancelButtonProps={{ disabled: !dbConnected }} // Disable Cancel button if db is connected
        okButtonProps={{ disabled: !dbConnected && !isPathValid }} // Disable Ok button if path is invalid and db is not connected
      >
        <Space.Compact style={{ width: '100%' }}>
          <Input
            style={{ pointerEvents: 'none' }}
            placeholder={nnotePath}
            value={nnotePath}
            disabled
          />
          <Button key="select" type="primary" onClick={handleSelectDirectory}>
            Select Directory
          </Button>
        </Space.Compact>
      </Modal>
    );
  };

export default SettingsMenu;
