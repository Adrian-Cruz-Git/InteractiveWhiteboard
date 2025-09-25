import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
// Route to check if the user is logged in
//If user isn't , then it only displays login a register nav buttons, if they are , then display whiteboard, and settings
// Need to protect the routes so users cant manually go there. in the url adding /whiteboard or /settings


const ProtectedRoute = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
