import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Sliders } from 'lucide-react';

export default function UploadDropzone({ onDrop }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onDrop(file);
      } else {
        alert('Please upload an image file (JPEG, PNG, etc).');
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onDrop(file);
      } else {
        alert('Please upload an image file (JPEG, PNG, etc).');
      }
    }
  };

  return (
    <div 
      className={`panel w-full min-h-[360px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 border-dashed ${
        isDragActive 
          ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan' 
          : 'border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800/30'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <div className={`mb-4 p-5 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400 transition-transform ${isDragActive ? 'scale-110' : ''}`}>
        <UploadCloud size={40} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-base font-bold text-primary mb-1">
        Select or Drag & Drop Structural Image
      </h3>
      <p className="text-xs text-muted max-w-sm leading-relaxed">
        High-resolution bridge decks, pavement slabs, retaining walls, and concrete surfaces up to 25MB (PNG, JPG, WEBP).
      </p>
      
      <div className="mt-6 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-glow-cyan transition-all">
        Browse File
      </div>
    </div>
  );
}
