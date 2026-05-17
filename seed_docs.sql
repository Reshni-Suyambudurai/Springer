-- Insert doc submissions with correct document_type_ids
INSERT INTO document_submissions (document_type_id, candidate_id, cycle_id, verification_status, created_at)
SELECT dt.document_type_id, c.candidate_id, c.cycle_id,
    CASE WHEN c.application_stage IN ('JOINED','OFFER_ACCEPTED') THEN 'APPROVED'
         WHEN c.application_stage='OFFERED' THEN 'COLLECTED'
         ELSE 'PENDING' END,
    NOW()
FROM candidates c
CROSS JOIN (SELECT document_type_id FROM document_types ORDER BY document_type_id LIMIT 3) dt
WHERE c.application_stage IN ('SELECTED','OFFERED','OFFER_ACCEPTED','JOINED')
AND c.email LIKE '%@testmail.com';

-- Verify
SELECT 'Doc Submissions' as metric, COUNT(*) as cnt FROM document_submissions
UNION ALL SELECT 'Batch Allocations', COUNT(*) FROM batch_allocations;
