import FileSystem from "../components/FileSystem";
import FileUpload from "../components/FileUpload";

export default function FilesPage() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Files</h2>
      <FileUpload />
      <FileSystem />
    </div>
  );
}