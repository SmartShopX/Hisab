import React from 'react';
import { CloudBackupRecoveryModal } from '../backup/CloudBackupRecoveryModal';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'sync' | 'csv' | 'pdf' | 'restore' | 'reset';
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = (props) => {
  return <CloudBackupRecoveryModal {...props} />;
};

export default CloudSyncModal;
