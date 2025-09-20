import './toolbar.css';
import cursorIcon from '../assets/cursor.png';
import penIcon from '../assets/pen.png';
import highlightIcon from '../assets/highlight.png';
import eraserIcon from '../assets/eraser.png';
import stickyNoteIcon from '../assets/stickyNote.png';
import shapesIcon from '../assets/shapes.png';
import textIcon from '../assets/text.png';
import imageIcon from '../assets/image.png';
import undoIcon from '../assets/undo.png';
import redoIcon from '../assets/redo.png';


export default function Toolbar({ activeTool, setActiveTool }) {
    return (
        <div className="toolbar">
            <button onClick={() => setActiveTool('cursor')} // CURSOR BUTTON
                title="Cursor" // tooltip - shows on hover the name of the button
                aria-label="Cursor" // accessibility - screen readers will read this label
            >
                <img src={cursorIcon} alt="Cursor" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // PEN BUTTON
                onClick={() => setActiveTool("pen")}
                title="Pen" 
                aria-label="Pen" 
            >
                <img src={penIcon} alt="Pen" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // HIGHLIGHTER BUTTON
                onClick={() => setActiveTool("highlighter")} 
                title="Highlighter" 
                aria-label="Highlighter" 
            >   
                <img src={highlightIcon} alt="Highlighter" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // ERASER BUTTON
                onClick={() => setActiveTool("eraser")} 
                title="Eraser" 
                aria-label="Eraser" 
            >
                <img src={eraserIcon} alt="Eraser" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // STICKY NOTE BUTTON
                onClick={() => setActiveTool("stickyNote")} 
                title="Sticky Note" 
                aria-label="Sticky Note" 
            >   
                <img src={stickyNoteIcon} alt="Sticky Note" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // SHAPES BUTTON
                onClick={() => setActiveTool("shapes")}
                title="Shapes" 
                aria-label="Shapes" 
            >   
                <img src={shapesIcon} alt="Shapes" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // TEXT BUTTON
                onClick={() => setActiveTool("text")}
                title="Text"
                aria-label="Text"
            >
                <img src={textIcon} alt="Text" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // IMAGE BUTTON
                onClick={() => setActiveTool("image")}
                title="Image"
                aria-label="Image"
            >
                <img src={imageIcon} alt="Image" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // UNDO BUTTON
                title="Undo"
                aria-label="Undo"
            >
                <img src={undoIcon} alt="Undo" style={{ width: '25px', height: '25px' }} />
            </button>
            <button // REDO BUTTON
                title="Redo"
                aria-label="Redo"
            >
                <img src={redoIcon} alt="Redo" style={{ width: '25px', height: '25px' }} />
            </button>
        </div> 
    )
}