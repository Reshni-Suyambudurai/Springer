SELECT cycle_id, cycle_name, cycle_year FROM hiring_cycles;
SELECT institute_id, institute_name FROM institutes;
SELECT program_id, program_name FROM training_programs;
SELECT drive_id, drive_name, drive_mode, cycle_id FROM drive_schedule;
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'candidates' AND TABLE_SCHEMA = 'springer' ORDER BY ORDINAL_POSITION;
