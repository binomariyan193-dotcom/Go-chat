import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ZoomIn, ZoomOut, RotateCw, Grid } from 'lucide-react';

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
  const FRAME_SIZE = 280; // 280x280px preview circle
  const OUTPUT_SIZE = 512; // High-res 512x512px 1:1 output

  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);

  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setOffset({ x: 0, y: 0 });
      setRotation(0);

      // Calculate initial cover scale so image fills the 1:1 280px frame perfectly
      const coverScale = Math.max(FRAME_SIZE / img.width, FRAME_SIZE / img.height);
      setZoom(coverScale);
      setMinZoom(coverScale * 0.5);
    };
  }, [imageSrc]);

  // Mouse & Touch Drag Handlers
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Fill background
    ctx.fillStyle = '#03081C';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    ctx.save();
    // Move to center of output canvas
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale from preview 280px frame to 512px output canvas
    const scaleRatio = OUTPUT_SIZE / FRAME_SIZE;
    ctx.scale(zoom * scaleRatio, zoom * scaleRatio);
    ctx.translate(offset.x, offset.y);

    // Draw image centered at 1:1 aspect ratio
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      'image/webp',
      1.0
    );
  };

  if (!imageSrc || !isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crop Profile Picture (1:1 Aspect Ratio)">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Interactive 1:1 Crop Frame */}
        <div
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => {
            if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handleEnd}
          style={{
            width: `${FRAME_SIZE}px`,
            height: `${FRAME_SIZE}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--accent-bright)',
            boxShadow: '0 0 0 9999px rgba(3, 8, 28, 0.78)',
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#03081C',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <img
            src={imageSrc}
            alt="Crop Preview"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              maxWidth: 'none',
              maxHeight: 'none',
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              pointerEvents: 'none',
            }}
          />

          {/* Rule of Thirds 3x3 Grid Overlay */}
          {showGrid && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ border: '0.5px solid rgba(255, 255, 255, 0.18)' }} />
              ))}
            </div>
          )}
        </div>

        {/* Crop Controls: Zoom, Rotate, Grid */}
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
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ZoomOut size={16} color="var(--text-secondary)" />
            <input
              type="range"
              min={minZoom}
              max={minZoom * 6}
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-bright)' }}
            />
            <ZoomIn size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: '42px', textAlign: 'right' }}>
              {Math.round((zoom / minZoom) * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setShowGrid((prev) => !prev)}
              style={{
                background: 'none',
                border: '1px solid var(--glass-border)',
                color: showGrid ? 'var(--accent-bright)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Grid size={14} /> Grid
            </button>

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

        {/* Save Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            Apply 1:1 Avatar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
