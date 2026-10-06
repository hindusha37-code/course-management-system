const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

// =========================================================
// Enroll in a course
// =========================================================

const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Logged-in student's ID comes from authentication.
    const studentId = req.user.id;

    // Check course ID
    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Check whether course exists
    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Check whether student is already enrolled
    const existingEnrollment =
      await Enrollment.findByStudentAndCourse(
        studentId,
        courseId
      );

    if (existingEnrollment) {
      return res.status(409).json({
        message: "You are already enrolled in this course",
      });
    }

    // Create enrollment
    const enrollmentId = await Enrollment.create(
      studentId,
      courseId
    );

    return res.status(201).json({
      message: "Course enrollment successful",
      enrollmentId,
    });

  } catch (error) {
    console.error(
      "Error enrolling in course:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// =========================================================
// Get logged-in student's courses
// =========================================================

const getMyEnrollments = async (req, res) => {
  try {
    // IMPORTANT:
    // Student identity comes from authenticated request.
    const studentId = req.user.id;

    const enrollments =
      await Enrollment.getByStudent(studentId);

    return res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting student enrollments:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// =========================================================
// Student: Cancel own enrollment
// =========================================================

const cancelMyEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    // IMPORTANT SECURITY REQUIREMENT:
    // Never accept studentId from req.body, query string,
    // or another client-controlled value.
    const studentId = req.user.id;

    // Validate enrollment ID.
    //
    // This project uses MySQL auto-increment IDs, so the ID
    // must be a positive integer.
    if (!/^\d+$/.test(String(id)) || Number(id) <= 0) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    const enrollmentId = Number(id);

    /*
     * The model checks BOTH:
     *
     *   enrollment ID
     *   logged-in student ID
     *
     * Therefore a student cannot delete another student's
     * enrollment.
     */
    const result = await Enrollment.deleteByStudent(
      enrollmentId,
      studentId
    );

    /*
     * affectedRows === 0 can mean:
     *
     * 1. The enrollment does not exist.
     * 2. The enrollment belongs to another student.
     *
     * Both cases intentionally return 404.
     *
     * This prevents exposing whether another student's
     * enrollment exists.
     */
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      message: "Enrollment cancelled successfully",
    });

  } catch (error) {
    console.error(
      "Error cancelling student enrollment:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// =========================================================
// Admin: Get students enrolled in a course
// =========================================================

const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check whether course exists
    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const enrollments =
      await Enrollment.getByCourse(courseId);

    return res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting course enrollments:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// =========================================================
// Admin: Get all enrollments
// =========================================================

const getAllEnrollments = async (req, res) => {
  try {
    const enrollments =
      await Enrollment.getAll();

    return res.status(200).json({
      message: "All enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting all enrollments:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// =========================================================
// Admin: Delete enrollment
// =========================================================

const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    // Existing admin deletion remains unchanged.
    const result =
      await Enrollment.delete(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      message: "Enrollment deleted successfully",
    });

  } catch (error) {
    console.error(
      "Error deleting enrollment:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
};
