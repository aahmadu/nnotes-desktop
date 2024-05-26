import React, { useRef, useState, FunctionComponent, useEffect } from 'react';
import './LinkMenu.css';
import { Space, Modal, Input, Button } from 'antd';

interface SettingsMenuProps {
  onCancelMenu: () => void;
  handleSelectDirectory: () => void;
}

const SettingsMenu: FunctionComponent<SettingsMenuProps> =
  function SettingsMenu({ handleSelectDirectory, onCancelMenu }) {
    return (
      <Modal
        title="Select Save Directory"
        centered
        open
        okText="Create"
        // onOk={onClickCreate}
        onCancel={onCancelMenu}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Input
            // className="site-input-split"
            style={{ pointerEvents: 'none' }}
            placeholder={getFilePath()}
            disabled
          />
          <Button key="select" type="primary" onClick={handleSelectDirectory}>Select Directory</Button>
        </Space.Compact>
      </Modal>
    );
  };

export default SettingsMenu;
