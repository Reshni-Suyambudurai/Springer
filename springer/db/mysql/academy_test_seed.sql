-- ============================================================
-- ACADEMY MODULE TEST SEED DATA
-- Tests: Course validations, year filtering, archived courses
-- Run AFTER backend starts and demo_seed.sql is executed
-- ============================================================

-- Get reference IDs
SET @cycle_id = (SELECT cycle_id FROM hiring_cycles WHERE cycle_year = 2026 AND status = 'OPEN' LIMIT 1);
SET @prog_id = (SELECT program_id FROM training_programs WHERE program_name = '2026 Graduate Training Program' LIMIT 1);
SET @tc_user = (SELECT user_id FROM users WHERE email = 'lavanya@kanini.com' LIMIT 1);

-- ============================================================
-- TEST 1: COURSE VALIDATION - Weightage Sum Test
-- Total weightage should not exceed 100%
-- ============================================================

-- Add test courses with specific weightages
INSERT IGNORE INTO training_courses (course_name, description, min_score, weightage, is_communication, communication_template, created_at) VALUES
('Advanced Java', 'Advanced Java concepts and design patterns', 50, 20, 0, NULL, NOW()),
('Microservices', 'Building microservices with Spring Cloud', 50, 20, 0, NULL, NOW()),
('DevOps Basics', 'Docker, Kubernetes, CI/CD pipelines', 50, 15, 0, NULL, NOW()),
('Cloud Computing', 'AWS and cloud architecture fundamentals', 50, 15, 0, NULL, NOW()),
('Testing & QA', 'Unit testing, integration testing, automation', 50, 10, 0, NULL, NOW());

-- Get course IDs
SET @course_adv_java = (SELECT course_id FROM training_courses WHERE course_name = 'Advanced Java' LIMIT 1);
SET @course_micro = (SELECT course_id FROM training_courses WHERE course_name = 'Microservices' LIMIT 1);
SET @course_devops = (SELECT course_id FROM training_courses WHERE course_name = 'DevOps Basics' LIMIT 1);
SET @course_cloud = (SELECT course_id FROM training_courses WHERE course_name = 'Cloud Computing' LIMIT 1);
SET @course_testing = (SELECT course_id FROM training_courses WHERE course_name = 'Testing & QA' LIMIT 1);

-- Get existing courses
SET @course_java = (SELECT course_id FROM training_courses WHERE course_name = 'Java Fundamentals' LIMIT 1);
SET @course_spring = (SELECT course_id FROM training_courses WHERE course_name = 'Spring Boot' LIMIT 1);
SET @course_react = (SELECT course_id FROM training_courses WHERE course_name = 'React & TypeScript' LIMIT 1);
SET @course_sql = (SELECT course_id FROM training_courses WHERE course_name = 'SQL & Database' LIMIT 1);
SET @course_comm = (SELECT course_id FROM training_courses WHERE course_name = 'Communication Skills' LIMIT 1);

-- ============================================================
-- TEST 2: BATCH COURSES - Link courses to batches
-- ============================================================

-- Batch 1 - Additional courses (total weightage: 25+25+20+15+15 = 100%)
INSERT IGNORE INTO batch_courses (batch_no, course_id, program_id, start_date, end_date, conducted_by, status, created_at) VALUES
(1, @course_adv_java, @prog_id, '2026-07-01 09:00:00', '2026-07-12 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_micro, @prog_id, '2026-07-15 09:00:00', '2026-07-26 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_devops, @prog_id, '2026-07-29 09:00:00', '2026-08-09 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_cloud, @prog_id, '2026-08-12 09:00:00', '2026-08-23 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_testing, @prog_id, '2026-08-26 09:00:00', '2026-09-06 17:00:00', @tc_user, 'PLANNED', NOW());

-- Batch 2 - Additional courses
INSERT IGNORE INTO batch_courses (batch_no, course_id, program_id, start_date, end_date, conducted_by, status, created_at) VALUES
(2, @course_adv_java, @prog_id, '2026-07-08 09:00:00', '2026-07-19 17:00:00', @tc_user, 'PLANNED', NOW()),
(2, @course_micro, @prog_id, '2026-07-22 09:00:00', '2026-08-02 17:00:00', @tc_user, 'PLANNED', NOW()),
(2, @course_devops, @prog_id, '2026-08-05 09:00:00', '2026-08-16 17:00:00', @tc_user, 'PLANNED', NOW()),
(2, @course_cloud, @prog_id, '2026-08-19 09:00:00', '2026-08-30 17:00:00', @tc_user, 'PLANNED', NOW()),
(2, @course_testing, @prog_id, '2026-09-02 09:00:00', '2026-09-13 17:00:00', @tc_user, 'PLANNED', NOW());

-- ============================================================
-- TEST 3: ARCHIVED COURSES - Test soft delete
-- ============================================================

