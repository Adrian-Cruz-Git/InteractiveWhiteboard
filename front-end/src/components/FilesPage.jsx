import { useState } from "react";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";
import { useAuth } from "../contexts/AuthContext";

function FilesPage() {
  const { currentUser } = useAuth(); // comes from AuthProvider
  const [refresh, setRefresh] = useState(false);

  if (!currentUser) {
    return <p>You need to log in to access files.</p>;
  }

  return (
    <div>
      <h1>My Files</h1>
      <FileUpload
        token={currentUser.accessToken} // or await currentUser.getIdToken()
        refreshFiles={() => setRefresh(!refresh)}
      />
      <FileList token={currentUser.accessToken} key={refresh} />
    </div>
  );
}

export default FilesPage;