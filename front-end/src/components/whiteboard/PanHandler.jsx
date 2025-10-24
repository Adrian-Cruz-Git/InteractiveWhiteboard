import { useEffect, useRef } from "react";
import { useView } from "./ViewContext";

//This component enables panning of the whiteboard when the active tool is "cursor"
//It listens for mouse events on the boardRef element and adjusts SCROLL position accordingly
//Uses view and setView to update global view state for zooming and panning
//Uses camera movement instead of DOM Manipulation for better performance and compatibility with zooming

export default function PanHandler({ boardRef, activeTool }) {  // receives boardRef and activeTool as properties
    const { view, setView } = useView();
    const frameRef = useRef(null);
    const lastViewRef = useRef(view);

    useEffect(() => {
        lastViewRef.current = view;
    }, [view]);

    useEffect(() => {
        const board = boardRef?.current; // get the current board element
        if (!board) return; // if no board, exit

        // Initialize variables to track dragging state and positions
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startOffsetX = 0;
        let startOffsetY = 0;


        // Mouse down event to start dragging
        const handleMouseDown = (e) => {
            if (activeTool !== "cursor") return; // only allow panning if the active tool is "cursor"

            isDragging = true; // alert handleMousemove to start changing position of the scroll bar
            startX = e.clientX;
            startY = e.clientY;
            startOffsetX = view.offsetX;
            startOffsetY = view.offsetY;
            board.style.cursor = "grabbing"; // change cursor to grabbing to alert other users
            document.body.style.userSelect = "none"; // prevent text selection while dragging
        };

        // Mouse move event to handle dragging
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const PAN_SPEED = 0.6; // lower = slower movement
            const dx = ((e.clientX - startX) * PAN_SPEED) / lastViewRef.current.scale;
            const dy = ((e.clientY - startY) * PAN_SPEED) / lastViewRef.current.scale;


            cancelAnimationFrame(frameRef.current);
            frameRef.current = requestAnimationFrame(() => {
                setView((prev) => ({
                    ...prev,
                    offsetX: startOffsetX + dx,
                    offsetY: startOffsetY + dy,
                }));
            });
        };

        // Set stop dragging to false
        const stopDragging = () => {
            isDragging = false; // alert handleMousemove to stop dragging
            board.style.cursor = activeTool === "cursor" ? "grab" : "default";
            document.body.style.userSelect = "auto";
        };

        // Function to handle zooming with the mouse wheel 

        const handleWheel = (e) => {
            if (e.ctrlKey) return;
            e.preventDefault();

            cancelAnimationFrame(frameRef.current);
            frameRef.current = requestAnimationFrame(() => {
                const zoomSpeed = 0.0015;
                const newScale = Math.min(
                    3,
                    Math.max(0.3, lastViewRef.current.scale - e.deltaY * zoomSpeed * lastViewRef.current.scale)
                );

                const rect = board.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                const worldX = (mx - lastViewRef.current.offsetX) / lastViewRef.current.scale;
                const worldY = (my - lastViewRef.current.offsetY) / lastViewRef.current.scale;

                setView({
                    scale: newScale,
                    offsetX: mx - worldX * newScale,
                    offsetY: my - worldY * newScale,
                });
            });
        };


        // Attach event listeners to listen for mouse events
        board.addEventListener("mousedown", handleMouseDown); // for panning when mouse is pressed
        board.addEventListener("mousemove", handleMouseMove); // for handling panning when mouse is moved
        window.addEventListener("mouseup", stopDragging); // to stop panning when mouse is released
        board.addEventListener("wheel", handleWheel, { passive: false }); // for zooming


        return () => {
            cancelAnimationFrame(frameRef.current);
            board.removeEventListener("mousedown", handleMouseDown);
            board.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", stopDragging);
            board.removeEventListener("wheel", handleWheel);
        };
    }, [boardRef, activeTool, setView]);

    return null; // This component does not render anything
}




