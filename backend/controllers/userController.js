
const User = require("../models/userModel");
const {
  hashPassword,
  verifyPassword,
  validatePasswordLength,
} = require("../helpers/hashPassword");

// In-memory failed password-attempt tracking.
// Threshold: 5 failed attempts per user within a 15-minute window.
const failedAttempts = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getAuthenticatedUser(req) {
  return req.user || null;
}

function isAdmin(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

function canAccessUser(req, targetUser) {
  const currentUser = getAuthenticatedUser(req);

  if (!currentUser || !targetUser) {
    return false;
  }

  return (
    String(currentUser.id) === String(targetUser.id) ||
    isAdmin(currentUser)
  );
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
  };
}

function getFailureRecord(userId) {
  const now = Date.now();
  let record = failedAttempts.get(String(userId));

  if (!record || now - record.startedAt >= WINDOW_MS) {
    record = { count: 0, startedAt: now };
    failedAttempts.set(String(userId), record);
  }

  return record;
}


// GET /api/users/me
const getMyProfile = async (req, res) => {
  try {
    const currentUser = getAuthenticatedUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = await User.findById(currentUser.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Error retrieving own profile");

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// PUT /api/users/me
const updateMyProfile = async (req, res) => {
  try {
    const currentUser = getAuthenticatedUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const body = req.body || {};

    // Reject attempts to modify protected fields.
    if (
      Object.prototype.hasOwnProperty.call(body, "username") ||
      Object.prototype.hasOwnProperty.call(body, "role") ||
      Object.prototype.hasOwnProperty.call(body, "id")
    ) {
      return res.status(400).json({
        message: "Only full_name can be changed",
      });
    }

    if (typeof body.full_name !== "string") {
      return res.status(400).json({
        message: "Full name must be a string",
        errors: {
          full_name: "Full name is required",
        },
      });
    }

    const fullName = body.full_name.trim();

    if (fullName.length < 3 || fullName.length > 100) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          full_name: "Full name must be between 3 and 100 characters",
        },
      });
    }

    const updatedUser = await User.updateFullName(
      currentUser.id,
      fullName
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Keep the authenticated user object in sync where possible.
    req.user.full_name = updatedUser.full_name;

    return res.status(200).json({
      message: "Profile updated successfully",
      user: publicUser(updatedUser),
    });
  } catch (error) {
    console.error("Error updating profile");

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// PUT /api/users/me/password
const changeMyPassword = async (req, res) => {
  try {
    const currentUser = getAuthenticatedUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { currentPassword, newPassword, confirmPassword } =
      req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({
        message: "All password fields are required",
        errors: {
          currentPassword: "Current password is required",
          newPassword: "New password is required",
          confirmPassword: "Password confirmation is required",
        },
      });
    }

    const record = getFailureRecord(currentUser.id);

    if (record.count >= MAX_FAILED_ATTEMPTS) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(
          (WINDOW_MS - (Date.now() - record.startedAt)) / 1000
        )
      );

      res.set("Retry-After", String(retryAfterSeconds));

      return res.status(429).json({
        message: "Too many failed password attempts. Try again later.",
      });
    }

    const user = await User.findByIdWithPassword(currentUser.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const currentPasswordIsValid = await verifyPassword(
      currentPassword,
      user.password
    );

    if (!currentPasswordIsValid) {
      record.count += 1;

      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // Reset failed attempts after successful verification.
    failedAttempts.delete(String(currentUser.id));

    if (!validatePasswordLength(newPassword)) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          newPassword:
            "Password must contain at least 8 characters and must not exceed 72 UTF-8 bytes",
        },
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          confirmPassword: "Passwords do not match",
        },
      });
    }

    const sameAsOldPassword = await verifyPassword(
      newPassword,
      user.password
    );

    if (sameAsOldPassword) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          newPassword:
            "New password must be different from the current password",
        },
      });
    }

    const newHash = await hashPassword(newPassword);

    await User.updatePassword(currentUser.id, newHash);

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    // Never log passwords or password hashes.
    console.error("Error changing password");

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// GET /api/users/username/:username
const getUserByUsername = async (req, res) => {
  try {
    const currentUser = getAuthenticatedUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = await User.findByUsername(req.params.username);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!canAccessUser(req, user)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      message: "User found",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Error finding user by username");

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const currentUser = getAuthenticatedUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!canAccessUser(req, user)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      message: "User found",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Error finding user by ID");

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getUserByUsername,
  getUserById,
};
