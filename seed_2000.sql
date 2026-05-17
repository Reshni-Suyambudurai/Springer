-- =====================================================================
-- SEED 2000+ CANDIDATES FOR PERFORMANCE TESTING
-- =====================================================================
-- This script adds:
-- 1. 6 drives across cycles (ON_CAMPUS and OFF_CAMPUS)
-- 2. 2100 candidates spread across cycles and institutes
-- 3. Document submissions for candidates
-- 4. Batch allocations for JOINED candidates
-- =====================================================================

-- 1. Create Drives (needed for candidates)
INSERT INTO drive_schedule (drive_name, description, drive_mode, drive_status, drive_date, location, cycle_id, institute_id, created_by, created_at)
VALUES
('Anna University Drive 2026', 'Campus hiring drive at Anna University', 'ON_CAMPUS', 'COMPLETED', '2026-02-15', 'Chennai', 3, 1, 2, NOW()),
('SSN College Drive 2026', 'Campus hiring drive at SSN', 'ON_CAMPUS', 'COMPLETED', '2026-03-01', 'Chennai', 3, 2, 2, NOW()),
('PSG Drive 2026', 'Campus hiring at PSG', 'ON_CAMPUS', 'IN_PROGRESS', '2026-04-10', 'Coimbatore', 3, 3, 2, NOW()),
('VIT Drive 2026', 'Campus hiring at VIT', 'ON_CAMPUS', 'PLANNED', '2026-05-20', 'Vellore', 3, 5, 2, NOW()),
('Off-Campus Pool 2026', 'General off-campus hiring', 'OFF_CAMPUS', 'IN_PROGRESS', '2026-01-01', 'Remote', 3, NULL, 2, NOW()),
('Anna University Drive 2025', 'Campus hiring 2025', 'ON_CAMPUS', 'COMPLETED', '2025-03-15', 'Chennai', 2, 1, 2, NOW());

-- Get drive IDs
SET @drive_anna_2026 = (SELECT drive_id FROM drive_schedule WHERE drive_name = 'Anna University Drive 2026' LIMIT 1);
SET @drive_ssn_2026 = (SELECT drive_id FROM drive_schedule WHERE drive_name = 'SSN College Drive 2026' LIMIT 1);
SET @drive_psg_2026 = (SELECT drive_id FROM drive_schedule WHERE drive_name = 'PSG Drive 2026' LIMIT 1);
SET @drive_vit_2026 = (SELECT drive_id FROM drive_schedule WHERE drive_name = 'VIT Drive 2026' LIMIT 1);
SET @drive_offcampus_2026 = (SELECT drive_id FROM drive_schedule WHERE drive_name = 'Off-Campus Pool 2026' LIMIT 1);
SET @drive_anna_2025 = (SELECT drive_id FROM drive_schedule WHERE drive_name = 'Anna University Drive 2025' LIMIT 1);

