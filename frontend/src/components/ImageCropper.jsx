// src/components/ImageCropper.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';

export default function ImageCropper({ image, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const SIZE = 300; // square canvas, shown as a circle

  // Draw the current state into the canvas (this is exactly what will be saved)
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, SIZE, SIZE);

    // circular clipping mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // move origin to center + current offset, then scale, then draw image centered
    ctx.translate(SIZE / 2 + offset.x, SIZE / 2 + offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [offset, scale]);

  // Load image whenever "image" prop changes
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      imgRef.current = img;

      // Compute minimum scale so that the image fully covers the circle
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      setMinScale(s);
      setScale(s);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      console.error('Failed to load image in cropper');
    };
  }, [image]);

  // Redraw whenever image loaded / scale / offset change
  useEffect(() => {
    if (!imgRef.current) return;
    draw();
  }, [draw]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const stopDragging = () => {
    setDragging(false);
  };

  const handleZoomChange = (value) => {
    const v = parseFloat(value);
    setScale((prev) => {
      const next = isNaN(v) ? prev : v;
      return Math.max(minScale, Math.min(minScale * 3, next));
    });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        // ✅ File with proper extension so Django accepts JPEG/PNG
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onCrop(file);
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Adjust Photo</h3>
          <p className="text-xs text-gray-600 mt-1">
            Drag to reposition, use slider to zoom
          </p>
        </div>

        {/* Visible canvas (what you see is exactly what is saved) */}
        <div className="p-6">
          <div
            className="relative mx-auto rounded-full overflow-hidden border-2 border-purple-500 bg-gray-100 cursor-move"
            style={{ width: SIZE, height: SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
          >
            <canvas
              ref={canvasRef}
              className="block w-full h-full"
            />
          </div>

          {/* Zoom controls */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleZoomChange(Math.max(minScale, scale - minScale / 10))
                }
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                <ZoomOut size={18} />
              </button>
              <input
                type="range"
                min={minScale}
                max={minScale * 3}
                step={minScale / 10}
                value={scale}
                onChange={(e) => handleZoomChange(e.target.value)}
                className="flex-1 accent-purple-600"
              />
              <button
                type="button"
                onClick={() =>
                  handleZoomChange(Math.min(minScale * 3, scale + minScale / 10))
                }
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
