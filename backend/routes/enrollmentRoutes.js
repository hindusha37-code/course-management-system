
const express = require("express");

const router = express.Router();

const {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment
} = require("../controllers/enrollmentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Student: submit enrollment request.
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["student"]),
  enrollInCourse
);

// Student: view own enrollment requests.
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMyEnrollments
);

// Admin: view all enrollment requests.
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEnrollments
);

// Admin: view enrollments by course.
router.get(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getCourseEnrollments
);

// Admin: approve or reject enrollment.
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateEnrollmentStatus
);

// Admin: delete enrollment.
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEnrollment
);

module.exports = router;
