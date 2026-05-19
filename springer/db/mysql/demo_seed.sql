-- ============================================================
-- SPRINGER FULL DEMO SEED DATA
-- Run AFTER the backend starts (DataLoader creates roles, users, cycles, institutes)
-- Covers: Candidates, Document Processing, Academy, Intern
-- ============================================================

-- ============================================================
-- REFERENCE IDs (dynamic lookups)
-- ============================================================
SET @cycle_id = (SELECT cycle_id FROM hiring_cycles WHERE cycle_year = 2026 AND status = 'OPEN' LIMIT 1);
SET @inst_anna = (SELECT institute_id FROM institutes WHERE institute_name = 'Anna University' LIMIT 1);
SET @inst_vit = (SELECT institute_id FROM institutes WHERE institute_name = 'VIT University' LIMIT 1);
SET @inst_psg = (SELECT institute_id FROM institutes WHERE institute_name = 'PSG College of Technology' LIMIT 1);
SET @inst_srm = (SELECT institute_id FROM institutes WHERE institute_name = 'SRM Institute of Science and Technology' LIMIT 1);

SET @tc_user = (SELECT user_id FROM users WHERE email = 'lavanya@kanini.com' LIMIT 1);
SET @head_user = (SELECT user_id FROM users WHERE email = 'sudha@kanini.com' LIMIT 1);
SET @intern_role = (SELECT role_id FROM roles WHERE role_name = 'INTERN' LIMIT 1);

-- ============================================================
-- 1. CANDIDATES (10 — SELECTED/OFFERED/ACCEPTED/JOINED)
-- ============================================================
INSERT IGNORE INTO candidates (first_name, last_name, email, mobile, cgpa, history_of_arrears, degree, department, passout_year, date_of_birth, aadhaar_number, is_eligible, application_type, application_stage, lifecycle_status, cycle_id, institute_id, created_at, updated_at)
VALUES
('Manohar', 'Bavigadda', 'manoharbavigadda@gmail.com', '9876543210', 8.50, 0, 'B.Tech', 'Computer Science', 2026, '2004-03-15', '123456789001', true, 'STANDARD', 'JOINED', 'ACTIVE', @cycle_id, @inst_anna, NOW(), NOW()),
('Srinivath', 'Mohan', 'knowledgeiq255@gmail.com', '9876543211', 8.80, 0, 'B.Tech', 'Computer Science', 2026, '2004-05-22', '123456789002', true, 'STANDARD', 'JOINED', 'ACTIVE', @cycle_id, @inst_anna, NOW(), NOW()),
('Pradeep', 'Kumar', 'pradeepkumar.dev@gmail.com', '9876543212', 9.10, 0, 'B.Tech', 'Information Technology', 2026, '2004-01-10', '123456789003', true, 'STANDARD', 'JOINED', 'ACTIVE', @cycle_id, @inst_vit, NOW(), NOW()),
('Kavitha', 'Rajan', 'kavitharajan.work@gmail.com', '9876543213', 8.20, 0, 'B.E', 'Electronics', 2026, '2004-07-18', '123456789004', true, 'STANDARD', 'JOINED', 'ACTIVE', @cycle_id, @inst_vit, NOW(), NOW()),
('Arun', 'Prakash', 'arunprakash.kanini@gmail.com', '9876543214', 7.90, 1, 'B.Tech', 'Computer Science', 2026, '2003-11-25', '123456789005', true, 'STANDARD', 'JOINED', 'ACTIVE', @cycle_id, @inst_psg, NOW(), NOW()),
('Divya', 'Lakshmi', 'divyalakshmi.tech@gmail.com', '9876543215', 9.20, 0, 'B.Tech', 'Data Science', 2026, '2004-09-02', '123456789006', true, 'PREMIUM', 'JOINED', 'ACTIVE', @cycle_id, @inst_psg, NOW(), NOW()),
('Rahul', 'Sharma', 'rahulsharma.springer@gmail.com', '9876543216', 8.70, 0, 'B.Tech', 'Computer Science', 2026, '2004-02-14', '123456789007', true, 'STANDARD', 'SELECTED', 'ACTIVE', @cycle_id, @inst_srm, NOW(), NOW()),
('Meena', 'Krishnan', 'meenakrishnan.2026@gmail.com', '9876543217', 8.40, 0, 'B.E', 'Information Technology', 2026, '2004-06-30', '123456789008', true, 'STANDARD', 'SELECTED', 'ACTIVE', @cycle_id, @inst_srm, NOW(), NOW()),
('Vikram', 'Sundar', 'vikramsundar.kanini@gmail.com', '9876543218', 7.80, 1, 'B.Tech', 'Mechanical', 2026, '2003-12-05', '123456789009', true, 'STANDARD', 'SELECTED', 'ACTIVE', @cycle_id, @inst_anna, NOW(), NOW()),
('Anitha', 'Venkatesh', 'anithavenkatesh.2026@gmail.com', '9876543219', 9.00, 0, 'B.Tech', 'Computer Science', 2026, '2004-04-20', '123456789010', true, 'PREMIUM', 'SELECTED', 'ACTIVE', @cycle_id, @inst_vit, NOW(), NOW());

