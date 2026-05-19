-- ============================================================================
-- COMPREHENSIVE INTERN DATA SEED for KA-ACADEMY26 (program_id=1, batch 1)
-- Students: 10 (Srinivath), 11 (Manohar), 12 (Pradeep)
-- TC user: 10 (lavanya@kanini.com)
-- ============================================================================
USE Springer;

SET @tc_user = 10;  -- Training Coordinator
SET @prog_id = 1;   -- KA-ACADEMY26

-- ============================================================================
-- 1. BATCH SCHEDULE for program 1, batch 1
-- ============================================================================
INSERT IGNORE INTO batch_schedules (batch_number, start_date, end_date, program_id, created_at, updated_at) VALUES
(1, '2026-05-05', '2026-07-25', @prog_id, NOW(), NOW());

-- ============================================================================
-- 2. BATCH COURSES — link courses 21-26 to program 1 batch 1
-- ============================================================================
INSERT INTO batch_courses (batch_no, course_id, program_id, status, start_date, end_date, conducted_by, created_at) VALUES
(1, 21, @prog_id, 'COMPLETED', '2026-05-05 09:00:00', '2026-05-16 17:00:00', @tc_user, NOW()),
(1, 22, @prog_id, 'ACTIVE',    '2026-05-19 09:00:00', '2026-05-30 17:00:00', @tc_user, NOW()),
(1, 23, @prog_id, 'PLANNED',   '2026-06-02 09:00:00', '2026-06-13 17:00:00', @tc_user, NOW()),
(1, 24, @prog_id, 'PLANNED',   '2026-06-16 09:00:00', '2026-06-27 17:00:00', @tc_user, NOW()),
(1, 25, @prog_id, 'PLANNED',   '2026-06-30 09:00:00', '2026-07-11 17:00:00', @tc_user, NOW()),
(1, 26, @prog_id, 'PLANNED',   '2026-07-14 09:00:00', '2026-07-25 17:00:00', @tc_user, NOW());

-- ============================================================================
-- 3. TRAINING SCORES — for completed/active courses
-- ============================================================================
-- Java Fundamentals (course 21) — COMPLETED
INSERT INTO training_scores (student_id, course_id, score, status, review, reviewed_by, created_at) VALUES
(10, 21, 88, 'EXCELLENT', 'Strong understanding of OOP concepts and collections.', @tc_user, '2026-05-16 17:00:00'),
(11, 21, 76, 'GOOD',      'Good grasp of fundamentals. Needs practice with streams.', @tc_user, '2026-05-16 17:00:00'),
(12, 21, 58, 'BELOW_AVERAGE', 'Struggling with inheritance and polymorphism. Extra sessions recommended.', @tc_user, '2026-05-16 17:00:00');

-- Spring Boot (course 22) — ACTIVE (mid-course scores)
INSERT INTO training_scores (student_id, course_id, score, status, review, reviewed_by, created_at) VALUES
(10, 22, 82, 'EXCELLENT', 'Excellent work on REST APIs and JPA mappings.', @tc_user, '2026-05-23 17:00:00'),
(11, 22, 79, 'GOOD',      'Solid understanding of dependency injection and annotations.', @tc_user, '2026-05-23 17:00:00'),
(12, 22, 65, 'AVERAGE',   'Can build basic CRUD but needs more practice with relationships.', @tc_user, '2026-05-23 17:00:00');

-- ============================================================================
-- 4. ATTENDANCE RECORDS (May 5–13, weekdays only)
-- ============================================================================
-- Student 10 (Srinivath) — 88% attendance (missed 1 day)
INSERT INTO training_day_attendance (student_id, attendance_date, is_present) VALUES
(10, '2026-05-05', 1), (10, '2026-05-06', 1), (10, '2026-05-07', 0),
(10, '2026-05-08', 1), (10, '2026-05-09', 1),
(10, '2026-05-12', 1), (10, '2026-05-13', 1);

-- Student 11 (Manohar) — 100% attendance (present every day)
INSERT INTO training_day_attendance (student_id, attendance_date, is_present) VALUES
(11, '2026-05-05', 1), (11, '2026-05-06', 1), (11, '2026-05-07', 1),
(11, '2026-05-08', 1), (11, '2026-05-09', 1),
(11, '2026-05-12', 1), (11, '2026-05-13', 1);

-- Student 12 (Pradeep) — 71% attendance (missed 2 days)
INSERT INTO training_day_attendance (student_id, attendance_date, is_present) VALUES
(12, '2026-05-05', 1), (12, '2026-05-06', 0), (12, '2026-05-07', 1),
(12, '2026-05-08', 0), (12, '2026-05-09', 1),
(12, '2026-05-12', 1), (12, '2026-05-13', 1);

