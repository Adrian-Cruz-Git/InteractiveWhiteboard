import './toolbar.css';
import cursorIcon from '../assets/cursor.png';
import penIcon from '../assets/pen.png';
import highlightIcon from '../assets/highlight.png';

export default function Toolbar(){
    return(
        <div className="toolbar">
            <button>
                <img src={cursorIcon} alt="Cursor" style={{ width: '32px', height: '32px' }} />
            </button>
            <button>
                <img src={penIcon} alt="Pen" style={{ width: '32px', height: '32px' }} />
            </button>
            <button>
                <img src={highlightIcon} alt="Highlighter" style={{ width: '32px', height: '32px' }} />
            </button>
            <button>Eraser</button>
            <button>Sticky Note</button>
            <button>Shape</button>
            <button>Text</button>
            <button>Image</button>
        </div>
    )
}