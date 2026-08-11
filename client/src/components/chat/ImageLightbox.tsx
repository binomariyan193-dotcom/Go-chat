import React from 'react';
import { Modal } from '../common/Modal';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <Modal isOpen={!!imageUrl} onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img
          src={imageUrl}
          alt="Full screen preview"
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            borderRadius: 'var(--radius-md)',
            objectFit: 'contain',
          }}
        />
      </div>
    </Modal>
  );
};