-- Create a course to be archived
INSERT IGNORE INTO training_courses (course_name, description, min_score, weightage, is_communication, communication_template, created_at) VALUES
('[ARCHIVED] Legacy Framework', 'Old framework no longer in use', 50, 0, 0, NULL, NOW());

SET @course_archived = (SELECT course_id FROM training_courses WHERE course_name = '[ARCHIVED] Legacy Framework' LIMIT 1);

-- Link archived course to batch (to test validation)
INSERT IGNORE INTO batch_courses (batch_no, course_id, program_id, start_date, end_date, conducted_by, status, created_at) VALUES
(1, @course_archived, @prog_id, '2026-04-01 09:00:00', '2026-04-05 17:00:00', @tc_user, 'COMPLETED', NOW());

-- ============================================================
-- TEST 4: TRAINING SCORES - Test score recording
-- ============================================================

-- Get student IDs from batch allocations
SET @s1 = (SELECT student_id FROM batch_allocations WHERE batch_number = 1 LIMIT 1);
SET @s2 = (SELECT student_id FROM batch_allocations WHERE batch_number = 1 LIMIT 1 OFFSET 1);
SET @s3 = (SELECT student_id FROM batch_allocations WHERE batch_number = 1 LIMIT 1 OFFSET 2);
SET @s4 = (SELECT student_id FROM batch_allocations WHERE batch_number = 2 LIMIT 1);
SET @s5 = (SELECT student_id FROM batch_allocations WHERE batch_number = 2 LIMIT 1 OFFSET 1);
SET @s6 = (SELECT student_id FROM batch_allocations WHERE batch_number = 2 LIMIT 1 OFFSET 2);

-- Add scores for Advanced Java (to test course with scores cannot be deleted)
INSERT IGNORE INTO training_scores (course_id, student_id, score, review, status, reviewed_by, created_at) VALUES
(@course_adv_java, @s1, 85, 'Excellent understanding of design patterns', 'EXCELLENT', @tc_user, NOW()),
(@course_adv_java, @s2, 92, 'Outstanding performance in all topics', 'EXCELLENT', @tc_user, NOW()),
(@course_adv_java, @s3, 72, 'Good grasp of concepts, needs practice', 'GOOD', @tc_user, NOW()),
(@course_adv_java, @s4, 88, 'Very good performance', 'EXCELLENT', @tc_user, NOW()),
(@course_adv_java, @s5, 65, 'Meets minimum requirements', 'AVERAGE', @tc_user, NOW()),
(@course_adv_java, @s6, 95, 'Outstanding in all areas', 'EXCELLENT', @tc_user, NOW());

-- Add scores for Microservices
INSERT IGNORE INTO training_scores (course_id, student_id, score, review, status, reviewed_by, created_at) VALUES
(@course_micro, @s1, 80, 'Good understanding of microservices architecture', 'GOOD', @tc_user, NOW()),
(@course_micro, @s2, 89, 'Excellent implementation skills', 'EXCELLENT', @tc_user, NOW()),
(@course_micro, @s3, 68, 'Needs more practice with service communication', 'AVERAGE', @tc_user, NOW());

-- ============================================================
-- TEST 5: YEAR FILTERING - Create 2027 program for testing
-- ============================================================

-- Create 2027 program
INSERT IGNORE INTO training_programs (cycle_id, program_name, program_year, capacity, number_of_batches, location, status, created_at) VALUES
(@cycle_id, '2027 Graduate Training Program', 2027, 25, 1, 'BANGALORE', true, NOW());

SET @prog_2027 = (SELECT program_id FROM training_programs WHERE program_name = '2027 Graduate Training Program' LIMIT 1);

