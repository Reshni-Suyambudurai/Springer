-- =====================================================================
-- Flyway Migration V2: Seed Data
-- =====================================================================
-- This script seeds the database with initial master data and email templates
-- Corresponds to DataLoader.java seed methods
-- 
-- IMPORTANT: Only inserts data if tables are empty (prevents duplicates)
-- =====================================================================

-- =====================================================================
-- 1. ROLES (Only if table is empty)
-- =====================================================================
INSERT INTO roles (role_name, created_at)
SELECT * FROM (
    SELECT 'TA_HEAD' as role_name, NOW() as created_at UNION ALL
    SELECT 'TA_MANAGER', NOW() UNION ALL
    SELECT 'HIRING_MANAGER', NOW() UNION ALL
    SELECT 'MEMBERS', NOW() UNION ALL
    SELECT 'HR_OPERATIONS', NOW() UNION ALL
    SELECT 'TRAINING_COORDINATOR', NOW() UNION ALL
    SELECT 'BU_SPOC', NOW() UNION ALL
    SELECT 'SYSTEM_ADMIN', NOW() UNION ALL
    SELECT 'INTERN', NOW()
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM roles LIMIT 1);

-- =====================================================================
-- 2. USERS (Only if table is empty)
-- =====================================================================
-- BCrypt hashes (strength 10) matching DataLoader passwords exactly:
-- password123  → $2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C
-- password@123 → $2b$10$gYIEhX824ocE20if5lJV/eA2.sTNgvZeaA9Khd/kJgGiRgRZJRRHW
INSERT INTO users (username, email, password, department, location, role_id, is_active, created_at)
SELECT * FROM (
    SELECT 'Sudha',             'sudha@kanini.com',     '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Talent Acquisition',   'Chennai',    (SELECT role_id FROM roles WHERE role_name = 'TA_HEAD'),              TRUE, NOW() UNION ALL
    SELECT 'Mozhi',             'mozhi@kanini.com',     '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Talent Acquisition',   'Bangalore',  (SELECT role_id FROM roles WHERE role_name = 'TA_MANAGER'),           TRUE, NOW() UNION ALL
    SELECT 'Priya',             'priya@kanini.com',     '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Talent Acquisition',   'Chennai',    (SELECT role_id FROM roles WHERE role_name = 'TA_MANAGER'),           TRUE, NOW() UNION ALL
    SELECT 'Parthiban',         'parthiban@kanini.com', '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Product Engineering',  'Bangalore',  (SELECT role_id FROM roles WHERE role_name = 'HIRING_MANAGER'),       TRUE, NOW() UNION ALL
    SELECT 'Ramesh',            'ramesh@kanini.com',    '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Product Engineering',  'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'MEMBERS'),              TRUE, NOW() UNION ALL
    SELECT 'Priya Rajagopalan', 'priya@kanini.com',     '$2b$10$gYIEhX824ocE20if5lJV/eA2.sTNgvZeaA9Khd/kJgGiRgRZJRRHW', 'Product Engineering',  'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'MEMBERS'),              TRUE, NOW() UNION ALL
    SELECT 'Mozhiarasan',       'mozhi@kanini.com',     '$2b$10$gYIEhX824ocE20if5lJV/eA2.sTNgvZeaA9Khd/kJgGiRgRZJRRHW', 'Product Engineering',  'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'MEMBERS'),              TRUE, NOW() UNION ALL
    SELECT 'Praveen Kumar',     'praveen@kanini.com',   '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Product Engineering',  'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'MEMBERS'),              TRUE, NOW() UNION ALL
    SELECT 'Admin',             'admin@kanini.com',     '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Data Analytics & AI',  'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'SYSTEM_ADMIN'),         TRUE, NOW() UNION ALL
    SELECT 'Lavanya',           'lavanya@kanini.com',   '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Data Analytics & AI',  'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'TRAINING_COORDINATOR'), TRUE, NOW() UNION ALL
    SELECT 'John',              'john@kanini.com',      '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Training',             'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'INTERN'),               TRUE, NOW() UNION ALL
    SELECT 'Joe',               'joe@kanini.com',       '$2b$10$MgPLyULhHlc01n01JfSx/ORzBuzBDQ1bpNsP/amJYaHk81.K6Um/C', 'Training',             'Coimbatore', (SELECT role_id FROM roles WHERE role_name = 'INTERN'),               TRUE, NOW()
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

-- =====================================================================
-- 3. HIRING CYCLES (Only if table is empty)
-- =====================================================================
INSERT INTO hiring_cycles (cycle_year, cycle_name, status, created_at)
SELECT * FROM (
    SELECT 2024, '2024 Campus Hiring', 'CLOSED', NOW() UNION ALL
    SELECT 2025, '2025 Campus Hiring', 'CLOSED', NOW() UNION ALL
    SELECT 2026, '2026 Campus Hiring', 'OPEN', NOW()
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM hiring_cycles LIMIT 1);

-- =====================================================================
-- 4. INSTITUTES (Only if table is empty)
-- =====================================================================
INSERT INTO institutes (institute_name, institute_tier, state, city, is_active, created_at)
SELECT * FROM (
    SELECT 'OTHERS', 'TIER_1', 'Tamil Nadu', 'Chennai', TRUE, NOW() UNION ALL
    SELECT 'Anna University', 'TIER_1', 'Tamil Nadu', 'Chennai', TRUE, NOW() UNION ALL
    SELECT 'SSN College of Engineering', 'TIER_1', 'Tamil Nadu', 'Chennai', TRUE, NOW() UNION ALL
    SELECT 'PSG College of Technology', 'TIER_2', 'Tamil Nadu', 'Coimbatore', TRUE, NOW() UNION ALL
    SELECT 'Amrita Vishwa Vidyapeetham', 'TIER_1', 'Tamil Nadu', 'Coimbatore', TRUE, NOW() UNION ALL
    SELECT 'VIT University', 'TIER_1', 'Tamil Nadu', 'Vellore', TRUE, NOW() UNION ALL
    SELECT 'SRM Institute of Science and Technology', 'TIER_2', 'Tamil Nadu', 'Chennai', TRUE, NOW() UNION ALL
    SELECT 'Karunya Institute of Technology', 'TIER_2', 'Tamil Nadu', 'Coimbatore', TRUE, NOW() UNION ALL
    SELECT 'CEG - College of Engineering Guindy', 'TIER_1', 'Tamil Nadu', 'Chennai', TRUE, NOW()
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM institutes LIMIT 1);

-- =====================================================================
-- 5. PROGRAMS (Only if table is empty)
-- =====================================================================
INSERT INTO programs (program_name)
SELECT * FROM (
    SELECT 'B_E' UNION ALL SELECT 'B_TECH' UNION ALL SELECT 'M_E' UNION ALL SELECT 'M_TECH' UNION ALL
    SELECT 'MBA' UNION ALL SELECT 'MCA' UNION ALL SELECT 'BCA' UNION ALL SELECT 'BBA' UNION ALL
    SELECT 'B_SC' UNION ALL SELECT 'M_SC' UNION ALL SELECT 'B_COM' UNION ALL SELECT 'M_COM' UNION ALL
    SELECT 'DIPLOMA' UNION ALL SELECT 'PHD'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM programs LIMIT 1);

-- =====================================================================
-- 6. INSTITUTE-PROGRAM RELATIONSHIPS (Only if table is empty)
-- =====================================================================
-- =====================================================================
-- 6. INSTITUTE-PROGRAM RELATIONSHIPS (Only if table is empty)
-- =====================================================================
-- Note: Using INSERT IGNORE for relationship tables as they depend on foreign keys
INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT * FROM (SELECT * FROM (
    SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Anna University'), (SELECT program_id FROM programs WHERE program_name = 'B_TECH') UNION ALL
    SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Anna University'), (SELECT program_id FROM programs WHERE program_name = 'M_TECH') UNION ALL
    SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Anna University'), (SELECT program_id FROM programs WHERE program_name = 'MBA') UNION ALL
    SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Anna University'), (SELECT program_id FROM programs WHERE program_name = 'PHD')
) AS data) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM institute_programs LIMIT 1);

INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SSN College of Engineering'), (SELECT program_id FROM programs WHERE program_name = 'B_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SSN College of Engineering'), (SELECT program_id FROM programs WHERE program_name = 'M_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SSN College of Engineering'), (SELECT program_id FROM programs WHERE program_name = 'M_TECH');

INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'PSG College of Technology'), (SELECT program_id FROM programs WHERE program_name = 'B_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'PSG College of Technology'), (SELECT program_id FROM programs WHERE program_name = 'M_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'PSG College of Technology'), (SELECT program_id FROM programs WHERE program_name = 'MBA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'PSG College of Technology'), (SELECT program_id FROM programs WHERE program_name = 'MCA');

INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Amrita Vishwa Vidyapeetham'), (SELECT program_id FROM programs WHERE program_name = 'B_TECH') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Amrita Vishwa Vidyapeetham'), (SELECT program_id FROM programs WHERE program_name = 'M_TECH') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Amrita Vishwa Vidyapeetham'), (SELECT program_id FROM programs WHERE program_name = 'MBA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Amrita Vishwa Vidyapeetham'), (SELECT program_id FROM programs WHERE program_name = 'PHD') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Amrita Vishwa Vidyapeetham'), (SELECT program_id FROM programs WHERE program_name = 'MCA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Amrita Vishwa Vidyapeetham'), (SELECT program_id FROM programs WHERE program_name = 'M_SC');

INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'VIT University'), (SELECT program_id FROM programs WHERE program_name = 'B_TECH') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'VIT University'), (SELECT program_id FROM programs WHERE program_name = 'M_TECH') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'VIT University'), (SELECT program_id FROM programs WHERE program_name = 'MBA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'VIT University'), (SELECT program_id FROM programs WHERE program_name = 'PHD') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'VIT University'), (SELECT program_id FROM programs WHERE program_name = 'MCA');

INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SRM Institute of Science and Technology'), (SELECT program_id FROM programs WHERE program_name = 'B_TECH') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SRM Institute of Science and Technology'), (SELECT program_id FROM programs WHERE program_name = 'M_TECH') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SRM Institute of Science and Technology'), (SELECT program_id FROM programs WHERE program_name = 'MBA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SRM Institute of Science and Technology'), (SELECT program_id FROM programs WHERE program_name = 'BCA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SRM Institute of Science and Technology'), (SELECT program_id FROM programs WHERE program_name = 'MCA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'SRM Institute of Science and Technology'), (SELECT program_id FROM programs WHERE program_name = 'BBA');

INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Karunya Institute of Technology'), (SELECT program_id FROM programs WHERE program_name = 'B_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Karunya Institute of Technology'), (SELECT program_id FROM programs WHERE program_name = 'M_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Karunya Institute of Technology'), (SELECT program_id FROM programs WHERE program_name = 'MBA') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'Karunya Institute of Technology'), (SELECT program_id FROM programs WHERE program_name = 'DIPLOMA');

