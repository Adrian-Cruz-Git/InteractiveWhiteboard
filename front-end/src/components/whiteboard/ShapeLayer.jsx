import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Arrow, Transformer } from 'react-konva';

// Sub-component for rendering individual shapes and their transformer
const ShapeComponent = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef(); // Transformer Ref

  // Attach transformer when shape is selected
  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw(); // Use optional chaining for safety
    }
  }, [isSelected]);

  // Common properties for all Konva shapes
  const commonProps = {
    ...shapeProps, // Includes id, type, x, y, width, height, color, rotation, etc.
    ref: shapeRef,
    onClick: onSelect,
    onTap: onSelect,
    draggable: shapeProps.draggable, // Ensure draggable prop is passed
    // Cursor change on hover
    onMouseEnter: e => {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'move';
    },
    onMouseLeave: e => {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'default';
    },
    // Update position after dragging
    onDragEnd: (e) => {
      onChange({
        ...shapeProps,
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    // Update size, position, and rotation after transforming
    onTransformEnd: (e) => {
      const node = shapeRef.current;
      if (!node) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale after transform
      node.scaleX(1);
      node.scaleY(1);

      onChange({
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX), // Prevent zero or negative size
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation()
      });
    },
  };

  // Determine fill/stroke based on isSolid prop
  const fillProps = shapeProps.isSolid
    ? { fill: shapeProps.color, stroke: shapeProps.color }
    : { fill: null, stroke: shapeProps.color };

  let shape;
  switch (shapeProps.type) {
    case 'rect':
      shape = <Rect {...commonProps} {...fillProps} strokeWidth={2} />;
      break;
    case 'circle': // Now uses Ellipse for resizing
      shape = <Ellipse
                {...commonProps}
                {...fillProps}
                strokeWidth={2}
                radiusX={commonProps.width / 2}
                radiusY={commonProps.height / 2}
              />;
      break;
    case 'line':
      shape = <Line {...commonProps} points={[0, 0, commonProps.width, commonProps.height]} stroke={shapeProps.color} strokeWidth={2} />;
      break;
    case 'arrow':
      shape = <Arrow {...commonProps} points={[0, 0, commonProps.width, commonProps.height]} stroke={shapeProps.color} fill={shapeProps.color} strokeWidth={2} />;
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
          rotateEnabled={true}
          // Enable all resize anchors
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]}
          // Limit minimum size during resize
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


// Main Layer Component that holds the Stage and all shapes
export const ShapeLayer = ({
  activeTool,
  shapeSettings,
  onAddShape,
  shapes,
  onUpdateShape,
  onRemoveShape,
  selectedShapeId,
  onSelectShape,
  view // Receive view context
}) => {
  const stageRef = useRef(null);

  // Handle clicking on the stage to add shapes or deselect
  const handleStageClick = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const stage = e.target.getStage();
    if (!stage) return;

    if (activeTool === 'shapes' && clickedOnEmpty) {
      const pos = stage.getPointerPosition();
      // Adjust pointer position for stage's current view (zoom/pan)
      const scale = stage.scaleX(); // Assuming uniform scaling
      const stageX = stage.x();
      const stageY = stage.y();
      const worldX = (pos.x - stageX) / scale;
      const worldY = (pos.y - stageY) / scale;

      onAddShape({
        ...shapeSettings,
        x: worldX,
        y: worldY,
        width: 100 / scale, // Adjust default size for current zoom
        height: 100 / scale,
        rotation: 0,
        draggable: true,
      });
    }

    if (activeTool === 'cursor' && clickedOnEmpty) {
      onSelectShape(null); // Deselect if clicking empty space with cursor tool
    }
  };

  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeId && activeTool === 'cursor') { // Only delete if cursor tool active
          onRemoveShape(selectedShapeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, onRemoveShape, activeTool]);

  // Convert shapes object to array for rendering
  const shapesArray = Object.values(shapes || {}); // Use default empty object

  // Get scale and offset from view context
  const stageScale = view?.scale ?? 1;
  const stageX = view?.offsetX ?? 0;
  const stageY = view?.offsetY ?? 0;

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}   // Use window size for stage container
      height={window.innerHeight} // Use window size for stage container
      // Apply view context transforms to the Stage
      scaleX={stageScale}
      scaleY={stageScale}
      x={stageX}
      y={stageY}
      // Style ensures it overlays correctly
      style={{ position: 'absolute', top: 0, left: 0 }}
      onMouseDown={handleStageClick}
      onTouchStart={handleStageClick}
    >
      <Layer>
        {shapesArray.map((shape) => (
          <ShapeComponent
            key={shape.id}
            shapeProps={shape}
            isSelected={shape.id === selectedShapeId && activeTool === 'cursor'}
            // Only allow selection when cursor tool is active
            onSelect={() => activeTool === 'cursor' ? onSelectShape(shape.id) : null}
            onChange={(newAttrs) => onUpdateShape(shape.id, newAttrs)}
          />
        ))}
      </Layer>
    </Stage>
  );
};