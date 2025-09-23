import FileSystem from "../components/FileSystem";
import { useAuth } from "../contexts/useAuth";

export default function FilesPage() {
  const { currentUser } = useAuth();
  if (!currentUser) return <p>You need to log in to access files.</p>;
  return <FileSystem />;
}