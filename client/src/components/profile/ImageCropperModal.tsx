import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setOffset({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
  }, [imageSrc]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const CROP_SIZE = 300;
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    ctx.save();
    // Move to center of canvas
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(offset.x, offset.y);

    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png');
  };

  if (!imageSrc || !isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crop Profile Picture">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Interactive Crop Frame */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--accent-color)',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            userSelect: 'none',
          }}
        >
          <img
            src={imageSrc}
            alt="Crop Preview"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              maxWidth: 'none',
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Crop Controls: Zoom & Rotate */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '8px',
            backgroundColor: 'var(--bg-primary)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ZoomOut size={16} color="var(--text-secondary)" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-color)' }}
            />
            <ZoomIn size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '35px' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotate Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              style={{
                background: 'none',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCw size={14} /> Rotate 90°
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            Crop & Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
};