-- Get candidate IDs
SET @c1 = (SELECT candidate_id FROM candidates WHERE email = 'manoharbavigadda@gmail.com' LIMIT 1);
SET @c2 = (SELECT candidate_id FROM candidates WHERE email = 'knowledgeiq255@gmail.com' LIMIT 1);
SET @c3 = (SELECT candidate_id FROM candidates WHERE email = 'pradeepkumar.dev@gmail.com' LIMIT 1);
SET @c4 = (SELECT candidate_id FROM candidates WHERE email = 'kavitharajan.work@gmail.com' LIMIT 1);
SET @c5 = (SELECT candidate_id FROM candidates WHERE email = 'arunprakash.kanini@gmail.com' LIMIT 1);
SET @c6 = (SELECT candidate_id FROM candidates WHERE email = 'divyalakshmi.tech@gmail.com' LIMIT 1);
SET @c7 = (SELECT candidate_id FROM candidates WHERE email = 'rahulsharma.springer@gmail.com' LIMIT 1);
SET @c8 = (SELECT candidate_id FROM candidates WHERE email = 'meenakrishnan.2026@gmail.com' LIMIT 1);
SET @c9 = (SELECT candidate_id FROM candidates WHERE email = 'vikramsundar.kanini@gmail.com' LIMIT 1);
SET @c10 = (SELECT candidate_id FROM candidates WHERE email = 'anithavenkatesh.2026@gmail.com' LIMIT 1);

-- ============================================================
-- 2. DOCUMENT TYPES
-- ============================================================
INSERT IGNORE INTO document_types (document_type, created_at) VALUES
('RESUME', NOW()), ('PHOTO', NOW()), ('ID_PROOF', NOW()),
('MARKSHEET', NOW()), ('PROVISIONAL_CERT', NOW()), ('DEGREE_CERT', NOW());

SET @dt_resume = (SELECT document_type_id FROM document_types WHERE document_type = 'RESUME' LIMIT 1);
SET @dt_photo = (SELECT document_type_id FROM document_types WHERE document_type = 'PHOTO' LIMIT 1);
SET @dt_id = (SELECT document_type_id FROM document_types WHERE document_type = 'ID_PROOF' LIMIT 1);
SET @dt_mark = (SELECT document_type_id FROM document_types WHERE document_type = 'MARKSHEET' LIMIT 1);