-- 2. SEED 2100 CANDIDATES using a procedure
DELIMITER //
DROP PROCEDURE IF EXISTS seed_candidates//
CREATE PROCEDURE seed_candidates()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_first_name VARCHAR(50);
    DECLARE v_last_name VARCHAR(50);
    DECLARE v_email VARCHAR(100);
    DECLARE v_mobile VARCHAR(10);
    DECLARE v_cgpa DECIMAL(10,2);
    DECLARE v_degree VARCHAR(50);
    DECLARE v_department VARCHAR(50);
    DECLARE v_institute_id INT;
    DECLARE v_cycle_id INT;
    DECLARE v_drive_id BIGINT;
    DECLARE v_stage VARCHAR(30);
    DECLARE v_passout_year INT;
    DECLARE v_aadhaar VARCHAR(12);
    DECLARE v_arrears INT;
    
    -- First names pool
    DECLARE first_names TEXT DEFAULT 'Arun,Bharath,Chitra,Deepak,Esha,Farhan,Gayathri,Hari,Ishita,Jayesh,Kavya,Lakshmi,Mohan,Nandini,Om,Priya,Rahul,Sanjay,Tara,Uma,Vikram,Waseem,Yamini,Zain,Aditi,Bhanu,Chinmay,Divya,Ekta,Faisal,Gita,Himanshu,Isha,Jatin,Keerthana,Lalitha,Mani,Neha,Omkar,Pallavi,Rajesh,Sahil,Tanvi,Usha,Varun,Yash,Aishwarya,Balaji,Chaitra,Dhruv,Shruti,Rohan,Sneha,Kiran,Meena,Anusha,Arvind,Brinda,Kartik,Revathi,Suresh,Pooja,Harsha,Sowmya,Ramya,Ashok,Manoj,Swathi,Vivek,Ananya';
    DECLARE last_names TEXT DEFAULT 'Kumar,Sharma,Patel,Reddy,Nair,Menon,Rao,Gupta,Singh,Joshi,Iyer,Pillai,Das,Bhat,Hegde,Shetty,Mishra,Verma,Chauhan,Agarwal,Pandey,Saxena,Thakur,Bose,Dutta,Ghosh,Mukherjee,Sen,Banerjee,Chatterjee,Rajan,Subramaniam,Venkatesh,Krishnan,Sundaram,Gopal,Naidu,Choudhury,Mahajan,Kapur';
    
    WHILE i <= 2100 DO
        -- Pick names cyclically
        SET v_first_name = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(first_names, ',', 1 + (i % 70)), ',', -1));
        SET v_last_name = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(last_names, ',', 1 + (i % 40)), ',', -1));
        SET v_email = CONCAT(LOWER(v_first_name), '.', LOWER(v_last_name), i, '@testmail.com');
        SET v_mobile = CONCAT('9', LPAD(FLOOR(RAND() * 999999999), 9, '0'));
        SET v_cgpa = ROUND(5.0 + RAND() * 5.0, 2);
        SET v_arrears = IF(RAND() < 0.7, 0, FLOOR(RAND() * 4));
        SET v_aadhaar = CONCAT(LPAD(100000000000 + i, 12, '0'));
        SET v_passout_year = IF(i <= 1500, 2026, 2025);
        
        -- Degree
        SET v_degree = ELT(1 + (i % 5), 'B.E.', 'B.Tech', 'M.E.', 'M.Tech', 'MCA');
        
        -- Department
        SET v_department = ELT(1 + (i % 8), 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Electrical', 'Civil', 'AI & ML', 'Data Science');
        
        -- Cycle (1500 in 2026, 400 in 2025, 200 in 2024)
        IF i <= 1500 THEN
            SET v_cycle_id = 3; -- 2026
            SET v_institute_id = 1 + (i % 8); -- institutes 1-8
            -- Distribute across 2026 drives
            IF i % 5 = 0 THEN SET v_drive_id = @drive_anna_2026;
            ELSEIF i % 5 = 1 THEN SET v_drive_id = @drive_ssn_2026;
            ELSEIF i % 5 = 2 THEN SET v_drive_id = @drive_psg_2026;
            ELSEIF i % 5 = 3 THEN SET v_drive_id = @drive_vit_2026;
            ELSE SET v_drive_id = @drive_offcampus_2026;
            END IF;
        ELSEIF i <= 1900 THEN
            SET v_cycle_id = 2; -- 2025
            SET v_institute_id = 1 + (i % 6);
            SET v_drive_id = @drive_anna_2025;
        ELSE
            SET v_cycle_id = 1; -- 2024
            SET v_institute_id = 1 + (i % 5);
            SET v_drive_id = NULL;
        END IF;
        
        -- Application stage distribution (realistic)
        IF i % 20 = 0 THEN SET v_stage = 'DROPPED';
        ELSEIF i % 15 = 0 THEN SET v_stage = 'REJECTED';
        ELSEIF i % 10 = 0 THEN SET v_stage = 'JOINED';
        ELSEIF i % 8 = 0 THEN SET v_stage = 'OFFER_ACCEPTED';
        ELSEIF i % 6 = 0 THEN SET v_stage = 'OFFERED';
        ELSEIF i % 4 = 0 THEN SET v_stage = 'SELECTED';
        ELSEIF i % 3 = 0 THEN SET v_stage = 'SHORTLISTED';
        ELSE SET v_stage = 'APPLIED';
        END IF;
        
        INSERT INTO candidates (first_name, last_name, email, mobile, cgpa, degree, department, 
            institute_id, cycle_id, drive_id, passout_year, aadhaar_number, 
            history_of_arrears, is_eligible, application_stage, application_type,
            lifecycle_status, date_of_birth, created_at, updated_at)
        VALUES (
            v_first_name, v_last_name, v_email, v_mobile, v_cgpa, v_degree, v_department,
            v_institute_id, v_cycle_id, v_drive_id, v_passout_year, v_aadhaar,
            v_arrears, IF(v_cgpa >= 6.0 AND v_arrears = 0, TRUE, FALSE), v_stage, 'STANDARD',
            'ACTIVE', DATE_SUB(CURDATE(), INTERVAL (21 + FLOOR(RAND() * 4)) YEAR), NOW(), NOW()
        );
        
        SET i = i + 1;
    END WHILE;
END//
DELIMITER ;

CALL seed_candidates();
DROP PROCEDURE IF EXISTS seed_candidates;

-- 3. SEED DOCUMENT SUBMISSIONS for SELECTED/OFFERED/JOINED candidates
-- Get document type IDs
INSERT INTO document_submissions (document_type_id, candidate_id, cycle_id, verification_status, submitted_at)
SELECT 
    dt.document_type_id,
    c.candidate_id,
    c.cycle_id,
    CASE 
        WHEN c.application_stage IN ('JOINED', 'OFFER_ACCEPTED') THEN 'VERIFIED'
        WHEN c.application_stage = 'OFFERED' THEN 'PENDING'
        ELSE 'PENDING'
    END,
    NOW()
FROM candidates c
CROSS JOIN document_types dt
WHERE c.application_stage IN ('SELECTED', 'OFFERED', 'OFFER_ACCEPTED', 'JOINED')
AND c.email LIKE '%@testmail.com'
AND dt.document_type_id <= 3
LIMIT 5000;

-- 4. SEED BATCH ALLOCATIONS for JOINED candidates in 2026 cycle
INSERT INTO batch_allocations (program_id, candidate_id, batch_number, attendance_percentage, performance, is_active, created_at)
SELECT 
    1, -- KA-ACADEMY26
    c.candidate_id,
    1 + (c.candidate_id % 3), -- batch 1, 2, or 3
    ROUND(60 + RAND() * 40, 2), -- 60-100% attendance
    ELT(1 + (c.candidate_id % 4), 'EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE'),
    TRUE,
    NOW()
FROM candidates c
WHERE c.application_stage = 'JOINED'
AND c.cycle_id = 3
AND c.email LIKE '%@testmail.com'
LIMIT 200;

-- Verify counts
SELECT 'Total Candidates' as metric, COUNT(*) as cnt FROM candidates
UNION ALL SELECT 'Cycle 2026', COUNT(*) FROM candidates WHERE cycle_id = 3
UNION ALL SELECT 'Cycle 2025', COUNT(*) FROM candidates WHERE cycle_id = 2
UNION ALL SELECT 'Cycle 2024', COUNT(*) FROM candidates WHERE cycle_id = 1
UNION ALL SELECT 'APPLIED', COUNT(*) FROM candidates WHERE application_stage = 'APPLIED'
UNION ALL SELECT 'SELECTED', COUNT(*) FROM candidates WHERE application_stage = 'SELECTED'
UNION ALL SELECT 'JOINED', COUNT(*) FROM candidates WHERE application_stage = 'JOINED'
UNION ALL SELECT 'Doc Submissions', COUNT(*) FROM document_submissions
UNION ALL SELECT 'Batch Allocations', COUNT(*) FROM batch_allocations
UNION ALL SELECT 'Drives', COUNT(*) FROM drive_schedule;
