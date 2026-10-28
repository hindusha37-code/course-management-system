
import { Navigate, useLocation } from "react-router-dom";
import { getUser, getToken } from "../services/auth";

function ProtectedRoute({ children, role }) {
  const location = useLocation();
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (role && user.role !== role) {
    const fallback =
      user.role === "admin" ? "/admin" : "/student";

    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default ProtectedRoute;
