-- =====================================================================
-- SPRINGER DATABASE CLEANUP FOR DEPLOYMENT
-- Keeps clean, realistic demo data for client presentation
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- =====================================================================
-- 1. DELETE 2024 CYCLE (old, not needed)
-- =====================================================================
DELETE FROM document_submissions WHERE candidate_id IN (SELECT candidate_id FROM candidates WHERE cycle_id = 1);
DELETE FROM candidates WHERE cycle_id = 1;
DELETE FROM drive_schedule WHERE cycle_id = 1;
DELETE FROM hiring_cycles WHERE cycle_id = 1;

-- =====================================================================
-- 2. REDUCE 2025 CANDIDATES (keep 20 with good stage mix)
-- =====================================================================
-- First delete docs for candidates we'll remove
DELETE FROM document_submissions WHERE candidate_id IN (
    SELECT candidate_id FROM candidates WHERE cycle_id = 2
    AND candidate_id NOT IN (
        SELECT candidate_id FROM (
            SELECT candidate_id FROM candidates WHERE cycle_id = 2 ORDER BY candidate_id LIMIT 20
        ) t
    )
);
-- Then delete the candidates
DELETE FROM candidates WHERE cycle_id = 2
AND candidate_id NOT IN (
    SELECT candidate_id FROM (
        SELECT candidate_id FROM candidates WHERE cycle_id = 2 ORDER BY candidate_id LIMIT 20
    ) t
);

-- =====================================================================
-- 3. REDUCE 2026 CANDIDATES
--    Keep: batch_allocation candidates (academy) + 12 per drive + first 10 no-drive
-- =====================================================================

-- Create temp table of candidates to KEEP
DROP TEMPORARY TABLE IF EXISTS keep_candidates;
CREATE TEMPORARY TABLE keep_candidates (candidate_id BIGINT PRIMARY KEY);

-- Keep all academy-linked candidates (batch_allocations)
INSERT IGNORE INTO keep_candidates SELECT DISTINCT candidate_id FROM batch_allocations;

-- Keep first 12 candidates per drive (gives nice dashboard numbers)
INSERT IGNORE INTO keep_candidates
SELECT candidate_id FROM (
    SELECT candidate_id, drive_id,
           ROW_NUMBER() OVER (PARTITION BY drive_id ORDER BY candidate_id) as rn
    FROM candidates WHERE cycle_id = 3 AND drive_id IS NOT NULL
) ranked WHERE rn <= 12;

-- Keep first 10 candidates with no drive (early applicants)
INSERT IGNORE INTO keep_candidates
SELECT candidate_id FROM (
    SELECT candidate_id FROM candidates
    WHERE cycle_id = 3 AND drive_id IS NULL
    AND candidate_id NOT IN (SELECT candidate_id FROM batch_allocations)
    ORDER BY candidate_id LIMIT 10
) t;

-- Delete document_submissions for candidates NOT in keep list (cycle 3)
DELETE FROM document_submissions WHERE candidate_id IN (
    SELECT candidate_id FROM candidates WHERE cycle_id = 3
) AND candidate_id NOT IN (SELECT candidate_id FROM keep_candidates);

-- Delete candidates NOT in keep list (cycle 3)
DELETE FROM candidates WHERE cycle_id = 3
AND candidate_id NOT IN (SELECT candidate_id FROM keep_candidates);

DROP TEMPORARY TABLE keep_candidates;

-- =====================================================================
-- 4. CLEAR DOCUMENT BLOB DATA (keeps metadata, removes huge files)
-- =====================================================================
UPDATE document_submissions SET uploaded_file = NULL;

-- =====================================================================
-- 5. REMOVE JUNK USERS
-- =====================================================================
-- Remove testuser_perf (id=28) and Test Intern (id=26)
-- First clean their batch_allocations references
DELETE FROM training_day_attendance WHERE student_id IN (SELECT student_id FROM batch_allocations WHERE candidate_id IN (SELECT candidate_id FROM candidates WHERE user_id IN (26, 28)));
DELETE FROM training_scores WHERE student_id IN (SELECT student_id FROM batch_allocations WHERE candidate_id IN (SELECT candidate_id FROM candidates WHERE user_id IN (26, 28)));
DELETE FROM leave_requests WHERE student_id IN (SELECT student_id FROM batch_allocations WHERE candidate_id IN (SELECT candidate_id FROM candidates WHERE user_id IN (26, 28)));
DELETE FROM intern_warnings WHERE student_id IN (SELECT student_id FROM batch_allocations WHERE candidate_id IN (SELECT candidate_id FROM candidates WHERE user_id IN (26, 28)));
DELETE FROM intern_certificates WHERE student_id IN (SELECT student_id FROM batch_allocations WHERE candidate_id IN (SELECT candidate_id FROM candidates WHERE user_id IN (26, 28)));
DELETE FROM intern_profiles WHERE user_id IN (26, 28);
DELETE FROM batch_allocations WHERE candidate_id IN (SELECT candidate_id FROM candidates WHERE user_id IN (26, 28));
DELETE FROM notifications WHERE sent_to IN (26, 28);
DELETE FROM users WHERE user_id IN (26, 28);

-- =====================================================================
-- 6. REMOVE JUNK TRAINING PROGRAM & DUPLICATE COURSE
-- =====================================================================
-- Delete junk program "jndedweqd" (id=3)
DELETE FROM batch_courses WHERE program_id = 3;
DELETE FROM batch_allocations WHERE program_id = 3;
DELETE FROM academy_events WHERE program_id = 3;
DELETE FROM training_programs WHERE program_id = 3;

-- Delete duplicate "java" course (id=27)
DELETE FROM batch_courses WHERE course_id = 27;
DELETE FROM training_scores WHERE course_id = 27;
DELETE FROM training_courses WHERE course_id = 27;

-- =====================================================================
-- 7. CLEAN NOTIFICATIONS (keep only 5 most recent)
-- =====================================================================
DELETE FROM notifications WHERE notification_id NOT IN (
    SELECT notification_id FROM (
        SELECT notification_id FROM notifications ORDER BY created_at DESC LIMIT 5
    ) t
);

-- =====================================================================
-- 8. CLEAN AUDIT TRAIL
-- =====================================================================
DELETE FROM audit_trail;

-- =====================================================================
-- 9. FIX CANDIDATE EMAILS TO LOOK PROFESSIONAL
--    Replace testmail.com with realistic kanini/gmail emails
-- =====================================================================
UPDATE candidates SET email = CONCAT(LOWER(first_name), '.', LOWER(last_name), candidate_id, '@gmail.com')
WHERE email LIKE '%@testmail.com';

-- =====================================================================
-- 10. REMOVE LINKCERTIFICATE doc type (not standard)
-- =====================================================================
DELETE FROM document_submissions WHERE document_type_id = 18;
DELETE FROM document_types WHERE document_type_id = 18;

-- =====================================================================
-- 11. CLEAN EMPTY TABLES (reset auto-increment)
-- =====================================================================
TRUNCATE TABLE applications;
TRUNCATE TABLE candidate_registration;
TRUNCATE TABLE candidate_skills;
TRUNCATE TABLE candidates_evaluations;
TRUNCATE TABLE drivepanel_assignments;
TRUNCATE TABLE hiring_demand;
TRUNCATE TABLE form;
TRUNCATE TABLE requisition_skills;
TRUNCATE TABLE institute_contacts;

-- =====================================================================
-- 12. CLEAN MANUAL_OVERRIDE (test data)
-- =====================================================================
DELETE FROM manual_override;

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

SELECT 'CLEANUP COMPLETE' as status;
