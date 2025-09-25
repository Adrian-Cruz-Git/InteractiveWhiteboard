
import FileSystem from "../components/FileSystem";
import FileUpload from "../components/FileUpload";
import Topnav from "../components/TopNav";

export default function FilesPage() {
  return (
    <div className="p-4">
      <Topnav />
      <h2 className="text-xl font-bold mb-4">Your Files</h2>
      <FileSystem />
    </div>
  );
}


