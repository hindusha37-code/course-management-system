
CREATE DATABASE IF NOT EXISTS course_management;

USE course_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'student') NOT NULL
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    level VARCHAR(30) NOT NULL,
    duration VARCHAR(30) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL DEFAULT 30,
    image VARCHAR(500),
    description TEXT
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,
    course_id INT NOT NULL,

    status ENUM('pending', 'approved', 'rejected')
        NOT NULL DEFAULT 'pending',

    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,

    rejection_reason VARCHAR(500) NULL,

    -- Student account
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Course
    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Administrator reviewer
    FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_enrollment_student_course
        (student_id, course_id),

    INDEX idx_enrollment_status
        (status),

    INDEX idx_enrollment_course_status
        (course_id, status)
);
