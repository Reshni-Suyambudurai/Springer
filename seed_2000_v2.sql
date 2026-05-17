-- =====================================================================
-- SEED 2000+ CANDIDATES FOR PERFORMANCE TESTING
-- =====================================================================

-- 1. Create Drives
INSERT INTO drive_schedule (drive_name, description, drive_mode, status, start_date, end_date, location, cycle_id, institute_id, created_by, created_at)
VALUES
('Anna University Drive 2026', 'Campus hiring at Anna University', 'ON_CAMPUS', 'COMPLETED', '2026-02-15', '2026-02-17', 'Chennai', 3, 1, 2, NOW()),
('SSN College Drive 2026', 'Campus hiring at SSN', 'ON_CAMPUS', 'COMPLETED', '2026-03-01', '2026-03-03', 'Chennai', 3, 2, 2, NOW()),
('PSG Drive 2026', 'Campus hiring at PSG', 'ON_CAMPUS', 'IN_PROGRESS', '2026-04-10', '2026-04-12', 'Coimbatore', 3, 3, 2, NOW()),
('VIT Drive 2026', 'Campus hiring at VIT', 'ON_CAMPUS', 'PLANNED', '2026-05-20', '2026-05-22', 'Vellore', 3, 5, 2, NOW()),
('Off-Campus Pool 2026', 'Off-campus hiring pool', 'OFF_CAMPUS', 'IN_PROGRESS', '2026-01-01', '2026-12-31', 'Remote', 3, NULL, 2, NOW()),
('Anna University Drive 2025', 'Campus hiring 2025', 'ON_CAMPUS', 'COMPLETED', '2025-03-15', '2025-03-17', 'Chennai', 2, 1, 2, NOW());

SET @d1 = (SELECT drive_id FROM drive_schedule WHERE drive_name='Anna University Drive 2026' LIMIT 1);
SET @d2 = (SELECT drive_id FROM drive_schedule WHERE drive_name='SSN College Drive 2026' LIMIT 1);
SET @d3 = (SELECT drive_id FROM drive_schedule WHERE drive_name='PSG Drive 2026' LIMIT 1);
SET @d4 = (SELECT drive_id FROM drive_schedule WHERE drive_name='VIT Drive 2026' LIMIT 1);
SET @d5 = (SELECT drive_id FROM drive_schedule WHERE drive_name='Off-Campus Pool 2026' LIMIT 1);
SET @d6 = (SELECT drive_id FROM drive_schedule WHERE drive_name='Anna University Drive 2025' LIMIT 1);

-- 2. SEED 2100 CANDIDATES
DELIMITER //
DROP PROCEDURE IF EXISTS seed_candidates//
CREATE PROCEDURE seed_candidates()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_fn VARCHAR(50);
    DECLARE v_ln VARCHAR(50);
    DECLARE v_email VARCHAR(100);
    DECLARE v_mob VARCHAR(10);
    DECLARE v_cgpa DECIMAL(10,2);
    DECLARE v_deg VARCHAR(50);
    DECLARE v_dept VARCHAR(50);
    DECLARE v_inst INT;
    DECLARE v_cyc INT;
    DECLARE v_drv BIGINT;
    DECLARE v_stage VARCHAR(30);
    DECLARE v_py INT;
    DECLARE v_aad VARCHAR(12);
    DECLARE v_arr INT;
    
    WHILE i <= 2100 DO
        SET v_fn = ELT(1+(i%70), 'Arun','Bharath','Chitra','Deepak','Esha','Farhan','Gayathri','Hari','Ishita','Jayesh','Kavya','Lakshmi','Mohan','Nandini','Om','Priya','Rahul','Sanjay','Tara','Uma','Vikram','Waseem','Yamini','Zain','Aditi','Bhanu','Chinmay','Divya','Ekta','Faisal','Gita','Himanshu','Isha','Jatin','Keerthana','Lalitha','Mani','Neha','Omkar','Pallavi','Rajesh','Sahil','Tanvi','Usha','Varun','Yash','Aishwarya','Balaji','Chaitra','Dhruv','Shruti','Rohan','Sneha','Kiran','Meena','Anusha','Arvind','Brinda','Kartik','Revathi','Suresh','Pooja','Harsha','Sowmya','Ramya','Ashok','Manoj','Swathi','Vivek','Ananya');
        SET v_ln = ELT(1+(i%40), 'Kumar','Sharma','Patel','Reddy','Nair','Menon','Rao','Gupta','Singh','Joshi','Iyer','Pillai','Das','Bhat','Hegde','Shetty','Mishra','Verma','Chauhan','Agarwal','Pandey','Saxena','Thakur','Bose','Dutta','Ghosh','Mukherjee','Sen','Banerjee','Chatterjee','Rajan','Subramaniam','Venkatesh','Krishnan','Sundaram','Gopal','Naidu','Choudhury','Mahajan','Kapur');
        SET v_email = CONCAT(LOWER(v_fn),'.',LOWER(v_ln),i,'@testmail.com');
        SET v_mob = CONCAT('9',LPAD(FLOOR(RAND()*999999999),9,'0'));
        SET v_cgpa = ROUND(5.0+RAND()*5.0, 2);
        SET v_arr = IF(RAND()<0.7, 0, FLOOR(RAND()*4));
        SET v_aad = LPAD(100000000000+i, 12, '0');
        SET v_deg = ELT(1+(i%5), 'B.E.','B.Tech','M.E.','M.Tech','MCA');
        SET v_dept = ELT(1+(i%8), 'Computer Science','Information Technology','Electronics','Mechanical','Electrical','Civil','AI & ML','Data Science');
        
        IF i <= 1500 THEN
            SET v_cyc = 3; SET v_py = 2026;
            SET v_inst = 1+(i%8);
            SET v_drv = ELT(1+(i%5), @d1, @d2, @d3, @d4, @d5);
        ELSEIF i <= 1900 THEN
            SET v_cyc = 2; SET v_py = 2025;
            SET v_inst = 1+(i%6);
            SET v_drv = @d6;
        ELSE
            SET v_cyc = 1; SET v_py = 2024;
            SET v_inst = 1+(i%5);
            SET v_drv = NULL;
        END IF;
        
        IF i%20=0 THEN SET v_stage='DROPPED';
        ELSEIF i%15=0 THEN SET v_stage='REJECTED';
        ELSEIF i%10=0 THEN SET v_stage='JOINED';
        ELSEIF i%8=0 THEN SET v_stage='OFFER_ACCEPTED';
        ELSEIF i%6=0 THEN SET v_stage='OFFERED';
        ELSEIF i%4=0 THEN SET v_stage='SELECTED';
        ELSEIF i%3=0 THEN SET v_stage='SHORTLISTED';
        ELSE SET v_stage='APPLIED';
        END IF;
        
        INSERT INTO candidates (first_name, last_name, email, mobile, cgpa, degree, department,
            institute_id, cycle_id, drive_id, passout_year, aadhaar_number,
            history_of_arrears, is_eligible, application_stage, application_type,
            lifecycle_status, date_of_birth, created_at, updated_at)
        VALUES (v_fn, v_ln, v_email, v_mob, v_cgpa, v_deg, v_dept,
            v_inst, v_cyc, v_drv, v_py, v_aad,
            v_arr, IF(v_cgpa>=6.0 AND v_arr=0, TRUE, FALSE), v_stage, 'STANDARD',
            'ACTIVE', DATE_SUB(CURDATE(), INTERVAL (21+FLOOR(RAND()*4)) YEAR), NOW(), NOW());
        
        SET i = i+1;
    END WHILE;
