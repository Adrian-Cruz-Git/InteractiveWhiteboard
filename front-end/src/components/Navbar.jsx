
import "./Navbar.css";

//Nav bar for whiteboard componnet (new board button)

function Navbar({ boards, activeBoard, onSelectBoard, onAddBoard }) {
    return (
        <nav className="navbar">
            {boards.map((board) => (
                <button
                    key={board.id}
                    onClick={() => onSelectBoard(board.id)}
                    className={activeBoard === board.id ? "active" : ""}
                >
                    Board {board.id}
                </button>
            ))}
            <button onClick={onAddBoard} className="new-board">New Board</button>
        </nav>
    );
}
export default Navbar;