-- ============================================================
-- CLEAN COURSES SEED
-- Removes archived junk and seeds proper training courses
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Remove all scores
DELETE FROM training_scores;

-- Remove all batch_courses
DELETE FROM batch_courses;

-- Remove all courses
DELETE FROM training_courses;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Seed clean courses ──────────────────────────────────────
INSERT INTO training_courses (course_name, description, min_score, weightage, is_communication, communication_template, created_at) VALUES
('Java Fundamentals',    'Core Java concepts including OOP, collections, streams, and exception handling',  60, 25, 0, NULL, NOW()),
('Spring Boot',          'Spring Boot framework, REST APIs, JPA, security, and microservices basics',       60, 25, 0, NULL, NOW()),
('React & TypeScript',   'Frontend development with React 18, TypeScript, hooks, and state management',    60, 20, 0, NULL, NOW()),
('SQL & Database',       'Relational database design, MySQL queries, joins, indexing, and optimization',   60, 15, 0, NULL, NOW()),
('Python',               'Python programming fundamentals, data structures, and scripting',                60, 15, 0, NULL, NOW()),
('Communication Skills', 'Professional communication, presentation skills, and email etiquette',           50, NULL, 1, '[{"name":"Grammar","maxScore":20},{"name":"Proactiveness","maxScore":20},{"name":"Fluency","maxScore":10}]', NOW());

-- ── Link courses to batches (Program 2, Batches 1 & 2) ─────
SET @java   = (SELECT course_id FROM training_courses WHERE course_name = 'Java Fundamentals' LIMIT 1);
SET @spring = (SELECT course_id FROM training_courses WHERE course_name = 'Spring Boot' LIMIT 1);
SET @react  = (SELECT course_id FROM training_courses WHERE course_name = 'React & TypeScript' LIMIT 1);
SET @sql_db = (SELECT course_id FROM training_courses WHERE course_name = 'SQL & Database' LIMIT 1);
SET @python = (SELECT course_id FROM training_courses WHERE course_name = 'Python' LIMIT 1);
SET @comm   = (SELECT course_id FROM training_courses WHERE course_name = 'Communication Skills' LIMIT 1);

-- TC user (user_id 10 = Mozhi / Training Coordinator)
SET @tc_user = 10;

-- Batch 1 courses (started May 5, some completed, some active, some planned)
INSERT INTO batch_courses (batch_no, course_id, program_id, start_date, end_date, conducted_by, status, created_at) VALUES
(1, @java,   2, '2026-05-05 09:00:00', '2026-05-16 17:00:00', @tc_user, 'COMPLETED', NOW()),
(1, @spring, 2, '2026-05-19 09:00:00', '2026-05-30 17:00:00', @tc_user, 'ACTIVE',    NOW()),
(1, @react,  2, '2026-06-01 09:00:00', '2026-06-12 17:00:00', @tc_user, 'PLANNED',   NOW()),
(1, @sql_db, 2, '2026-06-15 09:00:00', '2026-06-20 17:00:00', @tc_user, 'PLANNED',   NOW()),
(1, @python, 2, '2026-06-22 09:00:00', '2026-06-27 17:00:00', @tc_user, 'PLANNED',   NOW()),
(1, @comm,   2, '2026-05-05 09:00:00', '2026-06-27 17:00:00', @tc_user, 'ACTIVE',    NOW()),

-- Batch 2 courses (started May 12)
(2, @java,   2, '2026-05-12 09:00:00', '2026-05-23 17:00:00', @tc_user, 'ACTIVE',    NOW()),
(2, @spring, 2, '2026-05-25 09:00:00', '2026-06-05 17:00:00', @tc_user, 'PLANNED',   NOW()),
(2, @react,  2, '2026-06-08 09:00:00', '2026-06-19 17:00:00', @tc_user, 'PLANNED',   NOW()),
(2, @sql_db, 2, '2026-06-22 09:00:00', '2026-06-27 17:00:00', @tc_user, 'PLANNED',   NOW()),
(2, @python, 2, '2026-06-29 09:00:00', '2026-07-04 17:00:00', @tc_user, 'PLANNED',   NOW()),
(2, @comm,   2, '2026-05-12 09:00:00', '2026-07-04 17:00:00', @tc_user, 'PLANNED',   NOW());

-- ── Seed scores for completed Java course (Batch 1 interns: student_id 1-3) ──
INSERT INTO training_scores (student_id, course_id, score, graded_by, created_at) VALUES
(1, @java, 82.5, @tc_user, NOW()),
(2, @java, 91.0, @tc_user, NOW()),
(3, @java, 58.0, @tc_user, NOW());

-- ── Seed communication scores (Batch 1 interns) ──
INSERT INTO training_scores (student_id, course_id, score, graded_by, communication_scores, created_at) VALUES
(1, @comm, 38.0, @tc_user, '[{"name":"Grammar","score":15},{"name":"Proactiveness","score":14},{"name":"Fluency","score":9}]', NOW()),
(2, @comm, 45.0, @tc_user, '[{"name":"Grammar","score":18},{"name":"Proactiveness","score":18},{"name":"Fluency","score":9}]', NOW()),
(3, @comm, 28.0, @tc_user, '[{"name":"Grammar","score":10},{"name":"Proactiveness","score":12},{"name":"Fluency","score":6}]', NOW());

-- ── Verify ──
SELECT course_id, course_name, weightage, is_communication FROM training_courses ORDER BY course_id;
SELECT batch_course_id, batch_no, course_id, status FROM batch_courses ORDER BY batch_no, batch_course_id;
SELECT score_id, student_id, course_id, score FROM training_scores ORDER BY student_id, course_id;
