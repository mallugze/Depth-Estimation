import React, { useState, useRef } from 'react';

export default function ImageSlider({ beforeImage, afterImage }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    const newPosition = Math.max(0, Math.min(x / rect.width * 100, 100));
    setSliderPosition(newPosition);
  };

  const onMouseMove = (e) => handleMove(e.clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);

  return (
    <div 
      className="relative w-full aspect-video bg-black overflow-hidden select-none cursor-ew-resize rounded-xl"
      ref={containerRef}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Background (After) Image */}
      <img 
        src={afterImage} 
        alt="Depth Map" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
      />

      {/* Foreground (Before) Image with Clip Path */}
      <div 
        className="absolute inset-0 z-10 overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
        />
      </div>

      {/* Slider Handle Divider */}
      <div 
        className="absolute top-0 bottom-0 z-20 w-1 bg-white cursor-ew-resize flex items-center justify-center pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-8 h-8 bg-white text-surface rounded-full flex items-center justify-center shadow-lg border border-border">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <svg className="w-4 h-4 -ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 z-20 px-3 py-1 text-xs font-semibold text-white bg-black/50 backdrop-blur-md rounded-md pointer-events-none transition-opacity duration-300" style={{ opacity: sliderPosition > 20 ? 1 : 0 }}>
        Original
      </div>
      <div className="absolute top-4 right-4 z-20 px-3 py-1 text-xs font-semibold text-white bg-black/50 backdrop-blur-md rounded-md pointer-events-none transition-opacity duration-300" style={{ opacity: sliderPosition < 80 ? 1 : 0 }}>
        Depth Heatmap
      </div>

    </div>
  );
}
