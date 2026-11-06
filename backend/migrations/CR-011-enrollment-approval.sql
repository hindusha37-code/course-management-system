USE course_management;

-- Add course capacity.
ALTER TABLE courses
ADD COLUMN capacity INT NOT NULL DEFAULT 30;

-- Add approval workflow fields.
ALTER TABLE enrollments
ADD COLUMN status ENUM('pending', 'approved', 'rejected')
    NOT NULL DEFAULT 'approved',

ADD COLUMN reviewed_by INT NULL,

ADD COLUMN reviewed_at TIMESTAMP NULL,

ADD COLUMN rejection_reason VARCHAR(500) NULL;

-- Existing enrollments remain confirmed.
UPDATE enrollments
SET status = 'approved';

-- Reviewer foreign key.
ALTER TABLE enrollments
ADD CONSTRAINT fk_enrollment_reviewer
FOREIGN KEY (reviewed_by)
REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

