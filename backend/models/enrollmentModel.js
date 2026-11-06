
const db = require("../config/db");

const Enrollment = {
  // Student submits a pending request.
  async create(studentId, courseId) {
    const [result] = await db.execute(
      `INSERT INTO enrollments
       (student_id, course_id, status)
       VALUES (?, ?, 'pending')`,
      [studentId, courseId]
    );

    return result.insertId;
  },

  // Find an existing request.
  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
       AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0];
  },

  // Student's enrollments and decision information.
  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.student_id,
         e.course_id,
         e.status,
         e.enrolled_at,
         e.reviewed_at,
         e.rejection_reason,
         c.title,
         c.category,
         c.level,
         c.duration,
         c.price,
         c.image,
         c.description
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC`,
      [studentId]
    );

    return rows;
  },

  // Students enrolled in a specific course.
  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.enrolled_at,
         e.status,
         e.reviewed_at,
         e.rejection_reason,
         u.id AS student_id,
         u.username,
         u.full_name
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC`,
      [courseId]
    );

    return rows;
  },

  // CR-008 + CR-011: Admin search, filters, sorting and pagination.
  async getAll(options = {}) {
    const {
      q = "",
      courseId = null,
      from = null,
      to = null,
      status = null,
      sort = "date",
      order = "desc",
      page = 1,
      limit = 20
    } = options;

    const sortColumns = {
      date: "e.enrolled_at",
      student: "u.full_name",
      course: "c.title"
    };

    const sortColumn = sortColumns[sort];

    if (!sortColumn) {
      throw new Error("Invalid sort field");
    }

    const sortOrder = order === "asc" ? "ASC" : "DESC";

    const conditions = [];
    const params = [];

    if (q) {
      const escapedSearch = q.replace(/[!%_]/g, "!$&");
      const pattern = `%${escapedSearch}%`;

      conditions.push(
        `(u.full_name LIKE ? ESCAPE '!'
          OR u.username LIKE ? ESCAPE '!')`
      );

      params.push(pattern, pattern);
    }

    if (courseId !== null) {
      conditions.push("e.course_id = ?");
      params.push(courseId);
    }

    if (from !== null) {
      conditions.push("e.enrolled_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    if (to !== null) {
      conditions.push(
        "e.enrolled_at < DATE_ADD(?, INTERVAL 1 DAY)"
      );

      params.push(to);
    }

    if (status !== null) {
      conditions.push("e.status = ?");
      params.push(status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       ${whereClause}`,
      params
    );

    const total = Number(countRows[0].total);

    const offset = (page - 1) * limit;

    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.student_id,
         e.course_id,
         e.status,
         e.enrolled_at,
         e.reviewed_by,
         e.reviewed_at,
         e.rejection_reason,

         u.username,
         u.full_name,

         c.title,
         c.category,
         c.level,
         c.capacity

       FROM enrollments e

       JOIN users u ON e.student_id = u.id

       JOIN courses c ON e.course_id = c.id

       ${whereClause}

       ORDER BY ${sortColumn} ${sortOrder}, e.id DESC

       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      enrollments: rows,
      total
    };
  },

  // CR-011: Process approval/rejection using transaction.
  async updateStatus(id, status, reason, adminId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Lock enrollment.
      const [enrollmentRows] = await connection.execute(
        `SELECT *
         FROM enrollments
         WHERE id = ?
         FOR UPDATE`,
        [id]
      );

      const enrollment = enrollmentRows[0];

      if (!enrollment) {
        throw new Error("ENROLLMENT_NOT_FOUND");
      }

      if (enrollment.status !== "pending") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      if (status === "approved") {
        // Lock course to prevent concurrent approvals
        // from exceeding course capacity.
        const [courseRows] = await connection.execute(
          `SELECT *
           FROM courses
           WHERE id = ?
           FOR UPDATE`,
          [enrollment.course_id]
        );

        const course = courseRows[0];

        if (!course) {
          throw new Error("COURSE_NOT_FOUND");
        }

        // Count confirmed enrollments only.
        const [capacityRows] = await connection.execute(
          `SELECT COUNT(*) AS total
           FROM enrollments
           WHERE course_id = ?
           AND status = 'approved'`,
          [enrollment.course_id]
        );

        const approvedCount = Number(
          capacityRows[0].total
        );

        if (approvedCount >= Number(course.capacity)) {
          throw new Error("COURSE_FULL");
        }

        // Check approved duplicate.
        const [duplicateRows] = await connection.execute(
          `SELECT id
           FROM enrollments
           WHERE student_id = ?
           AND course_id = ?
           AND status = 'approved'
           AND id <> ?
           LIMIT 1`,
          [
            enrollment.student_id,
            enrollment.course_id,
            id
          ]
        );

        if (duplicateRows.length > 0) {
          throw new Error("DUPLICATE_APPROVED_ENROLLMENT");
        }
      }

      await connection.execute(
        `UPDATE enrollments
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             rejection_reason = ?
         WHERE id = ?
         AND status = 'pending'`,
        [
          status,
          adminId,
          status === "rejected" ? reason : null,
          id
        ]
      );

      await connection.commit();

      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Admin deletes an enrollment.
  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  }
};

module.exports = Enrollment;
