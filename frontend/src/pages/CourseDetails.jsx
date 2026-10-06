import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams
} from "react-router-dom";

import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt
} from "react-icons/fa";

import api from "../services/api";
import {
  isLoggedIn,
  isStudent,
  isAdmin
} from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function CourseDetails() {

  const { id } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [enrolling, setEnrolling] = useState(false);

  // Current enrollment state for this course.
  const [enrolled, setEnrolled] = useState(false);

  // Login state
  const loggedIn = isLoggedIn();
  const studentLoggedIn = isStudent();
  const adminLoggedIn = isAdmin();


  // =========================================================
  // Load course and enrollment state
  // =========================================================

  useEffect(() => {

    const getCourseAndEnrollmentState = async () => {

      try {

        setLoading(true);
        setError("");

        // Load course
        const courseResponse =
          await api.get(`/courses/${id}`);

        setCourse(courseResponse.data.course);


        /*
         * Check whether the logged-in student currently has
         * an enrollment for this course.
         *
         * /enrollments/my is already protected by the backend.
         */
        if (studentLoggedIn) {

          try {

            const enrollmentResponse =
              await api.get("/enrollments/my");

            const myEnrollments =
              enrollmentResponse.data.enrollments || [];

            const currentlyEnrolled =
              myEnrollments.some(
                (enrollment) =>
                  String(enrollment.course_id) ===
                  String(id)
              );

            setEnrolled(currentlyEnrolled);

          } catch (enrollmentError) {

            console.error(
              "Error checking enrollment state:",
              enrollmentError
            );

            /*
             * Course can still be displayed even if the
             * enrollment state cannot be loaded.
             */
            setEnrolled(false);
          }

        } else {

          setEnrolled(false);

        }

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load course"
        );

      } finally {

        setLoading(false);

      }

    };

    getCourseAndEnrollmentState();

  }, [id, studentLoggedIn]);


  // =========================================================
  // Enroll
  // =========================================================

  const handleEnroll = async () => {

    setError("");
    setSuccess("");
    setEnrolling(true);

    try {

      const response =
        await api.post("/enrollments", {
          courseId: id,
        });

      setSuccess(
        response.data.message ||
        "Course enrollment successful."
      );

      /*
       * Update the state immediately.
       *
       * The page does not need to reload.
       */
      setEnrolled(true);

    } catch (error) {

      if (error.response?.status === 409) {

        setEnrolled(true);

        setError(
          "You are already enrolled in this course. You can see it in My Enrollments."
        );

      } else {

        setError(
          error.response?.data?.message ||
          "Enrollment failed. Please try again."
        );

      }

    } finally {

      setEnrolling(false);

    }

  };


  // =========================================================
  // Loading
  // =========================================================

  if (loading) {

    return (
      <>
        <Navbar />

        <div className="container">
          <p className="loading">
            Loading course...
          </p>
        </div>

        <Footer />
      </>
    );

  }


  // =========================================================
  // Course not found
  // =========================================================

  if (error && !course) {

    return (
      <>
        <Navbar />

        <div className="container">

          <p className="error">
            {error}
          </p>

          <div className="center-actions">

            <Link
              to="/courses"
              className="btn btn-primary"
            >
              Back to Courses
            </Link>

          </div>

        </div>

        <Footer />
      </>
    );

  }


  // =========================================================
  // Main page
  // =========================================================

  return (

    <>
      <Navbar />

      <div className="container">

        {/* Breadcrumb */}

        <p className="breadcrumb">

          <Link to="/courses">
            Courses
          </Link>

          <span> / </span>

          <span>
            {course.title}
          </span>

        </p>


        <div className="details-layout">

          {/* ===============================================
              Course image
          =============================================== */}

          <div className="details-image-wrapper">

            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />

          </div>


          {/* ===============================================
              Course information
          =============================================== */}

          <div className="details-info">

            <div className="course-card-tags">

              <span className="tag tag-category">
                {course.category}
              </span>

              <span className="tag tag-level">
                {course.level}
              </span>

            </div>


            <h1>
              {course.title}
            </h1>


            <p className="details-description">
              {course.description}
            </p>


            <dl className="details-list">

              <div>
                <dt>Category</dt>
                <dd>{course.category}</dd>
              </div>

              <div>
                <dt>Level</dt>
                <dd>{course.level}</dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>{course.duration}</dd>
              </div>

              <div>
                <dt>Price</dt>
                <dd className="details-price">
                  Rs. {course.price}
                </dd>
              </div>

            </dl>


            {/* =============================================
                Messages
            ============================================= */}

            {success && (
              <p className="success">
                {success}
              </p>
            )}

            {error && (
              <p className="error">
                {error}
              </p>
            )}


            {/* =============================================
                Action area
            ============================================= */}

            <div className="details-actions">


              {/* ===========================================
                  Visitor
              =========================================== */}

              {!loggedIn && (

                <div className="notice">

                  <p>
                    Please login as a student to enroll
                    in this course.
                  </p>

                  <Link
                    to="/login"
                    state={{
                      from: location.pathname
                    }}
                    className="btn btn-primary"
                  >
                    <FaSignInAlt />
                    Login to Enroll
                  </Link>

                </div>

              )}


              {/* ===========================================
                  Student
              =========================================== */}

              {studentLoggedIn && (

                <>

                  {enrolled ? (

                    /*
                     * The student is currently enrolled.
                     * Do not show Enroll Now.
                     */
                    <div className="enrollment-state">

                      <p className="success">
                        You are currently enrolled
                        in this course.
                      </p>

                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >
                        <FaGraduationCap />
                        My Enrollments
                      </Link>

                    </div>

                  ) : (

                    /*
                     * No active enrollment exists.
                     *
                     * This is also what the student sees
                     * after cancelling an enrollment.
                     */
                    <>

                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        <FaShoppingCart />

                        {enrolling
                          ? "Enrolling..."
                          : "Enroll Now"}
                      </button>

                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >
                        <FaGraduationCap />
                        My Enrollments
                      </Link>

                    </>

                  )}

                </>

              )}


              {/* ===========================================
                  Admin
              =========================================== */}

              {adminLoggedIn && (

                <div className="notice">

                  <p>
                    You are logged in as an administrator.
                    Only students can enroll in courses.
                  </p>

                  <Link
                    to="/admin/courses"
                    className="btn btn-primary"
                  >
                    <FaChartBar />
                    Manage Courses
                  </Link>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      <Footer />

    </>

  );
}

export default CourseDetails;
