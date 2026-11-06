
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaChartBar,
  FaSearch,
  FaUsers
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AdminDashboard() {
  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0
  });

  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, enrollmentsResponse] =
          await Promise.all([
            api.get("/courses/stats"),
            api.get("/enrollments", {
              params: { limit: 100 }
            })
          ]);

        setStats({
          courseCount: statsResponse.data.courseCount,
          studentCount: statsResponse.data.studentCount
        });

        setEnrollments(
          enrollmentsResponse.data.enrollments || []
        );
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const approvedEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "approved"
  );

  const pendingEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "pending"
  );

  const rejectedEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "rejected"
  );

  const uniqueStudents = new Set(
    approvedEnrollments.map(
      (enrollment) => enrollment.student_id
    )
  ).size;

  const recentEnrollments = enrollments.slice(0, 6);

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString();
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>

            <p className="page-subtitle">
              Welcome back,{" "}
              {user?.full_name || user?.username}.
              Here is an overview of the system.
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

        {error && <p className="error">{error}</p>}

        {/* Dashboard counters */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : stats.courseCount}
            </span>

            <span className="dashboard-card-label">
              Total Courses
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : stats.studentCount}
            </span>

            <span className="dashboard-card-label">
              Total Students
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : approvedEnrollments.length}
            </span>

            <span className="dashboard-card-label">
              Approved Enrollments
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : pendingEnrollments.length}
            </span>

            <span className="dashboard-card-label">
              Pending Requests
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : rejectedEnrollments.length}
            </span>

            <span className="dashboard-card-label">
              Rejected Requests
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : uniqueStudents}
            </span>

            <span className="dashboard-card-label">
              Students with Approved Enrollments
            </span>
          </div>
        </div>

        {/* Recent enrollment requests */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollment Requests</h2>

            <Link
              to="/admin/enrollments"
              className="link-inline"
            >
              Manage enrollments
            </Link>
          </div>

          {loading && (
            <p className="loading">Loading...</p>
          )}

          {!loading &&
            recentEnrollments.length === 0 && (
              <p className="empty">
                No enrollment requests found.
              </p>
            )}

          {!loading &&
            recentEnrollments.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Username</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Requested On</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentEnrollments.map(
                      (enrollment) => (
                        <tr key={enrollment.id}>
                          <td>{enrollment.full_name}</td>

                          <td>{enrollment.username}</td>

                          <td>{enrollment.title}</td>

                          <td>
                            <span
                              className={`enrollment-status ${enrollment.status}`}
                            >
                              {enrollment.status}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              enrollment.enrolled_at
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        {/* Administration */}
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
                Review, approve and reject enrollment requests
              </span>
            </Link>

            <Link
              to="/courses"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaSearch />
              </span>

              <span>See the public course list</span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default AdminDashboard;
