
const TOKEN_KEY = "token";
const USER_KEY = "user";

// IMPORTANT: Your backend server uses port 3000.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Save token and user after login
export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Read token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Read logged-in user
export function getUser() {
  const userJson = localStorage.getItem(USER_KEY);

  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

// Update stored user after profile changes
export function updateStoredUser(updatedUser) {
  const currentUser = getUser();

  if (!currentUser || !updatedUser) return;

  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ ...currentUser, ...updatedUser })
  );
}

// Logout
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken() && getUser());
}

export function getUserRole() {
  return getUser()?.role ?? null;
}

export function isAdmin() {
  return getUserRole() === "admin";
}

export function isStudent() {
  return getUserRole() === "student";
}

// Common API request function
export async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to backend at ${API_BASE_URL}. Check that your backend server is running.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed (${response.status})`
    );

    error.status = response.status;
    error.errors = data.errors || {};
    throw error;
  }

  return data;
}

// Get own profile
export async function getMyProfile() {
  return apiRequest("/users/me");
}

// Update own full name
export async function updateMyProfile(full_name) {
  const data = await apiRequest("/users/me", {
    method: "PUT",
    body: JSON.stringify({ full_name }),
  });

  if (data.user) {
    updateStoredUser(data.user);
  }

  return data;
}

// Change password
export async function changeMyPassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  return apiRequest("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  });
}
