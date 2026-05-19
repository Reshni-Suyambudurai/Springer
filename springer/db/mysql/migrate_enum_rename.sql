-- Step 1: Add new enum values to candidates.application_stage
ALTER TABLE candidates MODIFY COLUMN application_stage
  ENUM('ACCEPTED','APPLIED','DROPPED','INVITED','JOINED','NOT_JOINED','OFFERED',
       'OFFER_ACCEPTED','OFFER_REJECTED','REJECTED','SCHEDULED','SELECTED','SHORTLISTED');

-- Step 2: Migrate old ACCEPTED → OFFER_ACCEPTED in candidates
UPDATE candidates SET application_stage = 'OFFER_ACCEPTED' WHERE application_stage = 'ACCEPTED';

-- Step 3: Remove old ACCEPTED from candidates enum (keep only new values)
ALTER TABLE candidates MODIFY COLUMN application_stage
  ENUM('APPLIED','DROPPED','INVITED','JOINED','NOT_JOINED','OFFERED',
       'OFFER_ACCEPTED','OFFER_REJECTED','REJECTED','SCHEDULED','SELECTED','SHORTLISTED');

-- Step 4: Add new enum values to offer_letters.response
ALTER TABLE offer_letters MODIFY COLUMN response
  ENUM('ACCEPTED','DECLINED','EXPIRED','OFFER_ACCEPTED','OFFER_DECLINED','PENDING');

-- Step 5: Migrate old ACCEPTED → OFFER_ACCEPTED and DECLINED → OFFER_DECLINED in offer_letters
UPDATE offer_letters SET response = 'OFFER_ACCEPTED' WHERE response = 'ACCEPTED';
UPDATE offer_letters SET response = 'OFFER_DECLINED' WHERE response = 'DECLINED';

-- Step 6: Remove old ACCEPTED and DECLINED from offer_letters enum
ALTER TABLE offer_letters MODIFY COLUMN response
  ENUM('EXPIRED','OFFER_ACCEPTED','OFFER_DECLINED','PENDING');

SELECT 'Migration completed successfully' AS status;
