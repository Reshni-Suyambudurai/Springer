ALTER TABLE candidates
MODIFY COLUMN application_stage ENUM(
    'APPLIED',
    'SHORTLISTED',
    'INVITED',
    'SCHEDULED',
    'SELECTED',
    'OFFERED',
    'JOINED',
    'NOT_JOINED',
    'OFFER_REJECTED',
    'REJECTED',
    'ACCEPTED',
    'DROPPED'
) NULL;