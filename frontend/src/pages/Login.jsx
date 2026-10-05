import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaSignInAlt } from "react-icons/fa";

import api from "../services/api";
import { saveAuth } from "../services/auth";
import Navbar from "../components/Navbar";

function Login() {

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const navigate = useNavigate();
const location = useLocation();

// --------------------------------------------------
// Check whether the user arrived because their
// previous authentication session expired.
// --------------------------------------------------
const searchParams = new URLSearchParams(location.search);

const sessionExpired =
searchParams.get("sessionExpired") === "true";

// Original page preserved by the Axios interceptor.
const fromQuery = searchParams.get("from");

// Existing React Router state can also contain a
// destination.
const fromState = location.state?.from;

const redirectTo =
fromQuery ||
fromState ||
null;

// --------------------------------------------------
// Display session-expired message
// --------------------------------------------------
useEffect(() => {

if (sessionExpired) {

  setError(
    "Your session has expired. Please log in again."
  );

}


}, [sessionExpired]);

const handleSubmit = async (event) => {

event.preventDefault();

setError("");


// Simple client-side validation
if (!username.trim() || !password) {

  setError(
    "Please enter both username and password."
  );

  return;
}


setLoading(true);


try {

  const response = await api.post("/auth/login", {
    username,
    password,
  });


  // Save the newly issued JWT and user.
  saveAuth(
    response.data.token,
    response.data.user
  );


  // --------------------------------------------------
  // Return to the page that originally required login.
  // --------------------------------------------------
  if (
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("/login")
  ) {

    navigate(redirectTo, {
      replace: true,
    });

  } else {

    // Normal login destination
    const role = response.data.user.role;

    if (role === "admin") {

      navigate("/admin", {
        replace: true,
      });

    } else {

      navigate("/student", {
        replace: true,
      });

    }
  }

} catch (error) {

  // --------------------------------------------------
  // Login request 401
  // --------------------------------------------------
  // The Axios interceptor intentionally ignores this
  // 401 so that it reaches this catch block..
  // --------------------------------------------------
  if (error.response?.status === 401) {

    setError(
      "Invalid username or password"
    );

  } else if (error.response) {

    setError(
      error.response.data?.message ||
      `Login failed (status ${error.response.status})`
    );

  } else {

    // Network failure
    setError(
      "Cannot reach the server. Please check that the backend is running on http://localhost:3000"
    );
  }

} finally {

  setLoading(false);

}


};

return (

<>
  <Navbar />

  <div className="login-container">

    <h1>Login</h1>

    <p className="login-subtitle">
      Sign in to enroll in courses.
    </p>


    <form onSubmit={handleSubmit}>

      <div className="form-group">

        <label htmlFor="username">
          Username
        </label>

        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) =>
            setUsername(event.target.value)
          }
          placeholder="Enter username"
          autoComplete="username"
          disabled={loading}
        />

      </div>


      <div className="form-group">

        <label htmlFor="password">
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="Enter password"
          autoComplete="current-password"
          disabled={loading}
        />

      </div>


      {error && (
        <p className="error">
          {error}
        </p>
      )}


      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={loading}
      >

        <FaSignInAlt />

        {loading
          ? "Logging in..."
          : "Login"}

      </button>

    </form>


    <p className="login-footer">

      Not sure where to go?{" "}

      <Link to="/courses">
        <FaSearch /> Browse the courses
      </Link>{" "}

      first.

    </p>

  </div>

</>


);
}

export default Login;