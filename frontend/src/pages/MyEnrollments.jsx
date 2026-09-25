import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);
  const [sortOption, setSortOption] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


  useEffect(() => {

    const getEnrollments = async () => {

      try {

        const response = await api.get("/enrollments/my");

        setEnrollments(response.data.enrollments || []);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your enrollments"
        );

      } finally {

        setLoading(false);

      }
    };

    getEnrollments();

  }, []);


  const getSafePrice = (price) => {

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice) ? numericPrice : 0;

  };



  const formatDate = (value) => {

    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();

  };



  const summary = useMemo(() => {

    const totalCourses = enrollments.length;

    const totalValue = enrollments.reduce(
      (sum, enrollment) => {
        return sum + getSafePrice(enrollment.price);
      },
      0
    );

    const averagePrice =
      totalCourses > 0
        ? totalValue / totalCourses
        : 0;

    const distinctCategories = new Set(
      enrollments
        .map((enrollment) => enrollment.category?.trim())
        .filter(Boolean)
        .map((category) => category.toLowerCase())
    ).size;

    return {
      totalCourses,
      totalValue,
      averagePrice,
      distinctCategories,
    };

  }, [enrollments]);



  const sortedEnrollments = useMemo(() => {

    const sorted = [...enrollments];

    switch (sortOption) {

      case "newest":
        sorted.sort((a, b) => {

          const dateA = new Date(a.enrolled_at).getTime();
          const dateB = new Date(b.enrolled_at).getTime();

          return (
            (Number.isFinite(dateB) ? dateB : 0) -
            (Number.isFinite(dateA) ? dateA : 0)
          );

        });
        break;


      case "oldest":
        sorted.sort((a, b) => {

          const dateA = new Date(a.enrolled_at).getTime();
          const dateB = new Date(b.enrolled_at).getTime();

          return (
            (Number.isFinite(dateA) ? dateA : 0) -
            (Number.isFinite(dateB) ? dateB : 0)
          );

        });
        break;


      case "price-high":
        sorted.sort((a, b) => {
          return getSafePrice(b.price) - getSafePrice(a.price);
        });
        break;


      case "price-low":
        sorted.sort((a, b) => {
          return getSafePrice(a.price) - getSafePrice(b.price);
        });
        break;


      case "title":
        sorted.sort((a, b) => {

          const titleA = String(a.title || "").trim();
          const titleB = String(b.title || "").trim();

          return titleA.localeCompare(
            titleB,
            undefined,
            { sensitivity: "base" }
          );

        });
        break;


      default:
        break;

    }

    return sorted;

  }, [enrollments, sortOption]);


  return (

    <>
      <Navbar />

      <div className="container">

        <div className="page-header">

          <div>
            <h1>My Enrollments</h1>

            <p className="page-subtitle">
              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse More Courses
          </Link>

        </div>


     

        {loading && (
          <p className="loading">Loading your enrollments...</p>
        )}


      

        {error && !loading && (
          <p className="error">{error}</p>
        )}


        {!loading && !error && (

          <>

         

            <section className="dashboard-grid enrollment-summary">

              <div className="dashboard-card">
                <span className="dashboard-card-value">
                  {summary.totalCourses}
                </span>

                <span className="dashboard-card-label">
                  Total Enrolled Courses
                </span>
              </div>


              <div className="dashboard-card">
                <span className="dashboard-card-value">
                  Rs. {summary.totalValue.toFixed(2)}
                </span>

                <span className="dashboard-card-label">
                  Total Course Value
                </span>
              </div>


              <div className="dashboard-card">
                <span className="dashboard-card-value">
                  Rs. {summary.averagePrice.toFixed(2)}
                </span>

                <span className="dashboard-card-label">
                  Average Course Price
                </span>
              </div>


              <div className="dashboard-card">
                <span className="dashboard-card-value">
                  {summary.distinctCategories}
                </span>

                <span className="dashboard-card-label">
                  Course Categories
                </span>
              </div>

            </section>


          

            {enrollments.length === 0 && (

              <div className="empty-box">

                <p className="empty">
                  You are not enrolled in any courses yet.
                </p>

                <Link to="/courses" className="btn btn-primary">
                  <FaSearch />
                  Find a Course
                </Link>

              </div>

            )}


         

            {enrollments.length > 0 && (

              <>

                <div className="enrollment-toolbar">

                  <label htmlFor="enrollment-sort">
                    Sort by:
                  </label>

                  <select
                    id="enrollment-sort"
                    value={sortOption}
                    onChange={(event) => {
                      setSortOption(event.target.value);
                    }}
                  >
                    <option value="newest">
                      Newest Enrolled
                    </option>

                    <option value="oldest">
                      Oldest Enrolled
                    </option>

                    <option value="price-high">
                      Price: High to Low
                    </option>

                    <option value="price-low">
                      Price: Low to High
                    </option>

                    <option value="title">
                      Course Title: A to Z
                    </option>
                  </select>

                </div>


                <div className="course-grid">

                  {sortedEnrollments.map((enrollment) => (

                    <article
                      className="course-card"
                      key={enrollment.id}
                    >

                      <img
                        src={enrollment.image}
                        alt={enrollment.title}
                        className="course-card-image"
                        loading="lazy"
                      />

                      <div className="course-card-body">

                        <div className="course-card-tags">

                          <span className="tag tag-category">
                            {enrollment.category}
                          </span>

                          <span className="tag tag-level">
                            {enrollment.level}
                          </span>

                        </div>


                        <h3 className="course-card-title">
                          {enrollment.title}
                        </h3>


                        <p className="course-card-summary">
                          {enrollment.description?.slice(0, 100)}
                          {enrollment.description?.length > 100
                            ? "..."
                            : ""}
                        </p>


                        <ul className="course-card-meta">

                          <li>
                            <strong>Duration:</strong>{" "}
                            {enrollment.duration}
                          </li>

                          <li>
                            <strong>Price:</strong>{" "}
                            Rs. {getSafePrice(enrollment.price).toFixed(2)}
                          </li>

                          <li>
                            <strong>Enrolled on:</strong>{" "}
                            {formatDate(enrollment.enrolled_at)}
                          </li>

                        </ul>


                        <Link
                          to={`/courses/${enrollment.course_id}`}
                          className="btn btn-outline btn-block"
                        >
                          View Course
                        </Link>

                      </div>

                    </article>

                  ))}

                </div>

              </>

            )}

          </>

        )}

      </div>

      <Footer />

    </>
  );
}

export default MyEnrollments;
