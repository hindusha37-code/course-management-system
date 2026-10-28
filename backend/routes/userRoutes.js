
const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getUserByUsername,
  getUserById,
} = require("../controllers/userController");

// Authentication is already applied in server.js:
// app.use("/api/users", authMiddleware, userRoutes);

// Self-service profile endpoints
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.put("/me/password", changeMyPassword);

// Restricted user lookup endpoints.
// Authorization is enforced inside the controller.
router.get("/username/:username", getUserByUsername);
router.get("/:id", getUserById);

module.exports = router;
