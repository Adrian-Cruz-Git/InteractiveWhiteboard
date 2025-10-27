// src/components/whiteboard/ShapePalette.jsx (NEW FILE)
import React from 'react';
import './ShapePalette.css';

// 5 common shapes
const SHAPES = ['rect', 'circle', 'triangle', 'line', 'arrow'];
const COLORS = ['#E03131', '#2F9E44', '#1971C2', '#F08C00', '#000000', '#666666'];

export const ShapePalette = ({ onSelectShape, onSelectColor, onSelectFill, onClose }) => {
  return (
    <div className="shape-palette">
      <button onClick={onClose} className="close-btn">&times;</button>
      <h4>Shapes</h4>
      <div className="shape-grid">
        {SHAPES.map(shape => (
          <button key={shape} onClick={() => onSelectShape(shape)} className="shape-btn">
            {shape}
          </button>
        ))}
      </div>
      <h4>Color</h4>
      <div className="color-grid">
        {COLORS.map(color => (
          <button 
            key={color} 
            className="color-swatch" 
            style={{ backgroundColor: color }}
            onClick={() => onSelectColor(color)}
            aria-label={`Color ${color}`}
          />
        ))}
      </div>
      <h4>Style</h4>
      <div className="style-grid">
        <button onClick={() => onSelectFill(false)}>Outline</button>
        <button onClick={() => onSelectFill(true)}>Solid</button>
      </div>
    </div>
  );
};