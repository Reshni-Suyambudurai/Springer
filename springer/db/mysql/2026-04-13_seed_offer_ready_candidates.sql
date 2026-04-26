-- Seed APPROVED document submissions so selected candidates become offer-ready.
-- Safe to re-run: skips candidate-document rows that already exist as COLLECTED/APPROVED.

SET @cycle_id = (
    SELECT hc.cycle_id
    FROM hiring_cycles hc
    WHERE hc.status = 'OPEN'
    ORDER BY hc.cycle_id DESC
    LIMIT 1
);

INSERT INTO document_submissions (
    document_type_id,
    candidate_id,
    uploaded_no,
    cycle_id,
    verification_status,
    created_at
)
SELECT
    dt.document_type_id,
    c.candidate_id,
    (c.candidate_id * 1000 + dt.document_type_id) AS uploaded_no,
    @cycle_id,
    'APPROVED',
    NOW()
FROM candidates c
JOIN document_types dt ON 1 = 1
LEFT JOIN offer_letters o ON o.candidate_id = c.candidate_id
WHERE c.application_stage = 'SELECTED'
  AND o.offer_id IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM document_submissions ds
      WHERE ds.candidate_id = c.candidate_id
        AND ds.document_type_id = dt.document_type_id
        AND ds.cycle_id = @cycle_id
        AND ds.verification_status IN ('COLLECTED', 'APPROVED')
  );

-- Quick verification for offer-ready candidates by SQL logic used in service.
SELECT
    c.candidate_id,
    c.first_name,
    c.application_stage,
    COUNT(ds.candidate_document_id) AS active_docs,
    SUM(ds.verification_status = 'APPROVED') AS approved_docs
FROM candidates c
LEFT JOIN offer_letters o ON o.candidate_id = c.candidate_id
LEFT JOIN document_submissions ds
       ON ds.candidate_id = c.candidate_id
      AND ds.cycle_id = @cycle_id
      AND ds.verification_status IN ('COLLECTED', 'APPROVED')
WHERE c.application_stage = 'SELECTED'
  AND o.offer_id IS NULL
GROUP BY c.candidate_id, c.first_name, c.application_stage
HAVING active_docs > 0 AND active_docs = approved_docs
ORDER BY c.candidate_id;