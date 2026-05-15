-- Seed training scores for Batch 1 interns (student_id 1-3)
-- Java Fundamentals (course 21) - COMPLETED
INSERT INTO training_scores (student_id, course_id, score, status, reviewed_by, created_at) VALUES
(1, 21, 83, 'GOOD', 10, NOW()),
(2, 21, 91, 'EXCELLENT', 10, NOW()),
(3, 21, 58, 'BELOW_AVERAGE', 10, NOW());

-- Communication Skills (course 26)
INSERT INTO training_scores (student_id, course_id, score, status, reviewed_by, communication_breakdown, created_at) VALUES
(1, 26, 38, 'AVERAGE', 10, '[{"name":"Grammar","score":15},{"name":"Proactiveness","score":14},{"name":"Fluency","score":9}]', NOW()),
(2, 26, 45, 'GOOD', 10, '[{"name":"Grammar","score":18},{"name":"Proactiveness","score":18},{"name":"Fluency","score":9}]', NOW()),
(3, 26, 28, 'BELOW_AVERAGE', 10, '[{"name":"Grammar","score":10},{"name":"Proactiveness","score":12},{"name":"Fluency","score":6}]', NOW());

SELECT score_id, student_id, course_id, score, status FROM training_scores ORDER BY student_id, course_id;
