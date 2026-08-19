import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, RefreshCw, Eye, Sliders } from 'lucide-react';

export default function ThreeDViewer({ pointsData, colormap = 'ORIGINAL' }) {
  const mountRef = useRef(null);
  const [heightScale, setHeightScale] = useState(1.5);
  const [pointSize, setPointSize] = useState(0.12);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedColormap, setSelectedColormap] = useState(colormap);
  
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const pointsObjRef = useRef(null);
  const cameraRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.5, y: 0.6 });

  useEffect(() => {
    if (!mountRef.current || !pointsData || pointsData.length === 0) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 450;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c14);
    sceneRef.current = scene;

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);
    cameraRef.current = camera;

    // 3. Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Create Grid Helper for industrial engineering aesthetic
    const grid = new THREE.GridHelper(14, 14, 0x0ea5e9, 0x1e293b);
    grid.position.y = -5.5;
    scene.add(grid);

    // 5. Build Point Cloud Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    pointsData.forEach(pt => {
      const [x, y, z, r, g, b] = pt;
      positions.push(x, y, z * heightScale);

      // Color computation based on colormap
      if (selectedColormap === 'ORIGINAL') {
        colors.push(r / 255, g / 255, b / 255);
      } else if (selectedColormap === 'INFERNO') {
        const normZ = Math.max(0, Math.min(1, (z * heightScale) / 4.0));
        colors.push(normZ, normZ * 0.4, 1 - normZ);
      } else if (selectedColormap === 'TURBO') {
        const normZ = Math.max(0, Math.min(1, (z * heightScale) / 4.0));
        colors.push(1 - normZ, Math.sin(normZ * Math.PI), normZ);
      } else {
        // Cyan elevation gradient
        const normZ = Math.max(0, Math.min(1, (z * heightScale) / 4.0));
        colors.push(0.05, 0.6 + normZ * 0.4, 0.9);
      }
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    const pointsObj = new THREE.Points(geometry, material);
    pointsObj.rotation.x = rotationRef.current.x;
    pointsObj.rotation.y = rotationRef.current.y;
    scene.add(pointsObj);
    pointsObjRef.current = pointsObj;

    // 6. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && pointsObjRef.current) {
        pointsObjRef.current.rotation.y += 0.006;
        rotationRef.current.y = pointsObjRef.current.rotation.y;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. Mouse/Touch Orbit Controls
    const dom = renderer.domElement;
    
    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !pointsObjRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      pointsObjRef.current.rotation.y += deltaX * 0.008;
      pointsObjRef.current.rotation.x += deltaY * 0.008;
      
      rotationRef.current = {
        x: pointsObjRef.current.rotation.x,
        y: pointsObjRef.current.rotation.y
      };

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(6, Math.min(30, cameraRef.current.position.z + e.deltaY * 0.02));
    };

    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Window Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight || 450;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [pointsData, heightScale, pointSize, autoRotate, selectedColormap]);

  const handleResetCamera = () => {
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 16);
    if (pointsObjRef.current) {
      pointsObjRef.current.rotation.set(0.5, 0.6, 0);
      rotationRef.current = { x: 0.5, y: 0.6 };
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 3D Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-card rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Sliders size={14} className="text-cyan-400" />
            <span className="font-medium text-primary">3D Topography Controls</span>
          </div>
          
          <select 
            value={selectedColormap} 
            onChange={(e) => setSelectedColormap(e.target.value)}
            className="text-xs bg-surface border border-border text-primary rounded px-2 py-1 font-medium focus:outline-none focus:border-accent"
          >
            <option value="ORIGINAL">Natural RGB Colors</option>
            <option value="INFERNO">Inferno Thermal</option>
            <option value="TURBO">Turbo Elevation</option>
            <option value="CYAN">Structural Cyan</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted">Depth Scale:</span>
            <input 
              type="range" 
              min="0.5" 
              max="3.5" 
              step="0.1" 
              value={heightScale} 
              onChange={(e) => setHeightScale(parseFloat(e.target.value))}
              className="w-20 h-1 bg-surface-hover accent-cyan-400 rounded cursor-pointer"
            />
            <span className="font-mono text-cyan-400">{heightScale.toFixed(1)}x</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted">Point Size:</span>
            <input 
              type="range" 
              min="0.05" 
              max="0.30" 
              step="0.01" 
              value={pointSize} 
              onChange={(e) => setPointSize(parseFloat(e.target.value))}
              className="w-16 h-1 bg-surface-hover accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${autoRotate ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-surface text-muted hover:text-primary border border-border'}`}
            title="Toggle Auto Rotation"
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
            <span>Orbit</span>
          </button>

          <button 
            onClick={handleResetCamera}
            className="p-1.5 rounded text-xs bg-surface text-muted hover:text-primary border border-border flex items-center gap-1 font-medium transition-colors"
            title="Reset Perspective"
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div 
        ref={mountRef} 
        className="w-full h-[460px] rounded-xl overflow-hidden border border-border bg-[#0a0c14] relative cursor-grab active:cursor-grabbing shadow-inner"
      >
        <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 bg-black/60 backdrop-blur-md rounded text-[11px] font-medium text-muted border border-white/10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Interactive 3D WebGL Mesh</span>
        </div>
        <div className="absolute bottom-3 left-3 pointer-events-none text-[11px] text-muted/70 bg-black/40 px-2 py-0.5 rounded">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
