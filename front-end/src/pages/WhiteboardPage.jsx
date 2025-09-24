import { useParams } from "react-router-dom";
import Whiteboard from "../components/Whiteboard";

export default function WhiteboardPage() {
  // Grab file_id from the route
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Whiteboard</h2>
      {/* Pass fileId as a prop to Whiteboard */}
      <Whiteboard fileId={id} />
    </div>
  );
}