-- Add courses to 2027 program
INSERT IGNORE INTO batch_courses (batch_no, course_id, program_id, start_date, end_date, conducted_by, status, created_at) VALUES
(1, @course_java, @prog_2027, '2027-05-05 09:00:00', '2027-05-16 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_spring, @prog_2027, '2027-05-19 09:00:00', '2027-05-30 17:00:00', @tc_user, 'PLANNED', NOW()),
(1, @course_react, @prog_2027, '2027-06-02 09:00:00', '2027-06-13 17:00:00', @tc_user, 'PLANNED', NOW());

-- ============================================================
-- TEST 6: COMMUNICATION COURSES - Test communication template
-- ============================================================

-- Add communication course with detailed template
INSERT IGNORE INTO training_courses (course_name, description, min_score, weightage, is_communication, communication_template, created_at) VALUES
('Advanced Communication', 'Advanced professional communication and leadership', 50, 0, 1, '[{"name":"Presentation","maxScore":40},{"name":"Email Writing","maxScore":30},{"name":"Group Discussion","maxScore":30}]', NOW());

SET @course_adv_comm = (SELECT course_id FROM training_courses WHERE course_name = 'Advanced Communication' LIMIT 1);

-- Link to batch
INSERT IGNORE INTO batch_courses (batch_no, course_id, program_id, start_date, end_date, conducted_by, status, created_at) VALUES
(1, @course_adv_comm, @prog_id, '2026-09-09 14:00:00', '2026-09-20 15:00:00', @tc_user, 'PLANNED', NOW());

-- Add communication scores with breakdown
INSERT IGNORE INTO training_scores (course_id, student_id, score, review, status, reviewed_by, communication_breakdown, created_at) VALUES
(@course_adv_comm, @s1, 85, 'Excellent communication skills', 'EXCELLENT', @tc_user, '[{"name":"Presentation","score":32,"maxScore":40},{"name":"Email Writing","score":28,"maxScore":30},{"name":"Group Discussion","score":25,"maxScore":30}]', NOW()),
(@course_adv_comm, @s2, 92, 'Outstanding communicator', 'EXCELLENT', @tc_user, '[{"name":"Presentation","score":38,"maxScore":40},{"name":"Email Writing","score":29,"maxScore":30},{"name":"Group Discussion","score":25,"maxScore":30}]', NOW());

-- ============================================================
-- TEST 7: LEAVE REQUESTS - Additional test data
-- ============================================================

INSERT IGNORE INTO leave_requests (student_id, from_date, to_date, leave_type, reason, status, remarks, reviewed_by, reviewed_at, applied_at) VALUES
(@s1, '2026-06-15', '2026-06-17', 'PERSONAL', 'Wedding ceremony', 'PENDING', NULL, NULL, NULL, NOW()),
(@s2, '2026-06-20', '2026-06-20', 'SICK', 'Medical appointment', 'APPROVED', 'Approved. Submit medical certificate.', @tc_user, NOW(), NOW()),
(@s4, '2026-07-01', '2026-07-05', 'EMERGENCY', 'Family emergency', 'PENDING', NULL, NULL, NULL, NOW());

-- ============================================================
-- TEST 8: WARNINGS - Additional test data
-- ============================================================

INSERT IGNORE INTO intern_warnings (student_id, issued_by, warning_type, severity, message, course_id, status, issued_at) VALUES
(@s1, @tc_user, 'PERFORMANCE', 'MODERATE', 'Your Advanced Java score is 85/100. Ensure you maintain this level in upcoming assessments.', @course_adv_java, 'ACTIVE', NOW()),
(@s4, @tc_user, 'ATTENDANCE', 'SEVERE', 'Your attendance has dropped to 85%. Please improve attendance to meet the 90% requirement.', NULL, 'ACTIVE', NOW()),
(@s5, @tc_user, 'PERFORMANCE', 'SEVERE', 'Your Microservices score is 68/100, below the minimum threshold of 75%. Attend remedial sessions immediately.', @course_micro, 'ACTIVE', NOW());

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

SELECT '=== ACADEMY TEST SEED VERIFICATION ===' AS '';

SELECT 'Training Programs' AS entity, COUNT(*) AS total FROM training_programs WHERE cycle_id = @cycle_id;
SELECT 'Training Courses' AS entity, COUNT(*) AS total FROM training_courses;
SELECT 'Batch Courses' AS entity, COUNT(*) AS total FROM batch_courses WHERE program_id = @prog_id;
SELECT 'Training Scores' AS entity, COUNT(*) AS total FROM training_scores;
SELECT 'Leave Requests' AS entity, COUNT(*) AS total FROM leave_requests;
SELECT 'Intern Warnings' AS entity, COUNT(*) AS total FROM intern_warnings;

SELECT '' AS '';
SELECT 'Program Details:' AS '';
SELECT program_id, program_name, program_year, number_of_batches FROM training_programs WHERE cycle_id = @cycle_id;

SELECT '' AS '';
SELECT 'Courses with Weightage:' AS '';
SELECT course_id, course_name, weightage, is_communication FROM training_courses WHERE course_id IN (@course_java, @course_spring, @course_react, @course_sql, @course_adv_java, @course_micro, @course_devops, @course_cloud, @course_testing);

SELECT '' AS '';
SELECT 'Batch 1 Courses:' AS '';
SELECT bc.batch_no, tc.course_name, tc.weightage, bc.status FROM batch_courses bc JOIN training_courses tc ON bc.course_id = tc.course_id WHERE bc.program_id = @prog_id AND bc.batch_no = 1;

SELECT '' AS '';
SELECT 'Batch 2 Courses:' AS '';
SELECT bc.batch_no, tc.course_name, tc.weightage, bc.status FROM batch_courses bc JOIN training_courses tc ON bc.course_id = tc.course_id WHERE bc.program_id = @prog_id AND bc.batch_no = 2;

SELECT '' AS '';
SELECT 'Scores by Course:' AS '';
SELECT tc.course_name, COUNT(*) AS score_count, AVG(ts.score) AS avg_score FROM training_scores ts JOIN training_courses tc ON ts.course_id = tc.course_id GROUP BY tc.course_id, tc.course_name;

SELECT '' AS '';
SELECT '=== SEED COMPLETE ===' AS '';
