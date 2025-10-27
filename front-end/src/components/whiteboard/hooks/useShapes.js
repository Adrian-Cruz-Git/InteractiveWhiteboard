// src/components/whiteboard/hooks/useShapes.js (NEW FILE)
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useShapes = (fileId, client) => {
  // We store shapes as an object (a map) for fast lookups by ID
  const [shapes, setShapes] = useState({});
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  
  const shapesChannel = client?.channels.get(`whiteboard-shapes-${fileId}`);

  // --- Real-Time Sync Logic ---
  useEffect(() => {
    if (!shapesChannel) return;

    const handleRemoteEvent = (message) => {
      const { name, data } = message;
      
      if (name === 'new-shape') {
        setShapes(prev => ({ ...prev, [data.id]: data }));
      }
      
      if (name === 'update-shape') {
        setShapes(prev => ({ 
          ...prev, 
          [data.id]: { ...prev[data.id], ...data.newAttrs } 
        }));
      }
      
      if (name === 'remove-shape') {
        setShapes(prev => {
          const { [data.id]: _, ...remainingShapes } = prev;
          return remainingShapes;
        });
      }

      if (name === 'clear-shapes') {
        setShapes({});
      }
    };
    
    shapesChannel.subscribe(handleRemoteEvent);
    
    // Load existing shapes for this room
    shapesChannel.history((err, resultPage) => {
      if (err) return console.error("Error loading shape history:", err);
      
      const loadedShapes = {};
      resultPage.items.forEach(msg => {
         // This is a simple history load, you might want more complex logic
         // to handle updates/deletes that happened in the past
         if (msg.name === 'new-shape') loadedShapes[msg.data.id] = msg.data;
         if (msg.name === 'update-shape') loadedShapes[msg.data.id] = { ...loadedShapes[msg.data.id], ...msg.data.newAttrs };
         if (msg.name === 'remove-shape') delete loadedShapes[msg.data.id];
      });
      setShapes(loadedShapes);
    });

    return () => shapesChannel.unsubscribe(handleRemoteEvent);
  }, [shapesChannel]);


  // --- Local Actions (which will publish to others) ---

  const addShape = (shapeConfig) => {
    const id = uuidv4();
    const newShape = {
      id,
      ...shapeConfig,
    };
    
    setShapes(prev => ({ ...prev, [id]: newShape }));
    shapesChannel?.publish('new-shape', newShape);
  };

  const updateShape = (id, newAttrs) => {
    // Optimistic update locally
    setShapes(prev => ({
      ...prev,
      [id]: { ...prev[id], ...newAttrs },
    }));
    
    // Send only the changes to other clients
    shapesChannel?.publish('update-shape', { id, newAttrs });
  };

  const removeShape = (id) => {
    // Optimistic update locally
    setShapes(prev => {
      const { [id]: _, ...remainingShapes } = prev;
      return remainingShapes;
    });
    setSelectedShapeId(null);
    shapesChannel?.publish('remove-shape', { id });
  };
  
  const clearShapes = () => {
    setShapes({});
    shapesChannel?.publish('clear-shapes', {});
  };

  return {
    shapes,
    addShape,
    updateShape,
    removeShape,
    clearShapes,
    selectedShapeId,
    setSelectedShapeId,
  };
};