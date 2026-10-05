import axios from "axios";
import { clearAuth, getToken } from "./auth";

const api = axios.create({
baseURL: "http://localhost:3000/api",
});

// Prevent multiple simultaneous 401 responses
// from causing multiple redirects.
let isRedirectingToLogin = false;

// Add JWT token to requests
api.interceptors.request.use(
(config) => {

const token = getToken();

if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}

return config;


},

(error) => {
return Promise.reject(error);
}
);

// Global authentication error handling
api.interceptors.response.use(

// Successful response
(response) => {
return response;
},

// Failed response
(error) => {

// --------------------------------------------------
// Network error
// --------------------------------------------------
// No response means the request did not receive an
// HTTP response from the server.
//
// IMPORTANT:
// Do not clear authentication data or redirect.
// --------------------------------------------------
if (!error.response) {
  return Promise.reject(error);
}


const status = error.response.status;
const requestUrl = error.config?.url || "";


// --------------------------------------------------
// Login request
// --------------------------------------------------
// A 401 from /auth/login means the username/password
// is incorrect. It must NOT trigger session-expiry
// handling.
// --------------------------------------------------
const isLoginRequest =
  requestUrl.includes("/auth/login");


if (status === 401 && isLoginRequest) {
  return Promise.reject(error);
}


// --------------------------------------------------
// Authenticated request returning 401
// --------------------------------------------------
if (status === 401) {

  const token = getToken();


  // Only treat the 401 as session expiry when there
  // is an existing authentication token.
  if (token && !isRedirectingToLogin) {

    isRedirectingToLogin = true;


    // Preserve the page the user was attempting to
    // access.
    const currentPath =
      window.location.pathname +
      window.location.search +
      window.location.hash;


    // Clear invalid authentication information.
    clearAuth();


    // Redirect to Login and pass the original page
    // plus a session-expired flag.
    window.location.replace(
      `/login?sessionExpired=true&from=${encodeURIComponent(
        currentPath
      )}`
    );
  }
}


// --------------------------------------------------
// HTTP 403
// --------------------------------------------------
// Do NOT clear authentication data.
// Do NOT redirect to Login.
//
// The component/page receiving this error can display
// its appropriate access-denied message...
// --------------------------------------------------

return Promise.reject(error);


}
);

export default api;