-- ============================================================
-- 3. DOCUMENT SUBMISSIONS (for JOINED candidates — all APPROVED)
-- ============================================================
INSERT IGNORE INTO document_submissions (document_type_id, candidate_id, cycle_id, verification_status, created_at) VALUES
-- Manohar — all approved
(@dt_resume, @c1, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c1, @cycle_id, 'APPROVED', NOW()),
(@dt_id, @c1, @cycle_id, 'APPROVED', NOW()),
(@dt_mark, @c1, @cycle_id, 'APPROVED', NOW()),
-- Srinivath — all approved
(@dt_resume, @c2, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c2, @cycle_id, 'APPROVED', NOW()),
(@dt_id, @c2, @cycle_id, 'APPROVED', NOW()),
(@dt_mark, @c2, @cycle_id, 'APPROVED', NOW()),
-- Pradeep — all approved
(@dt_resume, @c3, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c3, @cycle_id, 'APPROVED', NOW()),
(@dt_id, @c3, @cycle_id, 'APPROVED', NOW()),
-- Kavitha — all approved
(@dt_resume, @c4, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c4, @cycle_id, 'APPROVED', NOW()),
-- Arun — all approved
(@dt_resume, @c5, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c5, @cycle_id, 'APPROVED', NOW()),
(@dt_id, @c5, @cycle_id, 'APPROVED', NOW()),
(@dt_mark, @c5, @cycle_id, 'APPROVED', NOW()),
-- Divya — all approved
(@dt_resume, @c6, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c6, @cycle_id, 'APPROVED', NOW()),
(@dt_id, @c6, @cycle_id, 'APPROVED', NOW()),
-- Rahul — ALL approved (SELECTED → eligible to offer)
(@dt_resume, @c7, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c7, @cycle_id, 'APPROVED', NOW()),
(@dt_id, @c7, @cycle_id, 'APPROVED', NOW()),
(@dt_mark, @c7, @cycle_id, 'APPROVED', NOW()),
-- Meena — ALL approved (SELECTED → eligible to offer)
(@dt_resume, @c8, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c8, @cycle_id, 'APPROVED', NOW()),
(@dt_id, @c8, @cycle_id, 'APPROVED', NOW()),
(@dt_mark, @c8, @cycle_id, 'APPROVED', NOW()),
-- Vikram — mix of collected/approved (SELECTED → needs review)
(@dt_resume, @c9, @cycle_id, 'COLLECTED', NOW()),
(@dt_photo, @c9, @cycle_id, 'COLLECTED', NOW()),
(@dt_id, @c9, @cycle_id, 'APPROVED', NOW()),
(@dt_mark, @c9, @cycle_id, 'COLLECTED', NOW()),
-- Anitha — mix of collected/approved (SELECTED → needs review)
(@dt_resume, @c10, @cycle_id, 'APPROVED', NOW()),
(@dt_photo, @c10, @cycle_id, 'COLLECTED', NOW()),
(@dt_id, @c10, @cycle_id, 'APPROVED', NOW()),
(@dt_mark, @c10, @cycle_id, 'COLLECTED', NOW());

-- ============================================================
-- 4. OFFER LETTERS (for JOINED candidates)
-- ============================================================
INSERT IGNORE INTO offer_letters (candidate_id, cycle_id, issue_date, responded_date, response) VALUES
(@c1, @cycle_id, '2026-04-01', '2026-04-03', 'ACCEPTED'),
(@c2, @cycle_id, '2026-04-01', '2026-04-04', 'ACCEPTED'),
(@c3, @cycle_id, '2026-04-02', '2026-04-05', 'ACCEPTED'),
(@c4, @cycle_id, '2026-04-02', '2026-04-06', 'ACCEPTED'),
(@c5, @cycle_id, '2026-04-03', '2026-04-07', 'ACCEPTED'),
(@c6, @cycle_id, '2026-04-03', '2026-04-08', 'ACCEPTED');

-- ============================================================
-- 5. TRAINING PROGRAM
-- ============================================================
INSERT IGNORE INTO training_programs (cycle_id, program_name, program_year, capacity, number_of_batches, location, status, created_at) VALUES
(@cycle_id, '2026 Graduate Training Program', 2026, 30, 2, 'COIMBATORE', true, NOW());

SET @prog_id = (SELECT program_id FROM training_programs WHERE program_name = '2026 Graduate Training Program' LIMIT 1);

-- ============================================================
-- 6. TRAINING COURSES
-- ============================================================
INSERT IGNORE INTO training_courses (course_name, description, min_score, weightage, is_communication, communication_template, created_at) VALUES
('Java Fundamentals', 'Core Java concepts including OOP, collections, streams, and exception handling', 50, 25, 0, NULL, NOW()),
('Spring Boot', 'Spring Boot framework, REST APIs, JPA, security, and microservices', 50, 25, 0, NULL, NOW()),
('React & TypeScript', 'Frontend development with React, TypeScript, hooks, and state management', 50, 20, 0, NULL, NOW()),
('SQL & Database', 'MySQL, queries, joins, indexing, normalization, and stored procedures', 50, 15, 0, NULL, NOW()),
('Communication Skills', 'Professional communication, presentation, email writing, and team collaboration', 50, 15, 1, '[{"name":"Presentation","maxScore":30},{"name":"Email Writing","maxScore":20},{"name":"Group Discussion","maxScore":25},{"name":"Verbal Fluency","maxScore":25}]', NOW());

