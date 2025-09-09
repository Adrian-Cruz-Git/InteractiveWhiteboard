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
    return(
        <div className="toolbar">
            <button onClick={() => setActiveTool('cursor')}>
                <img src={cursorIcon} alt="Cursor" style={{ width: '25px', height: '25px' }} />
            </button>
            <button
                onClick={() => setActiveTool("pen")}
            >
                <img src={penIcon} alt="Pen" style={{ width: '25px', height: '25px' }} />
            </button>
            <button>
                <img src={highlightIcon} alt="Highlighter" style={{ width: '25px', height: '25px' }} />
            </button>
<<<<<<< HEAD
            <button
              onClick={() => {
                window.__WB_ERASE__ = !window.__WB_ERASE__;
                console.log('[Toolbar] eraser click ->', window.__WB_ERASE__ ? 'ON' : 'OFF');
                window.dispatchEvent(new CustomEvent('wb:toggle-erase', { detail: { on: window.__WB_ERASE__ } }));
              }}
              title="Eraser"
              aria-label="Eraser"
            >
              <img src={eraserIcon} alt="Eraser" style={{ width: '25px', height: '25px' }} />
=======
            <button onClick={() => setActiveTool('eraser')}>
                <img src={eraserIcon} alt="Eraser" style={{ width: '25px', height: '25px' }} />
>>>>>>> 199cb7dcbedeefdac2ea8a8746af3c9747a92b38
            </button>
            <button>
                <img src={stickyNoteIcon} alt="Sticky Note" style={{ width: '25px', height: '25px' }} />    
            </button>
            <button>
                <img src={shapesIcon} alt="Shapes" style={{ width: '25px', height: '25px' }} />
            </button>
            <button>
                <img src={textIcon} alt="Text" style={{ width: '25px', height: '25px' }} />
            </button>
            <button>
                <img src={imageIcon} alt="Image" style={{ width: '25px', height: '25px' }} />
            </button>
            <button>
                <img src={undoIcon} alt="Undo" style={{ width: '25px', height: '25px' }} />
            </button>
            <button>
                <img src={redoIcon} alt="Redo" style={{ width: '25px', height: '25px' }} />
            </button>   
        </div>
    )
}