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
      try {
        const noteResponse =
          await window.electron.ipcRenderer.invokeMessage('get-nnote-path');
        if (noteResponse && noteResponse.success) {
          console.log('Note path:', noteResponse.nnotePath);
          setNnotePath(noteResponse.nnotePath);
          setIsPathValid(true); // Assume the path from getPath is valid
        } else {
          console.error('Failed to get notes:', noteResponse.error);
        }
      } catch (error) {
        console.error('Error when getting notes:', (error as Error).message);
      }
    };

    const handleSelectDirectory = async () => {
      try {
        // Invoke the select-directory IPC message to open the directory dialog
        const result =
          await window.electron.ipcRenderer.invokeMessage('select-directory');

        // Check if the directory selection was successful
        if (result.success) {
          setNnotePath(result.filePath); // Update the state with the selected directory path
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
      try {
        window.electron.ipcRenderer.sendMessage('update-nnote-path', {
          nnoteDir,
        });
        onCancelMenu(); // Close the modal after updating the path
      } catch (error) {
        console.error('Error when updating path:', (error as Error).message);
      }
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
