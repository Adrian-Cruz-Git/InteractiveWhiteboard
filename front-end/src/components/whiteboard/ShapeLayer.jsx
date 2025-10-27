// src/components/whiteboard/ShapeLayer.jsx (FULL UPDATED FILE)
import React, { useRef, useEffect } from 'react';
// NEW: Import Ellipse
import { Stage, Layer, Rect, Ellipse, Line, Arrow, Transformer } from 'react-konva';

// This sub-component renders the correct Konva shape and its transformer
const ShapeComponent = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef(); // Transformer Ref

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const commonProps = {
    ...shapeProps,
    ref: shapeRef,
    onClick: onSelect,
    onTap: onSelect,
    // NEW: Add cursor changes for drag-and-drop
    onMouseEnter: e => {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'move';
    },
    onMouseLeave: e => {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'default';
    },
    onDragEnd: (e) => {
      onChange({
        ...shapeProps,
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onTransformEnd: (e) => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      node.scaleX(1);
      node.scaleY(1);

      onChange({
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        // NEW: Update rotation
        rotation: node.rotation()
      });
    },
  };
  
  const fillProps = shapeProps.isSolid 
    ? { fill: shapeProps.color, stroke: shapeProps.color }
    : { fill: null, stroke: shapeProps.color };

  let shape;
  switch (shapeProps.type) {
    case 'rect':
      shape = <Rect {...commonProps} {...fillProps} strokeWidth={2} />;
      break;
    
    // NEW: Replaced Circle with Ellipse
    case 'circle':
      shape = <Ellipse 
                {...commonProps} 
                {...fillProps} 
                strokeWidth={2} 
                // Ellipse uses radiusX and radiusY
                radiusX={commonProps.width / 2} 
                radiusY={commonProps.height / 2} 
              />;
      break;
    
    case 'line':
      shape = <Line {...commonProps} points={[0, 0, commonProps.width, commonProps.height]} {...fillProps} strokeWidth={2} />;
      break;
    case 'arrow':
      shape = <Arrow {...commonProps} points={[0, 0, commonProps.width, commonProps.height]} {...fillProps} strokeWidth={2} />;
      break;
    case 'triangle':
      shape = <Line {...commonProps} points={[commonProps.width / 2, 0, commonProps.width, commonProps.height, 0, commonProps.height]} closed {...fillProps} strokeWidth={2} />;
      break;
    default:
      return null;
  }

  return (
    <>
      {shape}
      {isSelected && (
        <Transformer
          ref={trRef}
          
          // NEW: Configuration for all handles + rotation
          rotateEnabled={true}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right', 
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]}
          
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};


// This is the main Layer Component that holds all shapes
export const ShapeLayer = ({ activeTool, shapeSettings, onAddShape, shapes, onUpdateShape, onRemoveShape, selectedShapeId, onSelectShape }) => {
  const stageRef = useRef(null);

  const handleStageClick = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    // Only place shapes if the shape tool is active
    if (activeTool === 'shapes' && clickedOnEmpty) {
      const pos = e.target.getStage().getPointerPosition();
      onAddShape({
        ...shapeSettings,
        x: pos.x,
        y: pos.y,
        width: 100, 
        height: 100,
        rotation: 0,
        draggable: true,
      });
    } 
    
    // Only deselect if the cursor tool is active
    if (activeTool === 'cursor' && clickedOnEmpty) {
      onSelectShape(null); // Deselect
    }
  };

  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeId) {
          onRemoveShape(selectedShapeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, onRemoveShape]);

  const shapesArray = Object.values(shapes);

  return (
    <Stage
      ref={stageRef}
      width={5000} // Match your pixel canvas size
      height={5000} // Match your pixel canvas size
      // We moved the style logic to the parent div in Whiteboard.jsx
      onMouseDown={handleStageClick}
      onTouchStart={handleStageClick}
    >
      <Layer>
        {shapesArray.map((shape) => (
          <ShapeComponent
            key={shape.id}
            shapeProps={shape}
            // NEW: Only allow selection if cursor tool is active
            isSelected={shape.id === selectedShapeId && activeTool === 'cursor'}
            onSelect={() => activeTool === 'cursor' ? onSelectShape(shape.id) : null}
            onChange={(newAttrs) => onUpdateShape(shape.id, newAttrs)}
          />
        ))}
      </Layer>
    </Stage>
  );
};