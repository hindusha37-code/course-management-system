import { Navigate, useLocation } from "react-router-dom";

import { getUser, getToken } from "../services/auth";

function ProtectedRoute({ children, role }) {

const location = useLocation();

const token = getToken();
const user = getUser();

// --------------------------------------------------
// 1. User is not logged in ............
// --------------------------------------------------
if (!token || !user) {

return (
  <Navigate
    to="/login"
    state={{
      from:
        location.pathname +
        location.search +
        location.hash,
    }}
    replace
  />
);


}

// --------------------------------------------------
// 2. User is logged in but does not have the
// required role.
//
// IMPORTANT:
// Do NOT clear authentication.
// Do NOT redirect to another role's dashboard.
// --------------------------------------------------
if (role && user.role !== role) {

return (
  <div className="access-denied">

    <h1>Access Denied</h1>

    <p>
      Access denied. You do not have permission
      to access this page.
    </p>

  </div>
);


}

// --------------------------------------------------
// 3. User is authenticated and authorized.
// --------------------------------------------------
return children;
}

export default ProtectedRoute;