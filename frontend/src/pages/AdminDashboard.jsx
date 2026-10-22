
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaChartBar,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMPTY_REPORT = {
  totalCourses: 0,
  totalStudents: 0,
  totalEnrollments: 0,
  studentsWithEnrollments: 0,
  enrollmentsLast30Days: 0,
  enrollmentsByCategory: [],
  topCourses: [],
  coursesWithoutEnrollments: 0,
};

function AdminDashboard() {
  const [report, setReport] = useState(EMPTY_REPORT);
  const [enrollments, setEnrollments] = useState([]);

  const [reportLoading, setReportLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] =
    useState(true);

  const [reportError, setReportError] = useState("");
  const [enrollmentsError, setEnrollmentsError] = useState("");

  const user = getUser();

  useEffect(() => {
    let active = true;

    // Load dashboard statistics
    const loadReport = async () => {
      try {
        const response = await api.get("/reports/overview");

        // IMPORTANT:
        // Your backend returns { message, report: {...} }
        const data =
          response.data?.report ??
          response.data?.overview ??
          response.data;

        if (!active) return;

        // Convert backend response into the format
        // expected by the dashboard components.
        setReport({
          ...EMPTY_REPORT,
          ...data,

          totalCourses: Number(data.totalCourses) || 0,
          totalStudents: Number(data.totalStudents) || 0,
          totalEnrollments: Number(data.totalEnrollments) || 0,

          studentsWithEnrollments:
            Number(data.studentsWithEnrollments) || 0,

          enrollmentsLast30Days:
            Number(data.enrollmentsLast30Days) || 0,

          coursesWithoutEnrollments:
            Number(data.coursesWithoutEnrollments) || 0,

          enrollmentsByCategory: (
            Array.isArray(data.enrollmentsByCategory)
              ? data.enrollmentsByCategory
              : []
          ).map((item) => ({
            ...item,
            category:
              item.category ??
              item.categoryName ??
              "Uncategorized",
            enrollmentCount:
              Number(item.enrollmentCount) || 0,
          })),

          topCourses: (
            Array.isArray(data.topCourses)
              ? data.topCourses
              : []
          ).map((course) => ({
            ...course,
            courseId:
              course.courseId ?? course.id,
            title:
              course.title ??
              course.courseName ??
              "Untitled course",
            category:
              course.category ??
              course.categoryName ??
              "Uncategorized",
            enrollmentCount:
              Number(course.enrollmentCount) || 0,
          })),
        });
      } catch (error) {
        console.error(
          "Admin report error:",
          error.response?.data || error.message
        );

        if (!active) return;

        setReportError(
          error.response?.data?.message ||
            "Unable to load reporting statistics."
        );
      } finally {
        if (active) setReportLoading(false);
      }
    };

    // Load recent enrollment records
    const loadRecentEnrollments = async () => {
      try {
        const response = await api.get("/enrollments?limit=6");

        if (!active) return;

        // Supports either { enrollments: [...] }
        // or a direct array response.
        const data = response.data;

        setEnrollments(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.enrollments)
              ? data.enrollments
              : []
        );
      } catch (error) {
        console.error(
          "Recent enrollments error:",
          error.response?.data || error.message
        );

        if (!active) return;

        setEnrollmentsError(
          error.response?.data?.message ||
            "Unable to load recent enrollments."
        );
      } finally {
        if (active) setEnrollmentsLoading(false);
      }
    };

    loadReport();
    loadRecentEnrollments();

    return () => {
      active = false;
    };
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString();
  };

  const formatNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString()
      : "0";
  };

  const maxCategoryCount = Math.max(
    1,
    ...report.enrollmentsByCategory.map(
      (item) => Number(item.enrollmentCount) || 0
    )
  );

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="page-subtitle">
              Welcome back,{" "}
              {user?.full_name || user?.username || "Admin"}.
              {" "}Here is an overview of the system.
            </p>
          </div>

          <Link
            to="/admin/courses"
            className="btn btn-primary"
          >
            <FaChartBar />
            Manage Courses
          </Link>
        </div>

        {reportError && (
          <p className="error" role="alert">
            {reportError}
          </p>
        )}

        {/* Dashboard statistics */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportLoading
                ? "..."
                : formatNumber(report.totalCourses)}
            </span>
            <span className="dashboard-card-label">
              Total Courses
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportLoading
                ? "..."
                : formatNumber(report.totalStudents)}
            </span>
            <span className="dashboard-card-label">
              Total Students
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportLoading
                ? "..."
                : formatNumber(report.totalEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Total Enrollments
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportLoading
                ? "..."
                : formatNumber(report.studentsWithEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Students With Enrollments
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportLoading
                ? "..."
                : formatNumber(report.enrollmentsLast30Days)}
            </span>
            <span className="dashboard-card-label">
              Enrollments in Last 30 Days
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {reportLoading
                ? "..."
                : formatNumber(report.coursesWithoutEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Courses Without Enrollments
            </span>
          </div>
        </div>

        {/* Enrollments by category */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Enrollments by Category</h2>
          </div>

          {reportLoading && (
            <p className="loading">
              Loading category report...
            </p>
          )}

          {!reportLoading &&
            reportError === "" &&
            report.enrollmentsByCategory.length === 0 && (
              <p className="empty">
                No category enrollment data is available.
              </p>
            )}

          {!reportLoading &&
            report.enrollmentsByCategory.length > 0 && (
              <div className="report-bars">
                {report.enrollmentsByCategory.map(
                  (item, index) => {
                    const count =
                      Number(item.enrollmentCount) || 0;

                    const percentage =
                      (count / maxCategoryCount) * 100;

                    return (
                      <div
                        className="report-bar-item"
                        key={
                          item.categoryId ??
                          item.category ??
                          `category-${index}`
                        }
                      >
                        <div className="report-bar-label">
                          <span>
                            {item.category || "Uncategorized"}
                          </span>
                          <strong>
                            {formatNumber(count)}
                          </strong>
                        </div>

                        <div
                          className="report-bar-track"
                          role="img"
                          aria-label={`${item.category || "Uncategorized"}: ${count} enrollments`}
                        >
                          <div
                            className="report-bar-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </section>

        {/* Top five courses */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Top Five Courses</h2>
          </div>

          {reportLoading && (
            <p className="loading">
              Loading top courses...
            </p>
          )}

          {!reportLoading &&
            reportError === "" &&
            report.topCourses.length === 0 && (
              <p className="empty">
                No course enrollment data is available.
              </p>
            )}

          {!reportLoading &&
            report.topCourses.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Enrollments</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.topCourses
                      .slice(0, 5)
                      .map((course, index) => (
                        <tr
                          key={
                            course.courseId ??
                            course.id ??
                            index
                          }
                        >
                          <td>{index + 1}</td>
                          <td>
                            {course.title || "Untitled course"}
                          </td>
                          <td>
                            {course.category || "Uncategorized"}
                          </td>
                          <td>
                            {formatNumber(
                              course.enrollmentCount
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        {/* Recent enrollments */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollments</h2>

            <Link
              to="/admin/enrollments"
              className="link-inline"
            >
              Manage enrollments
            </Link>
          </div>

          {enrollmentsError && (
            <p className="error" role="alert">
              {enrollmentsError}
            </p>
          )}

          {enrollmentsLoading && (
            <p className="loading">
              Loading recent enrollments...
            </p>
          )}

          {!enrollmentsLoading &&
            enrollments.length === 0 && (
              <p className="empty">
                No recent enrollments are available.
              </p>
            )}

          {!enrollmentsLoading &&
            enrollments.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Username</th>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Level</th>
                      <th>Enrolled On</th>
                    </tr>
                  </thead>

                  <tbody>
                    {enrollments.map((enrollment, index) => (
                      <tr
                        key={
                          enrollment.id ??
                          enrollment.enrollmentId ??
                          index
                        }
                      >
                        <td>
                          {enrollment.full_name || "-"}
                        </td>
                        <td>
                          {enrollment.username || "-"}
                        </td>
                        <td>
                          {enrollment.title ||
                            enrollment.courseName ||
                            "-"}
                        </td>
                        <td>
                          {enrollment.category ||
                            enrollment.categoryName ||
                            "-"}
                        </td>
                        <td>
                          <span className="tag tag-level">
                            {enrollment.level || "-"}
                          </span>
                        </td>
                        <td>
                          {formatDate(enrollment.enrolled_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        {/* Administration shortcuts */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Administration</h2>
          </div>

          <div className="quick-actions">
            <Link
              to="/admin/courses"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaBook />
              </span>
              <span>
                Add, edit and delete courses
              </span>
            </Link>

            <Link
              to="/admin/enrollments"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaUsers />
              </span>
              <span>
                View and remove enrollments
              </span>
            </Link>

            <Link
              to="/courses"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaSearch />
              </span>
              <span>
                See the public course list
              </span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default AdminDashboard;