SET @course_java = (SELECT course_id FROM training_courses WHERE course_name = 'Java Fundamentals' LIMIT 1);
SET @course_spring = (SELECT course_id FROM training_courses WHERE course_name = 'Spring Boot' LIMIT 1);
SET @course_react = (SELECT course_id FROM training_courses WHERE course_name = 'React & TypeScript' LIMIT 1);
SET @course_sql = (SELECT course_id FROM training_courses WHERE course_name = 'SQL & Database' LIMIT 1);
SET @course_comm = (SELECT course_id FROM training_courses WHERE course_name = 'Communication Skills' LIMIT 1);

-- ============================================================
-- 7. BATCH COURSES (assign courses to batches)
-- ============================================================
INSERT IGNORE INTO batch_courses (batch_no, course_id, program_id, start_date, end_date, conducted_by, status, created_at) VALUES
-- Batch 1 courses
(1, @course_java, @prog_id, '2026-05-05 09:00:00', '2026-05-16 17:00:00', @tc_user, 'COMPLETED', NOW()),
(1, @course_spring, @prog_id, '2026-05-19 09:00:00', '2026-05-30 17:00:00', @tc_user, 'ACTIVE', NOW()),
(1, @course_react, @prog_id, '2026-06-02 09:00:00', '2026-06-13 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_sql, @prog_id, '2026-06-16 09:00:00', '2026-06-27 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_comm, @prog_id, '2026-05-05 14:00:00', '2026-06-27 15:00:00', @tc_user, 'ACTIVE', NOW()),
-- Batch 2 courses
(2, @course_java, @prog_id, '2026-05-12 09:00:00', '2026-05-23 17:00:00', @tc_user, 'ACTIVE', NOW()),
(2, @course_spring, @prog_id, '2026-05-26 09:00:00', '2026-06-06 17:00:00', @tc_user, 'PLANNED', NOW()),
(2, @course_react, @prog_id, '2026-06-09 09:00:00', '2026-06-20 17:00:00', @tc_user, 'PLANNED', NOW()),
(2, @course_sql, @prog_id, '2026-06-23 09:00:00', '2026-07-04 17:00:00', @tc_user, 'PLANNED', NOW()),
(2, @course_comm, @prog_id, '2026-05-12 14:00:00', '2026-07-04 15:00:00', @tc_user, 'PLANNED', NOW());

-- ============================================================
-- 8. BATCH SCHEDULES
-- ============================================================
INSERT IGNORE INTO batch_schedules (program_id, batch_number, start_date, end_date, created_at, updated_at) VALUES
(@prog_id, 1, '2026-05-05', '2026-06-27', NOW(), NOW()),
(@prog_id, 2, '2026-05-12', '2026-07-04', NOW(), NOW());

-- ============================================================
-- 9. CREATE INTERN USERS (link candidates to users for login)
-- ============================================================
INSERT IGNORE INTO users (username, email, password, department, location, role_id, is_active, created_at) VALUES
('Manohar Bavigadda', 'manoharbavigadda@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Training', 'Coimbatore', @intern_role, true, NOW()),
('Srinivath Mohan', 'knowledgeiq255@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Training', 'Coimbatore', @intern_role, true, NOW()),
('Pradeep Kumar', 'pradeepkumar.dev@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Training', 'Coimbatore', @intern_role, true, NOW()),
('Kavitha Rajan', 'kavitharajan.work@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Training', 'Coimbatore', @intern_role, true, NOW()),
('Arun Prakash', 'arunprakash.kanini@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Training', 'Coimbatore', @intern_role, true, NOW()),
('Divya Lakshmi', 'divyalakshmi.tech@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Training', 'Coimbatore', @intern_role, true, NOW());

