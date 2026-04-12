import { useState, useCallback } from "react";
import { candidateApi } from "../services/drive.api";
import type {
  CandidateRequest,
  CandidateValidationRequest,
  CandidateValidationResponse,
} from "../types/TA_Recruiter/Drive/candidate.types";
import { ValidationStatus } from "../types/TA_Recruiter/Drive/candidate.types";
import { showToast } from "../utils/toast";
import { computeBatchDuplicates, validateBulkBeforeUpload } from "../utils/candidateValidation";

interface UseBulkCandidateUploadOptions {
  cycleId: number | null;
}

export const useBulkCandidateUpload = ({ cycleId }: UseBulkCandidateUploadOptions) => {
  const [bulkData, setBulkData] = useState<CandidateRequest[]>([]);
  const [validationResults, setValidationResults] = useState<Map<string, CandidateValidationResponse>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [batchDuplicateIndices, setBatchDuplicateIndices] = useState<Set<number>>(new Set());
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [errorEmailMap, setErrorEmailMap] = useState<Map<number, string>>(new Map());

  const getValidationForCandidate = useCallback(
    (email: string): CandidateValidationResponse | undefined => {
      return validationResults.get(email.toLowerCase());
    },
    [validationResults]
  );

  const hasDuplicates = useCallback((): boolean => {
    return Array.from(validationResults.values()).some(
      (result) => result.status === ValidationStatus.DUPLICATE
    );
  }, [validationResults]);

  /** Call the backend bulk-validate endpoint and update validationResults map. */
  const validateCandidates = useCallback(
    async (candidates: CandidateRequest[]) => {
      if (candidates.length === 0) return;

      setIsValidating(true);
      try {
        const validationRequests: CandidateValidationRequest[] = candidates.map((cand, index) => ({
          tempId: `row-${index + 1}`,
          instituteId: cand.instituteId,
          cycleId: cand.cycleId || cycleId || 0,
          firstName: cand.firstName,
          lastName: cand.lastName,
          email: cand.email,
          mobile: cand.mobile,
          cgpa: cand.cgpa,
          historyOfArrears: cand.historyOfArrears,
          degree: cand.degree,
          department: cand.department,
          passoutYear: cand.passoutYear,
          dateOfBirth: cand.dateOfBirth,
          aadhaarNumber: cand.aadhaarNumber,
          applicationType: "STANDARD",
        }));

        const response = await candidateApi.bulkValidateCandidates(validationRequests);

        if (response.success && response.data) {
          const resultsMap = new Map<string, CandidateValidationResponse>();
          response.data.forEach((result, idx) => {
            const email = candidates[idx]?.email?.toLowerCase();
            if (email) resultsMap.set(email, result);
          });
          setValidationResults(resultsMap);

          const duplicateCount = response.data.filter((r) => r.status === ValidationStatus.DUPLICATE).length;
          const oldCount = response.data.filter((r) => r.status === ValidationStatus.OLD).length;
          const newCount = response.data.filter((r) => r.status === ValidationStatus.NEW).length;

          if (duplicateCount > 0) {
            showToast(
              `Validation complete: ${newCount} new, ${oldCount} old entries, ${duplicateCount} duplicates (upload disabled)`,
              "error"
            );
          } else if (oldCount > 0) {
            showToast(
              `Validation complete: ${newCount} new, ${oldCount} old entries (can re-apply)`,
              "success"
            );
          } else {
            showToast(`All ${newCount} candidates validated successfully`, "success");
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        showToast(err.message || "Validation failed", "error");
      } finally {
        setIsValidating(false);
      }
    },
    [cycleId]
  );

  /** Build the errorEmailMap from a list of error messages. */
  const buildErrorEmailMap = useCallback(
    (messages: string[], data: CandidateRequest[]) => {
      const emailMap = new Map<number, string>();
      messages.forEach((msg: string) => {
        const m = msg.match(/^Candidate\s*#(\d+):/i);
        if (m) {
          const num = parseInt(m[1], 10);
          const email = data[num - 1]?.email?.toLowerCase();
          if (email) emailMap.set(num, email);
        }
      });
      return emailMap;
    },
    []
  );

  /** Run pre-upload validation, then call bulkCreateCandidates. */
  const handleBulkUpload = useCallback(async () => {
    if (bulkData.length === 0) {
      showToast("No data to upload", "error");
      return;
    }

    const errors = validateBulkBeforeUpload(bulkData);
    if (errors.length > 0) {
      setErrorMessages(errors);
      setShowErrorOverlay(true);
      showToast(`Found ${errors.length} validation error(s). Please fix them before uploading.`, "error");
      return;
    }

    if (validationResults.size === 0) {
      showToast("Please wait for validation to complete", "error");
      return;
    }

    const duplicatesExist = Array.from(validationResults.values()).some(
      (result) => result.status === ValidationStatus.DUPLICATE
    );
    if (duplicatesExist) {
      showToast("Cannot upload: duplicate candidates detected. Please remove them.", "error");
      return;
    }

    try {
      const response = await candidateApi.bulkCreateCandidates(bulkData);

      if (response.data.errorMessages && response.data.errorMessages.length > 0) {
        setErrorMessages(response.data.errorMessages);
        setShowErrorOverlay(true);
        setErrorEmailMap(buildErrorEmailMap(response.data.errorMessages, bulkData));

        if (response.data.successfulInserts && response.data.successfulInserts.length > 0) {
          showToast(
            `${response.data.successfulInserts.length} candidates uploaded, ${response.data.errorMessages.length} failed`,
            "error"
          );
        } else {
          showToast("All candidates failed validation. See errors.", "error");
        }
      } else {
        showToast(`${response.data.successfulInserts.length} candidates uploaded successfully`, "success");
        setBulkData([]);
        setValidationResults(new Map());
        setBatchDuplicateIndices(new Set());
      }
    } catch (error: unknown) {
      const err = error as {
        message: string;
        success: boolean;
        data?: { errorMessages?: string[]; message?: string };
      };

      if (err.data?.errorMessages?.length) {
        setErrorMessages(err.data.errorMessages);
        setShowErrorOverlay(true);
        setErrorEmailMap(buildErrorEmailMap(err.data.errorMessages, bulkData));
        showToast("Bulk upload failed. See error details.", "error");
      } else {
        showToast(err.data?.message || err.message || "Upload failed", "error");
      }
    }
  }, [bulkData, validationResults, buildErrorEmailMap]);

  /** Remove a single row by index. */
  const handleRemoveRow = useCallback(
    (index: number) => {
      const removedEmail = bulkData[index]?.email?.toLowerCase();
      const updated = bulkData.filter((_, idx) => idx !== index);
      setBulkData(updated);
      setBatchDuplicateIndices(computeBatchDuplicates(updated));
      if (removedEmail) {
        const newValidationResults = new Map(validationResults);
        newValidationResults.delete(removedEmail);
        setValidationResults(newValidationResults);
      }
      showToast("Row removed", "success");
    },
    [bulkData, validationResults]
  );

  /** Remove all duplicate rows (DB duplicates + batch duplicates). */
  const handleRemoveDuplicates = useCallback(() => {
    const duplicateEmails = new Set<string>();
    validationResults.forEach((result, email) => {
      if (result.status === ValidationStatus.DUPLICATE) {
        duplicateEmails.add(email);
      }
    });

    const indicesToRemove = new Set<number>(batchDuplicateIndices);
    bulkData.forEach((c, idx) => {
      if (duplicateEmails.has(c.email.toLowerCase())) {
        indicesToRemove.add(idx);
      }
    });

    if (indicesToRemove.size === 0) return;

    const filtered = bulkData.filter((_, idx) => !indicesToRemove.has(idx));
    const newValidationResults = new Map(validationResults);
    duplicateEmails.forEach((email) => newValidationResults.delete(email));

    setBulkData(filtered);
    setValidationResults(newValidationResults);
    setBatchDuplicateIndices(computeBatchDuplicates(filtered));
    showToast(`Removed ${indicesToRemove.size} duplicate row(s)`, "success");
  }, [bulkData, validationResults, batchDuplicateIndices]);

  /** Remove a candidate by email (used from error overlay). */
  const handleRemoveByEmail = useCallback(
    (email: string, errorIndex: number) => {
      const updated = bulkData.filter((c) => c.email.toLowerCase() !== email);
      setBulkData(updated);
      setBatchDuplicateIndices(computeBatchDuplicates(updated));
      const newVR = new Map(validationResults);
      newVR.delete(email);
      setValidationResults(newVR);
      setErrorMessages((prev) => {
        const remaining = prev.filter((_, i) => i !== errorIndex);
        if (remaining.length === 0) setShowErrorOverlay(false);
        return remaining;
      });
    },
    [bulkData, validationResults]
  );

  /** Load parsed candidates into state and trigger validation. */
  const loadCandidates = useCallback(
    (candidates: CandidateRequest[]) => {
      setBulkData(candidates);
      setBatchDuplicateIndices(computeBatchDuplicates(candidates));
      showToast(`${candidates.length} candidates loaded from file`, "success");
      validateCandidates(candidates);
    },
    [validateCandidates]
  );

  /** Reset all bulk upload state. */
  const resetBulkState = useCallback(() => {
    setBulkData([]);
    setValidationResults(new Map());
    setBatchDuplicateIndices(new Set());
    setErrorMessages([]);
    setShowErrorOverlay(false);
    setErrorEmailMap(new Map());
  }, []);

  return {
    bulkData,
    validationResults,
    isValidating,
    batchDuplicateIndices,
    showErrorOverlay,
    errorMessages,
    errorEmailMap,
    setShowErrorOverlay,
    setErrorMessages,
    getValidationForCandidate,
    hasDuplicates,
    validateCandidates,
    handleBulkUpload,
    handleRemoveRow,
    handleRemoveDuplicates,
    handleRemoveByEmail,
    loadCandidates,
    resetBulkState,
  };
};