INSERT IGNORE INTO institute_programs (institute_id, program_id)
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'CEG - College of Engineering Guindy'), (SELECT program_id FROM programs WHERE program_name = 'B_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'CEG - College of Engineering Guindy'), (SELECT program_id FROM programs WHERE program_name = 'M_E') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'CEG - College of Engineering Guindy'), (SELECT program_id FROM programs WHERE program_name = 'M_TECH') UNION ALL
SELECT (SELECT institute_id FROM institutes WHERE institute_name = 'CEG - College of Engineering Guindy'), (SELECT program_id FROM programs WHERE program_name = 'PHD');

-- =====================================================================
-- 7. SKILLS (Only if table is empty)
-- =====================================================================
-- =====================================================================
-- 7. SKILLS (Only if table is empty)
-- =====================================================================
-- Technical Skills
INSERT IGNORE INTO skills (skill_name, category)
SELECT * FROM (
    SELECT 'Java', 'TECHNICAL' UNION ALL SELECT 'Python', 'TECHNICAL' UNION ALL SELECT 'JavaScript', 'TECHNICAL' UNION ALL
    SELECT 'C++', 'TECHNICAL' UNION ALL SELECT 'C#', 'TECHNICAL' UNION ALL SELECT 'Go', 'TECHNICAL' UNION ALL SELECT 'Rust', 'TECHNICAL' UNION ALL
    SELECT 'React', 'TECHNICAL' UNION ALL SELECT 'Angular', 'TECHNICAL' UNION ALL SELECT 'Vue.js', 'TECHNICAL' UNION ALL
    SELECT 'Node.js', 'TECHNICAL' UNION ALL SELECT 'Spring Boot', 'TECHNICAL' UNION ALL SELECT 'HTML', 'TECHNICAL' UNION ALL SELECT 'CSS', 'TECHNICAL' UNION ALL
    SELECT 'MySQL', 'TECHNICAL' UNION ALL SELECT 'PostgreSQL', 'TECHNICAL' UNION ALL SELECT 'MongoDB', 'TECHNICAL' UNION ALL
    SELECT 'Oracle', 'TECHNICAL' UNION ALL SELECT 'SQL Server', 'TECHNICAL' UNION ALL
    SELECT 'AWS', 'TECHNICAL' UNION ALL SELECT 'Azure', 'TECHNICAL' UNION ALL SELECT 'Docker', 'TECHNICAL' UNION ALL
    SELECT 'Kubernetes', 'TECHNICAL' UNION ALL SELECT 'Jenkins', 'TECHNICAL' UNION ALL SELECT 'Git', 'TECHNICAL' UNION ALL
    SELECT 'Machine Learning', 'TECHNICAL' UNION ALL SELECT 'Data Analysis', 'TECHNICAL' UNION ALL SELECT 'TensorFlow', 'TECHNICAL' UNION ALL
    SELECT 'PyTorch', 'TECHNICAL' UNION ALL SELECT 'Pandas', 'TECHNICAL' UNION ALL
    SELECT 'Manual Testing', 'TECHNICAL' UNION ALL SELECT 'Selenium', 'TECHNICAL' UNION ALL SELECT 'JUnit', 'TECHNICAL' UNION ALL
    SELECT 'Jest', 'TECHNICAL' UNION ALL SELECT 'Cypress', 'TECHNICAL' UNION ALL
    SELECT 'ServiceNow', 'TECHNICAL' UNION ALL SELECT 'Salesforce', 'TECHNICAL' UNION ALL SELECT 'SAP', 'TECHNICAL'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM skills LIMIT 1);

-- Soft Skills
INSERT IGNORE INTO skills (skill_name, category)
SELECT * FROM (
    SELECT 'Communication', 'SOFT_SKILL' UNION ALL SELECT 'Problem Solving', 'SOFT_SKILL' UNION ALL
    SELECT 'Leadership', 'SOFT_SKILL' UNION ALL SELECT 'Teamwork', 'SOFT_SKILL' UNION ALL
    SELECT 'Time Management', 'SOFT_SKILL' UNION ALL SELECT 'Adaptability', 'SOFT_SKILL' UNION ALL
    SELECT 'Critical Thinking', 'SOFT_SKILL' UNION ALL SELECT 'Creativity', 'SOFT_SKILL'
) AS tmp2;

-- =====================================================================
-- 8. ROUND TEMPLATES (Only if table is empty)
-- =====================================================================
INSERT IGNORE INTO round_templates (round_no, round_name, outoff_score, min_score, weightage, sections, is_active, created_at, created_by)
SELECT * FROM (
    SELECT 1, 'Aptitude Round', 120, 80, 40, '[{"sectionName":"Technical","outOf":30},{"sectionName":"Aptitude","outOf":20},{"sectionName":"Verbal","outOf":20},{"sectionName":"Logical","outOf":20},{"sectionName":"Coding","outOf":30}]', TRUE, NOW(), (SELECT MIN(user_id) FROM users) UNION ALL
    SELECT 2, 'Communication Round', 100, 70, 40, '[{"sectionName":"Listening","outOf":30},{"sectionName":"Writing","outOf":30},{"sectionName":"Speaking","outOf":40}]', TRUE, NOW(), (SELECT MIN(user_id) FROM users) UNION ALL
    SELECT 3, 'Technical Round', 100, 70, 30, '[{"sectionName":"Problem_Solving","outOf":30},{"sectionName":"Coding_Proficiency","outOf":30},{"sectionName":"Communication_Skill","outOf":40}]', TRUE, NOW(), (SELECT MIN(user_id) FROM users)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM round_templates LIMIT 1);

-- =====================================================================
-- 9. EMAIL TEMPLATES (Always update existing or insert new)
-- =====================================================================

-- Template 1: Document Submission Link
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('DOCUMENT_SUBMISSION_LINK', 
'Action Required: Submit Your Documents – Kanini Software Solutions',
'<!DOCTYPE html><html lang=''en''><head><meta charset=''UTF-8''><meta name=''viewport'' content=''width=device-width,initial-scale=1.0''><title>Document Submission</title></head><body style=''margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;''><table width=''100%'' cellpadding=''0'' cellspacing=''0'' style=''background-color:#f0f2f5;padding:40px 20px;''><tr><td align=''center''><table width=''600'' cellpadding=''0'' cellspacing=''0'' style=''background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);''><tr><td style=''background:#0F4C81;padding:28px 40px;''><table width=''100%'' cellpadding=''0'' cellspacing=''0''><tr><td><img src=''cid-right-logo'' alt=''Kanini Software Solutions'' style=''height:36px;display:block;''></td><td align=''right'' style=''color:rgba(255,255,255,0.7);font-size:12px;''>Talent Acquisition</td></tr></table></td></tr><tr><td style=''padding:40px 40px 32px;''><p style=''margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;''>Document Submission Request</p><h2 style=''margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;''>Hello, {{CANDIDATE_NAME}}</h2><p style=''margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;''>Congratulations on your selection at <strong>Kanini Software Solutions</strong>. As part of your onboarding process, we kindly request you to submit the following documents at your earliest convenience.</p><table width=''100%'' cellpadding=''0'' cellspacing=''0'' style=''background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;margin:0 0 28px;''><tr><td style=''padding:16px 20px;border-bottom:1px solid #E5E7EB;''><p style=''margin:0;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;''>Required Documents</p></td></tr><tr><td style=''padding:16px 20px;''><ul style=''margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;''>{{DOCUMENT_LIST}}</ul></td></tr></table><table cellpadding=''0'' cellspacing=''0'' style=''margin:0 0 28px;''><tr><td style=''background:#0F4C81;border-radius:6px;''><a href=''{{SUBMISSION_LINK}}'' style=''display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;''>Submit Documents &rarr;</a></td></tr></table><table width=''100%'' cellpadding=''0'' cellspacing=''0'' style=''background:#FEF3C7;border:1px solid #FCD34D;border-radius:6px;margin:0 0 28px;''><tr><td style=''padding:12px 16px;''><p style=''margin:0;font-size:13px;color:#92400E;''><strong>&#9888; Submission Deadline:</strong>&nbsp;{{DEADLINE_DATE}}</p></td></tr></table><p style=''margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;''>If you face any issues accessing the link or have questions, please reach out to us at <a href=''mailto:hrops.india@kanini.com'' style=''color:#0F4C81;text-decoration:none;font-weight:600;''>hrops.india@kanini.com</a>.</p><p style=''margin:24px 0 0;font-size:14px;color:#374151;''>Warm regards,</p></td></tr><tr><td style=''padding:0 40px 32px;''><img src=''cid-signature'' alt=''HR Team Signature'' style=''height:60px;display:block;''></td></tr><tr><td style=''background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;''><table width=''100%'' cellpadding=''0'' cellspacing=''0''><tr><td style=''font-size:11px;color:#9CA3AF;line-height:1.6;''>This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>Please do not reply to this email. For assistance, contact <a href=''mailto:hrops.india@kanini.com'' style=''color:#6B7280;''>hrops.india@kanini.com</a></td><td align=''right'' style=''font-size:11px;color:#9CA3AF;white-space:nowrap;''>&copy; 2026 Kanini Software Solutions</td></tr></table></td></tr></table></td></tr></table></body></html>');

-- Template 2: Document Rejection
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('DOCUMENT_REJECTION',
'Document Resubmission Required – Kanini Software Solutions',
'<!DOCTYPE html><html lang=''en''><head><meta charset=''UTF-8''><meta name=''viewport'' content=''width=device-width,initial-scale=1.0''><title>Document Resubmission</title></head><body style=''margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;''><table width=''100%'' cellpadding=''0'' cellspacing=''0'' style=''background-color:#f0f2f5;padding:40px 20px;''><tr><td align=''center''><table width=''600'' cellpadding=''0'' cellspacing=''0'' style=''background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);''><tr><td style=''background:#0F4C81;padding:28px 40px;''><table width=''100%'' cellpadding=''0'' cellspacing=''0''><tr><td><img src=''cid-right-logo'' alt=''Kanini Software Solutions'' style=''height:36px;display:block;''></td><td align=''right'' style=''color:rgba(255,255,255,0.7);font-size:12px;''>Talent Acquisition</td></tr></table></td></tr><tr><td style=''padding:40px 40px 32px;''><p style=''margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;''>Document Review Update</p><h2 style=''margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;''>Hello, {{CANDIDATE_NAME}}</h2><p style=''margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;''>Thank you for submitting your documents. After review, we found that the following document requires resubmission.</p><table width=''100%'' cellpadding=''0'' cellspacing=''0'' style=''background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;margin:0 0 20px;''><tr><td style=''padding:16px 20px;border-bottom:1px solid #FECACA;''><p style=''margin:0;font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;''>Document Rejected</p></td></tr><tr><td style=''padding:16px 20px;''><p style=''margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;''>{{DOCUMENT_TYPE}}</p></td></tr></table><table width=''100%'' cellpadding=''0'' cellspacing=''0'' style=''background:#F9FAFB;border:1px solid #E5E7EB;border-left:4px solid #6B7280;border-radius:0 6px 6px 0;margin:0 0 28px;''><tr><td style=''padding:16px 20px;''><p style=''margin:0 0 4px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;''>Reason for Rejection</p><p style=''margin:0;font-size:14px;color:#374151;line-height:1.6;''>{{REJECTION_REASON}}</p></td></tr></table><p style=''margin:0 0 16px;font-size:14px;color:#374151;''>Please upload a corrected version using the button below:</p><table cellpadding=''0'' cellspacing=''0'' style=''margin:0 0 28px;''><tr><td style=''background:#0F4C81;border-radius:6px;''><a href=''{{RESUBMIT_LINK}}'' style=''display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;''>Resubmit Document &rarr;</a></td></tr></table><p style=''margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;''>For any queries, please contact us at <a href=''mailto:hrops.india@kanini.com'' style=''color:#0F4C81;text-decoration:none;font-weight:600;''>hrops.india@kanini.com</a>.</p><p style=''margin:24px 0 0;font-size:14px;color:#374151;''>Warm regards,</p></td></tr><tr><td style=''padding:0 40px 32px;''><img src=''cid-signature'' alt=''HR Team Signature'' style=''height:60px;display:block;''></td></tr><tr><td style=''background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;''><table width=''100%'' cellpadding=''0'' cellspacing=''0''><tr><td style=''font-size:11px;color:#9CA3AF;line-height:1.6;''>This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>Please do not reply to this email. For assistance, contact <a href=''mailto:hrops.india@kanini.com'' style=''color:#6B7280;''>hrops.india@kanini.com</a></td><td align=''right'' style=''font-size:11px;color:#9CA3AF;white-space:nowrap;''>&copy; 2026 Kanini Software Solutions</td></tr></table></td></tr></table></td></tr></table></body></html>');

-- Template 3: Kanini On-Campus Drive
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('KANINI ONCAMPUS DRIVE',
'Request to Conduct Kanini On-Campus Recruitment Drive',
'<p>Dear Sir/Madam,</p><p> Greetings from Kanini Software Solutions.</p><p>We hope you are doing well.</p><p>We are pleased to express our interest in conducting an <strong>On-Campus Recruitment Drive</strong> at your esteemed institution for the current graduating batch.</p><p>At Kanini Software Solutions, we continuously seek talented and enthusiastic graduates who can contribute to our growing organization. We believe that your institution has a strong pool of capable students, and we would be delighted to engage with them through this recruitment initiative.</p><p><br></p><p>Please find the proposed drive details below:</p><p>Drive Name: {{DRIVE_NAME}}</p><p>Proposed Drive Date: {{DRIVE_DATE}}</p><p>Venue/Location: {{LOCATION}}</p><p>Eligible Departments: {{ELIGIBLE_DEPARTMENTS}}</p><p><br></p><p>We kindly request your support in facilitating the recruitment process and coordinating the necessary arrangements for the drive.</p><p>Additionally, we request you to share the list of eligible students in the prescribed format for further processing.</p><p>Please let us know your confirmation and any additional requirements from our end to proceed with the coordination activities.</p><p>For any queries or further discussion, feel free to contact us at <a href="mailto:hrops.india@kanini.com" rel="noopener noreferrer" target="_blank">hrops.india@kanini.com</a>.</p><p>We look forward to collaborating with your institution.</p><p style="text-align: right;"><br></p><p style="text-align: right;">Warm regards,</p><p style="text-align: right;">Kanini Talent Acquisition Team</p><p style="text-align: right;">Kanini Software Solutions</p>');

-- Template 4: Kanini Off-Campus Drive
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('KANINI OFFCAMPUS DRIVE',
'Invitation to Participate in Kanini Off-Campus Recruitment Drive',
'<p>Dear Sir/Madam,</p><p><br></p><p><strong>Greetings from Kanini Software Solutions.</strong></p><p>We are pleased to invite students from your esteemed institution to participate in our upcoming Off-Campus Recruitment Drive.</p><p>The drive is being organized to identify talented and aspiring graduates for opportunities at Kanini Software Solutions. We would be grateful if your institution could encourage eligible students to participate in the recruitment process.</p><p><br></p><p>Please find the drive details below:</p><p><br></p><p>Drive Date:</p><p>Drive Location:</p><p>Registration Deadline:</p><p><br></p><p>Kindly share the attached student details template with interested candidates and request them to complete the required information accurately.</p><p><br></p><p>Eligible students are advised to carry the necessary documents during the recruitment process, including:</p><p><br></p><p>• Updated Resume</p><p>• College ID Card</p><p>• Personal laptop</p><p><br></p><p>For any queries or clarification, please contact us at <a href="mailto:hrops.india@kanini.com">hrops.india@kanini.com</a>.</p><p><br></p><p>We look forward to your institution''s participation and continued collaboration.</p><p style="text-align: right;"><br></p><p style="text-align: right;">Warm regards,</p><p style="text-align: right;"><em>Kanini Talent Acquisition Team</em></p><p style="text-align: right;"><em>Kanini Software Solutions</em></p><p style="text-align: right;"><br></p><p style="text-align: right;"><img src="/siganture.png"></p>');

-- Template 5: Kanini Shortlisted Invite
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('KANINI SHORTLISTED INVITE',
'Shortlisted for Drive – Kanini Software Solutions',
'<p>Dear {{CANDIDATE_NAME}},</p><p>Greetings from Kanini Software Solutions.</p><p>We are pleased to inform you that you have been successfully shortlisted to participate in the <strong>{{DRIVE_NAME}}</strong> recruitment drive.</p><p><br></p><p>Please find your drive details below:</p><p><em>Registration Code: </em><strong><em>{{REGISTRATION_CODE}}</em></strong></p><p><em>Drive Date: </em><strong><em>{{START_DATE}}</em></strong></p><p><em>Reporting Batch Time: </em><strong><em>{{BATCH_TIME}}</em></strong></p><p><em>Drive Location: </em><strong><em>{{LOCATION}}</em></strong></p><p><br></p><p>You are requested to report to the venue on time and carry the following documents for verification:</p><p><br></p><p>• Updated Resume</p><p>• College ID Card</p><p>• Personal Laptop for first round</p><p><br></p><p>Kindly ensure that you adhere to the reporting time and maintain professional attire throughout the recruitment process.</p><p>Please keep your Registration Code handy for future communication and verification purposes.</p><p><br></p><p>For any queries or assistance, feel free to contact us at <a href="mailto:hrops.india@kanini.com">hrops.india@kanini.com</a>.</p><p>We wish you all the very best and look forward to meeting you during the drive.</p><p><br></p><p style="text-align: right;">Warm regards,</p><p style="text-align: right;">Kanini Talent Acquisition Team</p><p style="text-align: right;">Kanini Software Solutions</p><p style="text-align: right;"><img src="/siganture.png"></p>');

-- Template 6: Round Selected
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('ROUND SELECTED',
'KANINI SELECTION UPDATE',
'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>We are pleased to inform you that you have been selected in Round {{ROUND_NO}} of the recruitment process.</p><p><br></p><p>Further details will be shared shortly. Kindly stay prepared and keep checking your email for updates.</p><p><br></p><p>We congratulate you on your progress and wish you the very best.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src="/siganture.png"></p>');

-- Template 7: Round Hold
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('ROUND HOLD',
'KANINI DRIVE UPDATE',
'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>Thank you for participating in Round {{ROUND_NO}} of our recruitment process.</p><p><br></p><p>We would like to inform you that your profile is currently on hold for further evaluation. Our team is reviewing the next steps, and any updates regarding your candidature will be communicated to you shortly.</p><p><br></p><p>We appreciate your patience and continued interest in Kanini Software Solutions.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src="/siganture.png"></p>');

-- Template 8: Round Rejected
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('ROUND REJECTED',
'KANINI DRIVE UPDATE',
'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>Thank you for participating in Round {{ROUND_NO}} of our recruitment process.</p><p><br></p><p>After careful evaluation, we regret to inform you that you have not been shortlisted for the next round.</p><p><br></p><p>We appreciate your interest in Kanini Software Solutions and thank you for the time and effort invested in the process.</p><p><br></p><p>We wish you all the very best for your future opportunities.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src="/siganture.png"></p>');

-- Template 9: Round Dropped
INSERT IGNORE INTO email_templates (template_name, subject, body) VALUES
('ROUND DROPPED',
'KANINI DRIVE UPDATE',
'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>This is to inform you that your status for Round {{ROUND_NO}} of the recruitment process has been marked as {{STATUS}}.</p><p><br></p><p>As a result, your candidature will not be considered for further rounds of the current recruitment process.</p><p><br></p><p>We appreciate your interest in Kanini Software Solutions and thank you for your participation.</p><p><br></p><p>We wish you all the very best for your future opportunities.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src="/siganture.png"></p>');

-- =====================================================================
-- END OF SEED DATA
-- =====================================================================