-- Link candidates to their user accounts
UPDATE candidates SET user_id = (SELECT user_id FROM users WHERE email = 'manoharbavigadda@gmail.com' LIMIT 1) WHERE candidate_id = @c1;
UPDATE candidates SET user_id = (SELECT user_id FROM users WHERE email = 'knowledgeiq255@gmail.com' LIMIT 1) WHERE candidate_id = @c2;
UPDATE candidates SET user_id = (SELECT user_id FROM users WHERE email = 'pradeepkumar.dev@gmail.com' LIMIT 1) WHERE candidate_id = @c3;
UPDATE candidates SET user_id = (SELECT user_id FROM users WHERE email = 'kavitharajan.work@gmail.com' LIMIT 1) WHERE candidate_id = @c4;
UPDATE candidates SET user_id = (SELECT user_id FROM users WHERE email = 'arunprakash.kanini@gmail.com' LIMIT 1) WHERE candidate_id = @c5;
UPDATE candidates SET user_id = (SELECT user_id FROM users WHERE email = 'divyalakshmi.tech@gmail.com' LIMIT 1) WHERE candidate_id = @c6;

-- ============================================================
-- 10. BATCH ALLOCATIONS (6 JOINED candidates → Batch 1 & 2)
-- ============================================================
INSERT IGNORE INTO batch_allocations (program_id, candidate_id, batch_number, attendance_percentage, overall_weighted_score, is_active, performance, created_at) VALUES
-- Batch 1 (3 interns)
(@prog_id, @c1, 1, 92.50, 78.50, true, 'GOOD', NOW()),
(@prog_id, @c2, 1, 88.00, 85.20, true, 'EXCELLENT', NOW()),
(@prog_id, @c3, 1, 75.00, 62.00, true, 'NEED_LEARNING', NOW()),
-- Batch 2 (3 interns)
(@prog_id, @c4, 2, 95.00, 72.80, true, 'GOOD', NOW()),
(@prog_id, @c5, 2, 68.00, 55.40, true, 'NEED_LEARNING', NOW()),
(@prog_id, @c6, 2, 98.00, 91.00, true, 'EXCELLENT', NOW());

-- Get student IDs
SET @s1 = (SELECT student_id FROM batch_allocations WHERE candidate_id = @c1 LIMIT 1);
SET @s2 = (SELECT student_id FROM batch_allocations WHERE candidate_id = @c2 LIMIT 1);
SET @s3 = (SELECT student_id FROM batch_allocations WHERE candidate_id = @c3 LIMIT 1);
SET @s4 = (SELECT student_id FROM batch_allocations WHERE candidate_id = @c4 LIMIT 1);
SET @s5 = (SELECT student_id FROM batch_allocations WHERE candidate_id = @c5 LIMIT 1);
SET @s6 = (SELECT student_id FROM batch_allocations WHERE candidate_id = @c6 LIMIT 1);

-- ============================================================
-- 11. TRAINING SCORES (Java Fundamentals — completed for Batch 1)
-- ============================================================
INSERT IGNORE INTO training_scores (course_id, student_id, score, review, status, reviewed_by, created_at) VALUES
(@course_java, @s1, 82, 'Strong understanding of OOP concepts. Good use of streams.', 'GOOD', @tc_user, NOW()),
(@course_java, @s2, 91, 'Exceptional performance. Excellent grasp of collections and generics.', 'EXCELLENT', @tc_user, NOW()),
(@course_java, @s3, 58, 'Needs more practice with exception handling and multithreading.', 'AVERAGE', @tc_user, NOW()),

-- Communication scores with breakdown (Batch 1)
(@course_comm, @s1, 76, 'Good presentation skills. Needs to work on email formatting.', 'GOOD', @tc_user, NOW()),
(@course_comm, @s2, 88, 'Excellent communicator. Very articulate in group discussions.', 'EXCELLENT', @tc_user, NOW()),
(@course_comm, @s3, 52, 'Struggles with public speaking. Email writing is basic.', 'AVERAGE', @tc_user, NOW());

