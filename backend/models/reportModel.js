
const db = require("../config/db");

const Report = {
  async getOverview() {
    const [
      [courseRows],
      [studentRows],
      [enrollmentRows],
      [activeStudentRows],
      [recentRows],
      [categoryRows],
      [topCourseRows],
      [emptyCourseRows]
    ] = await Promise.all([
      db.execute(`
        SELECT COUNT(*) AS totalCourses
        FROM courses
      `),

      db.execute(`
        SELECT COUNT(*) AS totalStudents
        FROM users
        WHERE role = 'student'
      `),

      db.execute(`
        SELECT COUNT(*) AS totalEnrollments
        FROM enrollments
      `),

      db.execute(`
        SELECT COUNT(DISTINCT e.student_id) AS studentsWithEnrollments
        FROM enrollments e
        INNER JOIN users u ON u.id = e.student_id
        WHERE u.role = 'student'
      `),

      db.execute(`
        SELECT COUNT(*) AS enrollmentsLast30Days
        FROM enrollments
        WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND enrolled_at <= NOW()
      `),

      db.execute(`
        SELECT
          COALESCE(c.category, 'Uncategorized') AS categoryName,
          COUNT(e.id) AS enrollmentCount
        FROM courses c
        LEFT JOIN enrollments e ON e.course_id = c.id
        GROUP BY c.category
        ORDER BY enrollmentCount DESC, categoryName ASC
      `),

      db.execute(`
        SELECT
          c.id AS courseId,
          c.title AS courseName,
          COUNT(e.id) AS enrollmentCount
        FROM courses c
        INNER JOIN enrollments e ON e.course_id = c.id
        GROUP BY c.id, c.title
        ORDER BY enrollmentCount DESC, c.id ASC
        LIMIT 5
      `),

      db.execute(`
        SELECT COUNT(*) AS coursesWithoutEnrollments
        FROM courses c
        WHERE NOT EXISTS (
          SELECT 1
          FROM enrollments e
          WHERE e.course_id = c.id
        )
      `)
    ]);

    return {
      totalCourses: Number(courseRows[0].totalCourses),
      totalStudents: Number(studentRows[0].totalStudents),
      totalEnrollments: Number(enrollmentRows[0].totalEnrollments),

      studentsWithEnrollments: Number(
        activeStudentRows[0].studentsWithEnrollments
      ),

      enrollmentsLast30Days: Number(
        recentRows[0].enrollmentsLast30Days
      ),

      enrollmentsByCategory: categoryRows.map(row => ({
        categoryName: row.categoryName,
        enrollmentCount: Number(row.enrollmentCount)
      })),

      topCourses: topCourseRows.map(row => ({
        courseId: row.courseId,
        courseName: row.courseName,
        enrollmentCount: Number(row.enrollmentCount)
      })),

      coursesWithoutEnrollments: Number(
        emptyCourseRows[0].coursesWithoutEnrollments
      )
    };
  },

  async getMyReport(studentId) {
    const [
      [summaryRows],
      [recentEnrollments]
    ] = await Promise.all([
      db.execute(`
        SELECT
          COUNT(DISTINCT e.course_id) AS enrolledCourses,
          COUNT(DISTINCT c.category) AS distinctCategories,
          MIN(e.enrolled_at) AS earliestEnrollmentDate,
          MAX(e.enrolled_at) AS latestEnrollmentDate
        FROM enrollments e
        INNER JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
      `, [studentId]),

      db.execute(`
        SELECT
          e.id AS enrollmentId,
          e.course_id AS courseId,
          c.title AS courseName,
          c.category AS categoryName,
          e.enrolled_at AS enrollmentDate
        FROM enrollments e
        INNER JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
        ORDER BY e.enrolled_at DESC, e.id DESC
        LIMIT 5
      `, [studentId])
    ]);

    const summary = summaryRows[0];

    return {
      enrolledCourses: Number(summary.enrolledCourses),
      distinctCategories: Number(summary.distinctCategories),
      earliestEnrollmentDate: summary.earliestEnrollmentDate,
      latestEnrollmentDate: summary.latestEnrollmentDate,
      recentEnrollments
    };
  }
};

module.exports = Report;
