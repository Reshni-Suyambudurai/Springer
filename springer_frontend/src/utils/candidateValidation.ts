import dayjs from "dayjs";
import type { CandidateRequest } from "../types/TA_Recruiter/Drive/candidate.types";

// ── Validation Constants ──
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_REGEX = /^[0-9]{10}$/;
export const AADHAAR_REGEX = /^[0-9]{12}$/;
export const CURRENT_YEAR = new Date().getFullYear();
export const MIN_PASSOUT_YEAR = 1950;
export const MAX_PASSOUT_YEAR = CURRENT_YEAR + 5;

// ── Pure Utility Functions ──

/**
 * Detect batch duplicates within an uploaded list by email and aadhaar.
 * Returns indices of duplicate rows (keeps first occurrence, marks subsequent ones).
 */
export const computeBatchDuplicates = (candidates: CandidateRequest[]): Set<number> => {
  const dupIndices = new Set<number>();
  const emailMap = new Map<string, number[]>();
  const aadhaarMap = new Map<string, number[]>();

  candidates.forEach((cand, idx) => {
    const email = (cand.email || "").trim().toLowerCase();
    if (email) {
      const indices = emailMap.get(email) || [];
      indices.push(idx);
      emailMap.set(email, indices);
    }
    const aadhaar = String(cand.aadhaarNumber || "").trim();
    if (aadhaar) {
      const indices = aadhaarMap.get(aadhaar) || [];
      indices.push(idx);
      aadhaarMap.set(aadhaar, indices);
    }
  });

  emailMap.forEach((indices) => {
    if (indices.length > 1) indices.slice(1).forEach((i) => dupIndices.add(i));
  });
  aadhaarMap.forEach((indices) => {
    if (indices.length > 1) indices.slice(1).forEach((i) => dupIndices.add(i));
  });

  return dupIndices;
};

/**
 * Calculate age from a date-of-birth string.
 */
export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Validate candidates loaded from an Excel file (basic field-level checks).
 * Returns an array of error strings. Empty array = all valid.
 */
export const validateFileData = (
  candidates: CandidateRequest[],
  options?: { requireInstituteId?: boolean }
): string[] => {
  const errors: string[] = [];

  candidates.forEach((cand, idx) => {
    const row = idx + 2; // Excel row (header = row 1)
    if (!cand.firstName) errors.push(`Row ${row}: Missing First Name`);
    if (!cand.email) errors.push(`Row ${row}: Missing Email`);
    if (!cand.mobile) errors.push(`Row ${row}: Missing Mobile`);
    if (!cand.cgpa || cand.cgpa === 0) errors.push(`Row ${row}: Missing CGPA`);
    if (!cand.passoutYear) errors.push(`Row ${row}: Missing Passout Year`);

    if (options?.requireInstituteId && (!cand.instituteId || cand.instituteId === 0)) {
      errors.push(`Row ${row}: Missing Institute ID`);
    }

    if (cand.dateOfBirth) {
      const isValidDate = dayjs(cand.dateOfBirth, "YYYY-MM-DD", true).isValid();
      if (!isValidDate) {
        errors.push(`Row ${row}: Invalid date of birth '${cand.dateOfBirth}'`);
      } else {
        if (dayjs(cand.dateOfBirth).isAfter(dayjs())) {
          errors.push(`Row ${row}: Date of birth cannot be in the future`);
        }
        const age = dayjs().diff(dayjs(cand.dateOfBirth), "year");
        if (age < 18) {
          errors.push(`Row ${row}: Candidate must be at least 18 years old`);
        }
      }
    }
  });

  return errors;
};

/**
 * Validate bulk data before uploading to DB (strict regex-based checks).
 * Returns an array of error strings. Empty array = all valid.
 */
export const validateBulkBeforeUpload = (candidates: CandidateRequest[]): string[] => {
  const errors: string[] = [];

  candidates.forEach((cand, idx) => {
    const row = idx + 1;
    if (!cand.email) {
      errors.push(`Row ${row}: Missing Email`);
    } else if (!EMAIL_REGEX.test(cand.email)) {
      errors.push(`Row ${row}: Invalid email format '${cand.email}'`);
    }
    if (!cand.mobile) {
      errors.push(`Row ${row}: Missing Mobile Number`);
    } else if (!MOBILE_REGEX.test(cand.mobile)) {
      errors.push(`Row ${row}: Mobile number must be exactly 10 digits (found: '${cand.mobile}')`);
    }
    if (cand.aadhaarNumber && !AADHAAR_REGEX.test(cand.aadhaarNumber)) {
      errors.push(`Row ${row}: Aadhaar number must be exactly 12 digits (found: '${cand.aadhaarNumber}')`);
    }
    if (!cand.passoutYear) {
      errors.push(`Row ${row}: Missing Passout Year`);
    } else if (cand.passoutYear < MIN_PASSOUT_YEAR || cand.passoutYear > MAX_PASSOUT_YEAR) {
      errors.push(`Row ${row}: Passout year must be between ${MIN_PASSOUT_YEAR} and ${MAX_PASSOUT_YEAR} (found: ${cand.passoutYear})`);
    }
  });

  return errors;
};

/**
 * Parse a single Excel row into a CandidateRequest.
 * The `overrides` parameter lets the caller inject fixed values (e.g. instituteId from a dropdown).
 */
export const parseExcelRow = (
  row: Record<string, unknown>,
  defaults: { cycleId: number; driveId?: number; instituteId?: number }
): CandidateRequest => {
  let applicationType: "STANDARD" | "PREMIUM" = "STANDARD";
  const appTypeValue = row["Application Type"] || row["applicationType"] || "";
  if (typeof appTypeValue === "string") {
    const normalizedValue = appTypeValue.toUpperCase().trim();
    if (normalizedValue === "PREMIUM") {
      applicationType = "PREMIUM";
    }
  }

  return {
    instituteId: defaults.instituteId ?? Number(row["Institute ID"] || row["instituteId"] || 0),
    cycleId: defaults.cycleId,
    driveId: defaults.driveId,
    firstName: (row["First Name"] || row["firstName"] || "") as string,
    lastName: (row["Last Name"] || row["lastName"] || "") as string,
    email: (row["Email"] || row["email"] || "") as string,
    mobile: (row["Mobile"] || row["mobile"] || "") as string,
    cgpa: Number(row["CGPA"] || row["cgpa"] || 0),
    historyOfArrears: Number(row["History of Arrears"] || row["historyOfArrears"] || 0),
    degree: (row["Degree"] || row["degree"] || "") as string,
    department: (row["Department"] || row["department"] || "") as string,
    passoutYear: Number(row["Passout Year"] || row["passoutYear"] || new Date().getFullYear()),
    dateOfBirth: (row["Date of Birth"] || row["dateOfBirth"] || "") as string,
    aadhaarNumber: (row["Aadhaar Number"] || row["aadhaarNumber"] || "") as string,
    applicationType,
    skillIds: (() => {
      const skillIdsValue = row["SkillIds"] || row["skillIds"] || "";
      if (!skillIdsValue) return [];
      const skillIdsStr = String(skillIdsValue).trim();
      if (!skillIdsStr) return [];
      return skillIdsStr
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id) && id > 0);
    })(),
  };
};