-- Update communication breakdown JSON
UPDATE training_scores SET communication_breakdown = '[{"name":"Presentation","score":22,"maxScore":30},{"name":"Email Writing","score":15,"maxScore":20},{"name":"Group Discussion","score":20,"maxScore":25},{"name":"Verbal Fluency","score":19,"maxScore":25}]' WHERE student_id = @s1 AND course_id = @course_comm;
UPDATE training_scores SET communication_breakdown = '[{"name":"Presentation","score":28,"maxScore":30},{"name":"Email Writing","score":18,"maxScore":20},{"name":"Group Discussion","score":22,"maxScore":25},{"name":"Verbal Fluency","score":20,"maxScore":25}]' WHERE student_id = @s2 AND course_id = @course_comm;
UPDATE training_scores SET communication_breakdown = '[{"name":"Presentation","score":12,"maxScore":30},{"name":"Email Writing","score":10,"maxScore":20},{"name":"Group Discussion","score":15,"maxScore":25},{"name":"Verbal Fluency","score":15,"maxScore":25}]' WHERE student_id = @s3 AND course_id = @course_comm;

-- ============================================================
-- 12. ATTENDANCE (last 5 working days for all 6 interns)
-- ============================================================
INSERT IGNORE INTO training_day_attendance (student_id, attendance_date, is_present) VALUES
-- Manohar (92.5% — mostly present)
(@s1, '2026-05-05', true), (@s1, '2026-05-06', true), (@s1, '2026-05-07', true), (@s1, '2026-05-08', false), (@s1, '2026-05-09', true),
-- Srinivath (88%)
(@s2, '2026-05-05', true), (@s2, '2026-05-06', true), (@s2, '2026-05-07', false), (@s2, '2026-05-08', true), (@s2, '2026-05-09', true),
-- Pradeep (75% — some absences)
(@s3, '2026-05-05', true), (@s3, '2026-05-06', false), (@s3, '2026-05-07', true), (@s3, '2026-05-08', false), (@s3, '2026-05-09', true),
-- Kavitha (95%)
(@s4, '2026-05-05', true), (@s4, '2026-05-06', true), (@s4, '2026-05-07', true), (@s4, '2026-05-08', true), (@s4, '2026-05-09', true),
-- Arun (68% — poor attendance)
(@s5, '2026-05-05', false), (@s5, '2026-05-06', true), (@s5, '2026-05-07', false), (@s5, '2026-05-08', true), (@s5, '2026-05-09', false),
-- Divya (98%)
(@s6, '2026-05-05', true), (@s6, '2026-05-06', true), (@s6, '2026-05-07', true), (@s6, '2026-05-08', true), (@s6, '2026-05-09', true);

-- ============================================================
-- 13. LEAVE REQUESTS
-- ============================================================
INSERT IGNORE INTO leave_requests (student_id, from_date, to_date, leave_type, reason, status, remarks, reviewed_by, reviewed_at, applied_at) VALUES
(@s1, '2026-05-08', '2026-05-08', 'PERSONAL', 'Family function to attend', 'APPROVED', 'Approved. Ensure you catch up on missed topics.', @tc_user, NOW(), NOW()),
(@s3, '2026-05-06', '2026-05-06', 'SICK', 'Fever and headache', 'APPROVED', NULL, @tc_user, NOW(), NOW()),
(@s5, '2026-05-05', '2026-05-05', 'EMERGENCY', 'Family emergency at home', 'APPROVED', 'Take care. Submit medical certificate if needed.', @tc_user, NOW(), NOW()),
(@s5, '2026-05-07', '2026-05-07', 'SICK', 'Stomach infection', 'APPROVED', NULL, @tc_user, NOW(), NOW()),
(@s2, '2026-05-14', '2026-05-15', 'PERSONAL', 'Need to visit hometown for passport verification', 'PENDING', NULL, NULL, NULL, NOW()),
(@s3, '2026-05-12', '2026-05-12', 'OTHER', 'College convocation ceremony', 'PENDING', NULL, NULL, NULL, NOW());

