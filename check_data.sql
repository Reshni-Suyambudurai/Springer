SELECT 'institutes' as tbl, COUNT(*) as cnt FROM institutes
UNION ALL SELECT 'drive_schedule', COUNT(*) FROM drive_schedule
UNION ALL SELECT 'candidates', COUNT(*) FROM candidates
UNION ALL SELECT 'hiring_cycles', COUNT(*) FROM hiring_cycles
UNION ALL SELECT 'training_programs', COUNT(*) FROM training_programs
UNION ALL SELECT 'batch_allocations', COUNT(*) FROM batch_allocations
UNION ALL SELECT 'document_submissions', COUNT(*) FROM document_submissions
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'scores', COUNT(*) FROM scores;

SELECT cycle_id, cycle_name, year FROM hiring_cycles;
SELECT drive_id, drive_name, drive_mode, cycle_id FROM drive_schedule;
SELECT institute_id, institute_name FROM institutes LIMIT 10;
