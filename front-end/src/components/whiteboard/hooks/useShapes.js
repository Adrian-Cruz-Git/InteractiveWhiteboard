// src/components/whiteboard/hooks/useShapes.js (FULL FILE)
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
        // Add shape only if it doesn't exist locally (prevent echo)
        setShapes(prev => prev[data.id] ? prev : { ...prev, [data.id]: data });
      }

      if (name === 'update-shape') {
        // Update shape attributes
        setShapes(prev => ({
          ...prev,
          // Merge existing attrs with new ones, ensuring the shape exists
          [data.id]: prev[data.id] ? { ...prev[data.id], ...data.newAttrs } : prev[data.id]
        }));
      }

      if (name === 'remove-shape') {
        // Remove shape locally
        setShapes(prev => {
          const { [data.id]: _, ...remainingShapes } = prev;
          return remainingShapes;
        });
        // Deselect if the removed shape was selected
        if (selectedShapeId === data.id) {
            setSelectedShapeId(null);
        }
      }

      if (name === 'clear-shapes') {
        setShapes({});
        setSelectedShapeId(null);
      }
    };

    shapesChannel.subscribe(handleRemoteEvent);

    // --- Load History ---
    shapesChannel.history((err, resultPage) => {
      if (err) return console.error("Error loading shape history:", err);

      const loadedShapes = {};
      // Process history messages to reconstruct the current state
      resultPage.items.forEach(msg => {
         if (msg.name === 'new-shape') {
             loadedShapes[msg.data.id] = msg.data;
         } else if (msg.name === 'update-shape') {
             // Apply updates only if the shape exists
             if (loadedShapes[msg.data.id]) {
                 loadedShapes[msg.data.id] = { ...loadedShapes[msg.data.id], ...msg.data.newAttrs };
             }
         } else if (msg.name === 'remove-shape') {
             delete loadedShapes[msg.data.id];
         } else if (msg.name === 'clear-shapes') {
             // If history includes clear, start fresh from that point (simplistic approach)
             // A more robust approach might track clears differently
             Object.keys(loadedShapes).forEach(key => delete loadedShapes[key]);
         }
      });
      console.log("Loaded shapes from history:", loadedShapes);
      setShapes(loadedShapes);
    });

    // --- Unsubscribe on cleanup ---
    return () => shapesChannel.unsubscribe(handleRemoteEvent);
  }, [shapesChannel, selectedShapeId]); // Added selectedShapeId dependency


  // --- Local Actions (which will publish to others) ---

  const addShape = (shapeConfig) => {
    const id = uuidv4();
    const newShape = {
      id,
      ...shapeConfig,
    };

    // Optimistic update locally
    setShapes(prev => ({ ...prev, [id]: newShape }));
    // Publish the new shape data
    shapesChannel?.publish('new-shape', newShape);
  };

  const updateShape = (id, newAttrs) => {
    // Optimistic update locally
    setShapes(prev => ({
      ...prev,
      [id]: prev[id] ? { ...prev[id], ...newAttrs } : prev[id], // Only update if shape exists
    }));

    // Publish only the ID and the changed attributes
    shapesChannel?.publish('update-shape', { id, newAttrs });
  };

  const removeShape = (id) => {
    // Optimistic update locally
    setShapes(prev => {
      const { [id]: _, ...remainingShapes } = prev;
      return remainingShapes;
    });
    setSelectedShapeId(null); // Deselect locally
    // Publish the ID of the shape to remove
    shapesChannel?.publish('remove-shape', { id });
  };

  const clearShapes = () => {
    // Optimistic update locally
    setShapes({});
    setSelectedShapeId(null);
    // Publish the clear event (no extra data needed, maybe sender ID)
    shapesChannel?.publish('clear-shapes', { by: client?.auth.clientId || 'unknown' });
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