-- ============================================================
-- 14. INTERN WARNINGS
-- ============================================================
INSERT IGNORE INTO intern_warnings (student_id, issued_by, warning_type, severity, message, course_id, status, issued_at) VALUES
(@s3, @tc_user, 'PERFORMANCE', 'MODERATE', 'Your Java Fundamentals score is below the minimum threshold (58/100, required 65). Please attend the remedial sessions and retake the assessment.', @course_java, 'ACTIVE', NOW()),
(@s5, @tc_user, 'ATTENDANCE', 'SEVERE', 'Your attendance has dropped to 68% which is below the required 75%. Continued absence may result in program termination. Please discuss with your coordinator.', NULL, 'ACTIVE', NOW()),
(@s3, @tc_user, 'PUNCTUALITY', 'MINOR', 'You have been late to morning sessions on 3 occasions this week. Please ensure timely arrival at 9:00 AM.', NULL, 'ACKNOWLEDGED', '2026-05-06 10:00:00');

-- Set acknowledgement for the third warning
UPDATE intern_warnings SET acknowledged_at = '2026-05-06 15:30:00', acknowledgement_comment = 'I apologize for being late. I will ensure timely attendance going forward.' WHERE student_id = @s3 AND warning_type = 'PUNCTUALITY' AND status = 'ACKNOWLEDGED';

-- ============================================================
-- 15. ACADEMY EVENTS
-- ============================================================
INSERT IGNORE INTO academy_events (title, description, event_date, event_time, event_type, venue, program_id, batch_number, created_by, created_at) VALUES
('Java Assessment', 'End of module assessment for Java Fundamentals', '2026-05-16', '10:00:00', 'ASSESSMENT', 'OFFLINE', @prog_id, 1, @tc_user, NOW()),
('Spring Boot Kickoff', 'Introduction session for Spring Boot module', '2026-05-19', '09:00:00', 'SESSION', 'OFFLINE', @prog_id, 1, @tc_user, NOW()),
('Weekly Review - Batch 1', 'Weekly progress review with all Batch 1 interns', '2026-05-12', '15:00:00', 'REVIEW', 'ONLINE', @prog_id, 1, @tc_user, NOW()),
('Weekly Review - Batch 2', 'Weekly progress review with all Batch 2 interns', '2026-05-12', '16:00:00', 'REVIEW', 'ONLINE', @prog_id, 2, @tc_user, NOW()),
('Client Visit - TCS', 'TCS team visiting to review intern progress', '2026-05-20', '11:00:00', 'CLIENT_VISIT', 'OFFLINE', @prog_id, NULL, @head_user, NOW()),
('All Hands Meeting', 'Monthly all-hands for the entire training program', '2026-05-30', '14:00:00', 'MEETING', 'ONLINE', @prog_id, NULL, @head_user, NOW());

-- ============================================================
-- VERIFY SEEDED DATA
-- ============================================================
SELECT '--- SEED VERIFICATION ---' AS '';
SELECT 'Candidates' AS entity, COUNT(*) AS total FROM candidates WHERE cycle_id = @cycle_id;
SELECT 'Document Submissions' AS entity, COUNT(*) AS total FROM document_submissions WHERE cycle_id = @cycle_id;
SELECT 'Offer Letters' AS entity, COUNT(*) AS total FROM offer_letters WHERE cycle_id = @cycle_id;
SELECT 'Training Program' AS entity, program_name, number_of_batches FROM training_programs WHERE program_id = @prog_id;
SELECT 'Courses' AS entity, COUNT(*) AS total FROM training_courses;
SELECT 'Batch Courses' AS entity, COUNT(*) AS total FROM batch_courses WHERE program_id = @prog_id;
SELECT 'Batch Allocations' AS entity, COUNT(*) AS total FROM batch_allocations WHERE program_id = @prog_id;
SELECT 'Scores' AS entity, COUNT(*) AS total FROM training_scores;
SELECT 'Attendance Records' AS entity, COUNT(*) AS total FROM training_day_attendance;
SELECT 'Leave Requests' AS entity, COUNT(*) AS total FROM leave_requests;
SELECT 'Warnings' AS entity, COUNT(*) AS total FROM intern_warnings;
SELECT 'Events' AS entity, COUNT(*) AS total FROM academy_events;
SELECT '--- ALL DONE ---' AS '';