END//
DELIMITER ;

CALL seed_candidates();
DROP PROCEDURE IF EXISTS seed_candidates;

-- 3. Document submissions for SELECTED+ candidates
INSERT INTO document_submissions (document_type_id, candidate_id, cycle_id, verification_status, created_at)
SELECT dt.document_type_id, c.candidate_id, c.cycle_id,
    CASE WHEN c.application_stage IN ('JOINED','OFFER_ACCEPTED') THEN 'APPROVED'
         WHEN c.application_stage='OFFERED' THEN 'COLLECTED'
         ELSE 'PENDING' END,
    NOW()
FROM candidates c
CROSS JOIN document_types dt
WHERE c.application_stage IN ('SELECTED','OFFERED','OFFER_ACCEPTED','JOINED')
AND c.email LIKE '%@testmail.com'
AND dt.document_type_id <= 3;

-- 4. Batch allocations for JOINED 2026 candidates
INSERT INTO batch_allocations (program_id, candidate_id, batch_number, attendance_percentage, performance, is_active, created_at)
SELECT 1, c.candidate_id, 1+(c.candidate_id%3),
    ROUND(60+RAND()*40, 2),
    ELT(1+(c.candidate_id%4), 'EXCELLENT','GOOD','NEED_LEARNING','PROJECT_READY'),
    TRUE, NOW()
FROM candidates c
WHERE c.application_stage='JOINED' AND c.cycle_id=3 AND c.email LIKE '%@testmail.com';

-- 5. Verify
SELECT 'Total Candidates' as metric, COUNT(*) as cnt FROM candidates
UNION ALL SELECT 'Cycle 2026', COUNT(*) FROM candidates WHERE cycle_id=3
UNION ALL SELECT 'Cycle 2025', COUNT(*) FROM candidates WHERE cycle_id=2
UNION ALL SELECT 'Cycle 2024', COUNT(*) FROM candidates WHERE cycle_id=1
UNION ALL SELECT 'APPLIED', COUNT(*) FROM candidates WHERE application_stage='APPLIED'
UNION ALL SELECT 'SELECTED', COUNT(*) FROM candidates WHERE application_stage='SELECTED'
UNION ALL SELECT 'OFFERED', COUNT(*) FROM candidates WHERE application_stage='OFFERED'
UNION ALL SELECT 'JOINED', COUNT(*) FROM candidates WHERE application_stage='JOINED'
UNION ALL SELECT 'DROPPED', COUNT(*) FROM candidates WHERE application_stage='DROPPED'
UNION ALL SELECT 'REJECTED', COUNT(*) FROM candidates WHERE application_stage='REJECTED'
UNION ALL SELECT 'Doc Submissions', COUNT(*) FROM document_submissions
UNION ALL SELECT 'Batch Allocations', COUNT(*) FROM batch_allocations
UNION ALL SELECT 'Drives', COUNT(*) FROM drive_schedule;
