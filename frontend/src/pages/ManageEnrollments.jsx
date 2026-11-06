
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ManageEnrollments() {
  const [courses, setCourses] = useState([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [rejectionReasons, setRejectionReasons] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [processingId, setProcessingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Load courses.
  useEffect(() => {
    const loadCourseOptions = async () => {
      try {
        const response = await api.get("/courses");

        setCourses(response.data.courses || []);
      } catch (error) {
        console.error(
          "Could not load course options:",
          error.message
        );
      }
    };

    loadCourseOptions();
  }, []);

  // Load enrollment requests.
  useEffect(() => {
    const loadEnrollments = async () => {
      setLoading(true);
      setError("");

      try {
        if (selectedCourseId === "") {
          const response = await api.get("/enrollments", {
            params: {
              status: selectedStatus || undefined,
              limit: 100
            }
          });

          setEnrollments(response.data.enrollments || []);
          setSelectedCourse(null);
        } else {
          const response = await api.get(
            `/enrollments/course/${selectedCourseId}`
          );

          let results = response.data.enrollments || [];

          if (selectedStatus) {
            results = results.filter(
              (enrollment) =>
                enrollment.status === selectedStatus
            );
          }

          setEnrollments(results);
          setSelectedCourse(response.data.course);
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load enrollments"
        );

        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, [selectedCourseId, selectedStatus, reloadKey]);

  // Approve or reject.
  const handleStatusUpdate = async (
    enrollment,
    status
  ) => {
    let reason = "";

    if (status === "rejected") {
      reason = (
        rejectionReasons[enrollment.id] || ""
      ).trim();

      if (!reason) {
        setError("Rejection reason is required.");
        return;
      }
    }

    setError("");
    setSuccess("");
    setProcessingId(enrollment.id);

    try {
      const response = await api.patch(
        `/enrollments/${enrollment.id}/status`,
        {
          status,
          reason
        }
      );

      setSuccess(response.data.message);

      setReloadKey((previous) => previous + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Could not update enrollment status."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Delete enrollment.
  const handleDelete = async (enrollment) => {
    const confirmed = window.confirm(
      `Remove ${enrollment.full_name || enrollment.username} ${
        enrollment.title
          ? `from "${enrollment.title}"`
          : ""
      }?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.delete(
        `/enrollments/${enrollment.id}`
      );

      setSuccess(response.data.message);

      setReloadKey((previous) => previous + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Could not delete the enrollment."
      );
    }
  };

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
            <h1>Manage Enrollments</h1>

            <p className="page-subtitle">
              Review pending requests, approve or reject
              enrollment requests, and manage enrollments.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="form-group">
            <label htmlFor="courseFilter">
              Filter by Course
            </label>

            <select
              id="courseFilter"
              className="input"
              value={selectedCourseId}
              onChange={(event) => {
                setSuccess("");
                setSelectedCourseId(event.target.value);
              }}
            >
              <option value="">All Courses</option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="statusFilter">
              Filter by Status
            </label>

            <select
              id="statusFilter"
              className="input"
              value={selectedStatus}
              onChange={(event) => {
                setSuccess("");
                setSelectedStatus(event.target.value);
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <p className="success">{success}</p>
        )}

        {error && (
          <p className="error">{error}</p>
        )}

        {/* Enrollment table */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>
              {selectedCourse
                ? `Enrollments for "${selectedCourse.title}"`
                : "All Enrollment Requests"}

              {!loading && ` (${enrollments.length})`}
            </h2>
          </div>

          {loading && (
            <p className="loading">
              Loading enrollment requests...
            </p>
          )}

          {!loading && enrollments.length === 0 && (
            <p className="empty">
              No enrollment requests found.
            </p>
          )}

          {!loading && enrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Requested On</th>
                    <th>Decision Date</th>
                    <th>Rejection Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.full_name}</td>

                      <td>{enrollment.username}</td>

                      <td>
                        {enrollment.title ||
                          selectedCourse?.title}
                      </td>

                      <td>
                        <span
                          className={`enrollment-status ${enrollment.status}`}
                        >
                          {enrollment.status}
                        </span>
                      </td>

                      <td>
                        {formatDate(enrollment.enrolled_at)}
                      </td>

                      <td>
                        {formatDate(enrollment.reviewed_at)}
                      </td>

                      <td>
                        {enrollment.rejection_reason || "-"}
                      </td>

                      <td>
                        <div className="enrollment-actions">
                          {enrollment.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-small btn-primary"
                                disabled={
                                  processingId === enrollment.id
                                }
                                onClick={() =>
                                  handleStatusUpdate(
                                    enrollment,
                                    "approved"
                                  )
                                }
                              >
                                Approve
                              </button>

                              <input
                                type="text"
                                className="input"
                                maxLength={500}
                                placeholder="Rejection reason"
                                value={
                                  rejectionReasons[
                                    enrollment.id
                                  ] || ""
                                }
                                onChange={(event) =>
                                  setRejectionReasons(
                                    (previous) => ({
                                      ...previous,
                                      [enrollment.id]:
                                        event.target.value
                                    })
                                  )
                                }
                              />

                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                disabled={
                                  processingId === enrollment.id
                                }
                                onClick={() =>
                                  handleStatusUpdate(
                                    enrollment,
                                    "rejected"
                                  )
                                }
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="btn btn-small btn-danger"
                            onClick={() =>
                              handleDelete(enrollment)
                            }
                          >
                            <FaTrash />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}

export default ManageEnrollments;