-- ============================================================================
-- 5. ACADEMY EVENTS for program 1
-- ============================================================================
INSERT INTO academy_events (title, description, event_date, event_time, event_type, venue, program_id, batch_number, created_by, created_at) VALUES
('Java Final Assessment', 'End-of-module assessment covering all Java Fundamentals topics', '2026-05-16', '10:00:00', 'ASSESSMENT', 'Lab 3', @prog_id, 1, @tc_user, NOW()),
('Spring Boot Kickoff', 'Introduction to Spring Boot framework and project setup', '2026-05-19', '09:30:00', 'SESSION', 'Training Room A', @prog_id, 1, @tc_user, NOW()),
('Weekly Standup - Week 2', 'Weekly progress review and Q&A for Batch 1', '2026-05-12', '15:00:00', 'REVIEW', 'ONLINE', @prog_id, 1, @tc_user, NOW()),
('Weekly Standup - Week 3', 'Weekly progress review and Q&A for Batch 1', '2026-05-19', '15:00:00', 'REVIEW', 'ONLINE', @prog_id, 1, @tc_user, NOW()),
('Spring Boot Mid Assessment', 'Mid-module check on REST APIs and JPA basics', '2026-05-23', '10:00:00', 'ASSESSMENT', 'Lab 3', @prog_id, 1, @tc_user, NOW()),
('Mentor Connect Session', 'One-on-one mentoring session with senior developers', '2026-05-26', '14:00:00', 'MEETING', 'Conference Room B', @prog_id, 1, @tc_user, NOW()),
('React Workshop', 'Hands-on workshop on React and TypeScript basics', '2026-06-02', '09:00:00', 'SESSION', 'Training Room A', @prog_id, 1, @tc_user, NOW()),
('Client Demo Day', 'Present mini projects to client stakeholders', '2026-06-15', '11:00:00', 'CLIENT_VISIT', 'Board Room', @prog_id, NULL, @tc_user, NOW()),
('Final Presentation', 'End-of-program project presentations', '2026-07-24', '10:00:00', 'ASSESSMENT', 'Auditorium', @prog_id, NULL, @tc_user, NOW());

-- ============================================================================
-- 6. INTERN CERTIFICATES
-- ============================================================================
INSERT INTO intern_certificates (student_id, certificate_name, issuer, issue_date, uploaded_at) VALUES
(10, 'Java Fundamentals Completion', 'Kanini Academy', '2026-05-16', NOW()),
(11, 'Java Fundamentals Completion', 'Kanini Academy', '2026-05-16', NOW()),
(10, 'AWS Cloud Practitioner', 'Amazon Web Services', '2026-04-20', NOW()),
(11, 'Git & GitHub Essentials', 'Kanini Academy', '2026-05-01', NOW());

-- ============================================================================
-- 7. INTERN PROFILES
-- ============================================================================
INSERT INTO intern_profiles (user_id, bio, profile_links, updated_at) VALUES
(23, 'Full-stack developer passionate about Java and cloud technologies. B.Tech CSE from Anna University.',
 '{"github": "https://github.com/srinivath-m", "linkedin": "https://linkedin.com/in/srinivathmohan"}', NOW()),
(24, 'Aspiring software engineer with interest in backend development and microservices. B.Tech CSE from Anna University.',
 '{"github": "https://github.com/manoharbavigadda", "linkedin": "https://linkedin.com/in/manoharbavigadda"}', NOW()),
(25, 'Tech enthusiast focused on data engineering and Python. B.Tech IT from VIT.',
 '{"github": "https://github.com/pradeep-kumar", "linkedin": "https://linkedin.com/in/pradeepkumar-dev"}', NOW());

-- ============================================================================
-- 8. INTERN WARNINGS
-- ============================================================================
INSERT INTO intern_warnings (student_id, warning_type, severity, message, status, issued_by, issued_at, course_id) VALUES
(12, 'ATTENDANCE', 'MODERATE', 'Your attendance has dropped to 71%. The minimum required is 75%. Please ensure regular attendance.', 'ACTIVE', @tc_user, '2026-05-13 09:00:00', NULL),
(12, 'PERFORMANCE', 'MINOR', 'Your Java Fundamentals score (58) is below the minimum passing score of 60. Please attend remedial sessions.', 'ACTIVE', @tc_user, '2026-05-16 18:00:00', 21),
(11, 'PUNCTUALITY', 'MINOR', 'You were late to 2 sessions this week. Please be on time for all scheduled sessions.', 'ACKNOWLEDGED', @tc_user, '2026-05-09 17:00:00', NULL);

-- Acknowledge Manohar's punctuality warning
UPDATE intern_warnings SET acknowledged_at = '2026-05-09 18:30:00', acknowledgement_comment = 'Apologies, I had transport issues. I will plan better.' WHERE student_id = 11 AND warning_type = 'PUNCTUALITY' AND status = 'ACKNOWLEDGED';

-- ============================================================================
-- 9. LEAVE REQUESTS
-- ============================================================================
INSERT INTO leave_requests (student_id, leave_type, from_date, to_date, reason, status, applied_at, reviewed_by, reviewed_at, remarks) VALUES
(10, 'SICK', '2026-05-07', '2026-05-07', 'Fever and headache, unable to attend training.', 'APPROVED', '2026-05-06 20:00:00', @tc_user, '2026-05-07 08:00:00', 'Get well soon. Please share medical certificate.'),
(12, 'PERSONAL', '2026-05-06', '2026-05-06', 'Need to visit bank for account opening.', 'APPROVED', '2026-05-05 18:00:00', @tc_user, '2026-05-06 08:00:00', 'Approved. Please complete pending assignments.'),
(12, 'SICK', '2026-05-08', '2026-05-08', 'Food poisoning.', 'APPROVED', '2026-05-07 21:00:00', @tc_user, '2026-05-08 08:00:00', NULL),
(11, 'PERSONAL', '2026-05-20', '2026-05-20', 'Family function - need to travel home.', 'PENDING', '2026-05-13 10:00:00', NULL, NULL, NULL);

-- ============================================================================
-- 10. UPDATE batch_allocations with recalculated attendance %
-- ============================================================================
UPDATE batch_allocations SET attendance_percentage = 85.71 WHERE student_id = 10;  -- 6/7
UPDATE batch_allocations SET attendance_percentage = 100.00 WHERE student_id = 11; -- 7/7
UPDATE batch_allocations SET attendance_percentage = 71.43 WHERE student_id = 12;  -- 5/7

SELECT 'Seed complete!' AS result;
