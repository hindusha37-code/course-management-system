
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaEye,
  FaGraduationCap,
  FaSearch,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMPTY_REPORT = {
  enrolledCourses: 0,
  distinctCategories: 0,
  earliestEnrollmentDate: null,
  latestEnrollmentDate: null,
  recentEnrollments: [],
};

function StudentDashboard() {
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const response = await api.get("/reports/my");

        // Supports either a direct report object or { report: ... }.
        const data = response.data?.report ?? response.data;

        if (!active) return;

        setReport({
          ...EMPTY_REPORT,
          ...data,
          recentEnrollments: data.recentEnrollments ?? [],
        });
      } catch (error) {
        if (!active) return;

        setError(
          error.response?.data?.message ||
            "Failed to load your learning report. Please try again later."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const formatNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString()
      : "0";
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString();
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Student Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}!
              {" "}Here is your learning activity.
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse Courses
          </Link>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {/* Personal learning statistics */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.enrolledCourses)}
            </span>
            <span className="dashboard-card-label">
              My Enrolled Courses
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.distinctCategories)}
            </span>
            <span className="dashboard-card-label">
              Categories Explored
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value dashboard-card-date">
              {loading
                ? "..."
                : formatDate(report.earliestEnrollmentDate)}
            </span>
            <span className="dashboard-card-label">
              First Enrollment
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value dashboard-card-date">
              {loading
                ? "..."
                : formatDate(report.latestEnrollmentDate)}
            </span>
            <span className="dashboard-card-label">
              Latest Enrollment
            </span>
          </div>
        </div>

        {/* Recent personal enrollments */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>My Recent Enrollments</h2>

            <Link to="/my-enrollments" className="link-inline">
              <FaEye /> View all
            </Link>
          </div>

          {loading && (
            <p className="loading">Loading your learning report...</p>
          )}

          {!loading &&
            !error &&
            report.recentEnrollments.length === 0 && (
              <p className="empty">
                You have not enrolled in any courses yet.
                Browse the courses page to get started.
              </p>
            )}

          {!loading && report.recentEnrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Enrolled On</th>
                  </tr>
                </thead>

                <tbody>
                  {report.recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>
                        <Link to={`/courses/${enrollment.course_id}`}>
                          {enrollment.title || "Untitled course"}
                        </Link>
                      </td>
                      <td>{enrollment.category || "-"}</td>
                      <td>{enrollment.level || "-"}</td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Quick Actions</h2>
          </div>

          <div className="quick-actions">
            <Link to="/courses" className="quick-action">
              <span className="quick-action-icon">
                <FaBook />
              </span>
              <span>Browse all courses</span>
            </Link>

            <Link to="/my-enrollments" className="quick-action">
              <span className="quick-action-icon">
                <FaGraduationCap />
              </span>
              <span>View my enrollments</span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default StudentDashboard;
