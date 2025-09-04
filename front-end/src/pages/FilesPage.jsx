import { useState } from "react";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";

function FilesPage() {
    const [token, setToken] = useState(null);

    return (
        <div>
            {!token ? (
                <p>You need to login first to access files.</p>
            ) : (
                <>
                    <FileUpload token={token} refreshFiles={() => {}} />
                    <FileList token={token} />
                </>
            )}
        </div>
    );
}

export default FilesPage;
