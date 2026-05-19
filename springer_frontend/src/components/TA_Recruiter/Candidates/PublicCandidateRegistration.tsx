import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import { publicHttp } from "../../../services/api/https";
import type { InstituteResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type { SkillResponse } from "../../../types/TA_Recruiter/Hiring/skill.types";
import type { CandidateRegistrationRequest } from "../../../types/TA_Recruiter/Drive/candidateRegistration.types";
import { Degree, Department } from "../../../types/TA_Recruiter/Drive/candidate.types";
import { showToast } from "../../../utils/toast";
import "../../../css/TA_Recruiter/Candidates/PublicCandidateRegistration.css";

// ─── Public API (no auth) ────────────────────────────────────────────────────
const publicFormApi = {
  async getFormById(formId: number) {
    const response = await publicHttp.get(`/forms/${formId}`);
    return response.data;
  },
};

const publicInstituteApi = {
  async getAllInstitutes() {
    const response = await publicHttp.get("/institutes");
    return response.data;
  },
};

const publicSkillsApi = {
  async getAllSkills() {
    const response = await publicHttp.get("/skills");
    return response.data;
  },
};

const publicRegistrationApi = {
  async submitRegistration(driveId: number, data: CandidateRegistrationRequest) {
    const response = await publicHttp.post(
      `/candidate-registrations/drive/${driveId}/register`,
      data
    );
    return response.data;
  },
};

// ─── Validation helpers ───────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const AADHAAR_REGEX = /^\d{12}$/;

const getMinDobForAge20 = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 20);
  return d.toISOString().split("T")[0];
};


type FormErrors = Record<string, string>;

type FormState = Omit<CandidateRegistrationRequest, "formId">;

const INITIAL_FORM: FormState = {
  fname: "",
  lname: "",
  email: "",
  phone: "",
  collegeName: "",
  graduationYear: new Date().getFullYear(),
  degree: "",
  department: "",
  cgpa: 0,
  historyOfArrears: 0,
  skills: "",
  dob: "",
  aadhaarNo: "",
  applicationType: "STANDARD",
};

function validateAll(
  form: FormState,
  selectedInstitute: InstituteResponse | null
): FormErrors {
  const errors: FormErrors = {};
  const currentYear = new Date().getFullYear();

  // First name
  if (!form.fname.trim()) {
    errors.fname = "First name is required";
  }

  // Email
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = "Enter a valid email address";
  }

  // Phone
  if (!form.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!PHONE_REGEX.test(form.phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number (starts with 6–9)";
  }

  // College
  if (!selectedInstitute) {
    errors.collegeName = "Please select a college from the list";
  } else if (selectedInstitute.instituteId === 1) {
    const custom = form.collegeName.trim();
    if (
      !custom ||
      custom.toLowerCase() === selectedInstitute.instituteName.trim().toLowerCase()
    ) {
      errors.customCollegeName = "Please enter your full college name";
    }
  }

  // Degree
  if (!form.degree) {
    errors.degree = "Degree is required";
  }

  // Department
  if (!form.department) {
    errors.department = "Department is required";
  }

  // Date of birth — must be non-empty and age >= 20
  if (!form.dob) {
    errors.dob = "Date of birth is required";
  } else {
    const maxDob = getMinDobForAge20();
    if (form.dob > maxDob) {
      errors.dob = "Candidate must be at least 20 years old";
    }
  }

  // Graduation year
  if (
    !form.graduationYear ||
    form.graduationYear < 1990 ||
    form.graduationYear > currentYear + 6
  ) {
    errors.graduationYear = `Graduation year must be between 1990 and ${currentYear + 6}`;
  }

  // CGPA — must be between 1.0 and 10.0
  if (isNaN(form.cgpa) || form.cgpa < 1 || form.cgpa > 10) {
    errors.cgpa = "CGPA must be between 1.0 and 10.0";
  }

  // History of arrears — non-negative integer, max 2 digits (0–99)
  if (
    isNaN(form.historyOfArrears) ||
    form.historyOfArrears < 0 ||
    !Number.isInteger(form.historyOfArrears) ||
    form.historyOfArrears > 99
  ) {
    errors.historyOfArrears = "History of arrears must be a whole number between 0 and 99";
  }

  // Aadhaar (optional but must be 12 digits if provided)
  if (form.aadhaarNo && form.aadhaarNo.trim() && !AADHAAR_REGEX.test(form.aadhaarNo)) {
    errors.aadhaarNo = "Aadhaar number must be exactly 12 digits";
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────
const PublicCandidateRegistration: React.FC = () => {
  const { driveName, formId } = useParams<{
    driveName: string;
    formName: string;
    formId: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formClosed, setFormClosed] = useState(false);
  const [driveId, setDriveId] = useState<number | null>(null);

  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteResponse | null>(null);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SkillResponse[]>([]);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Data fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!formId) return;

    const fetchAll = async () => {
      const [formRes, institRes, skillRes] = await Promise.allSettled([
        publicFormApi.getFormById(parseInt(formId)),
        publicInstituteApi.getAllInstitutes(),
        publicSkillsApi.getAllSkills(),
      ]);

      if (formRes.status === "fulfilled" && formRes.value.success) {
        setDriveId(formRes.value.data.driveId);
      } else {
        showToast("Failed to load form details", "error");
      }

      if (institRes.status === "fulfilled" && institRes.value.success) {
        setInstitutes(
          (institRes.value.data as InstituteResponse[]).filter((i) => i.isActive)
        );
      } else {
        showToast("Failed to load institutes", "error");
      }

      if (skillRes.status === "fulfilled" && skillRes.value.success) {
        setSkills(skillRes.value.data as SkillResponse[]);
      } else {
        showToast("Failed to load skills", "error");
      }
    };

    fetchAll();
  }, [formId]);

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = useCallback(
    (field: keyof FormState, value: FormState[keyof FormState]) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // Auto-reset applicationType if CGPA drops below 8.5
        if (field === "cgpa" && (value as number) < 8.5 && prev.applicationType === "PREMIUM") {
          next.applicationType = "STANDARD";
        }
        return next;
      });
      setTouched((prev) => ({ ...prev, [field]: true }));
      // Clear field error on change
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    },
    []
  );

  // ── Computed values ──────────────────────────────────────────────────────

  const maxDobStr = useMemo(() => getMinDobForAge20(), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const validationErrors = validateAll(form, selectedInstitute);
    setErrors(validationErrors);

    // Mark all fields as touched so errors show
    const allTouched = Object.keys(INITIAL_FORM).reduce<Record<string, boolean>>(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    if (Object.keys(validationErrors).length > 0) {
      showToast("Please fix the errors before submitting", "error");
      return;
    }

    if (!formId || !driveId) {
      showToast("Invalid form or drive. Please use the correct registration link.", "error");
      return;
    }

    try {
      setLoading(true);
      const payload: CandidateRegistrationRequest = {
        ...form,
        formId: parseInt(formId),
        instituteId: selectedInstitute?.instituteId,
        skills:
          selectedSkills.length > 0
            ? selectedSkills.map((s) => s.skillId).join(",")
            : undefined,
        aadhaarNo: form.aadhaarNo?.trim() || undefined,
      };

      const response = await publicRegistrationApi.submitRegistration(driveId, payload);
      if (response.success) {
        showToast(response.message || "Registration submitted successfully!", "success");
        setSubmitted(true);
      }
    } catch (error) {
      const responseData = (
        error as { response?: { data?: { success?: boolean; message?: string; data?: unknown } } }
      )?.response?.data;

      let errorMessage = "Failed to submit registration";
      if (responseData) {
        const fieldErrors = responseData.data;
        if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
          errorMessage = Object.values(fieldErrors as Record<string, string>).join(", ");
        } else {
          errorMessage = responseData.message || errorMessage;
        }
      } else {
        errorMessage = (error as Error)?.message || errorMessage;
      }

      if (
        errorMessage.toLowerCase().includes("inactive") ||
        errorMessage.toLowerCase().includes("cannot accept registrations")
      ) {
        setFormClosed(true);
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [form, selectedInstitute, selectedSkills, formId, driveId]);

  // ── Helper for field error display (only after touch) ────────────────────
  const fieldError = (key: string) => (touched[key] ? errors[key] : undefined);

  // ─── Render states ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Box className="public-reg-container">
        <Card className="public-reg-success-card">
          <CardContent>
            <Typography variant="h5" className="public-reg-success-title">
              ✓ Registration Submitted Successfully!
            </Typography>
            <Typography variant="body1" className="public-reg-success-message">
              Thank you for registering. We will contact you soon.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (formClosed) {
    return (
      <Box className="public-reg-container">
        <Card className="public-reg-success-card">
          <CardContent>
            <Typography variant="h5" className="public-reg-error-title">
              ✕ No Longer Accepting Responses
            </Typography>
            <Typography variant="body1" className="public-reg-error-message">
              This registration form is currently closed and is no longer accepting new submissions.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────
  return (
    <Box className="public-reg-container">
      {/* Header */}
      <Card className="public-reg-header-card">
        <Box className="public-reg-header-content">
          <img src="/kanini.png" alt="Kanini" className="public-reg-header-logo" />
          <Box className="public-reg-header-text">
            <Typography variant="h5" className="public-reg-title">
              Candidate Registration
            </Typography>
            <Typography variant="h6" className="public-reg-subtitle">
              KANINI DRIVE
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" className="public-reg-drive-name">
          {driveName?.replace(/-/g, " ")}
        </Typography>
      </Card>

      {/* Form */}
      <Card className="public-reg-form-card">
        <CardContent>
          <Box className="public-reg-form-grid">

            {/* First Name */}
            <TextField
              label="First Name *"
              fullWidth
              value={form.fname}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^[A-Za-z\s]+$/.test(v)) handleChange("fname", v);
              }}
              onBlur={() => setTouched((p) => ({ ...p, fname: true }))}
              error={!!fieldError("fname")}
              helperText={fieldError("fname") ?? " "}
            />

            {/* Last Name */}
            <TextField
              label="Last Name"
              fullWidth
              value={form.lname}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^[A-Za-z\s]+$/.test(v)) handleChange("lname", v);
              }}
              helperText=" "
            />

            {/* Email */}
            <TextField
              label="Email *"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              error={!!fieldError("email")}
              helperText={fieldError("email") ?? " "}
            />

            {/* Phone */}
            <TextField
              label="Phone *"
              fullWidth
              value={form.phone}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (/^\d+$/.test(v) && v.length <= 10)) handleChange("phone", v);
              }}
              onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
              error={!!fieldError("phone")}
              helperText={fieldError("phone") ?? " "}
              inputProps={{ maxLength: 10 }}
            />

            {/* College Name */}
            <div className="public-reg-others-college-wrapper">
              <Autocomplete
                options={institutes}
                getOptionLabel={(o) => o.instituteName}
                value={selectedInstitute}
                onChange={(_, newValue) => {
                  setSelectedInstitute(newValue);
                  handleChange("collegeName", newValue ? newValue.instituteName : "");
                  setErrors((p) => {
                    const next = { ...p };
                    delete next.collegeName;
                    delete next.customCollegeName;
                    return next;
                  });
                }}
                onBlur={() => setTouched((p) => ({ ...p, collegeName: true }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="College Name *"
                    error={!!fieldError("collegeName")}
                    helperText={fieldError("collegeName") ?? " "}
                  />
                )}
                className="public-reg-full-width"
              />
              {selectedInstitute?.instituteId === 1 && (
                <TextField
                  label="Enter Full College Name *"
                  fullWidth
                  placeholder="Enter your full college name"
                  value={
                    form.collegeName === selectedInstitute.instituteName ? "" : form.collegeName
                  }
                  onChange={(e) => handleChange("collegeName", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, customCollegeName: true }))}
                  error={!!fieldError("customCollegeName")}
                  helperText={fieldError("customCollegeName") ?? " "}
                />
              )}
            </div>

            {/* Graduation Year */}
            <TextField
              label="Graduation Year *"
              type="number"
              fullWidth
              value={form.graduationYear || ""}
              onChange={(e) => handleChange("graduationYear", parseInt(e.target.value) || 0)}
              onBlur={() => setTouched((p) => ({ ...p, graduationYear: true }))}
              error={!!fieldError("graduationYear")}
              helperText={fieldError("graduationYear") ?? " "}
              inputProps={{ min: 1990, max: currentYear + 6 }}
            />

            {/* Date of Birth — age must be >= 20 */}
            <TextField
              label="Date of Birth *"
              type="date"
              fullWidth
              value={form.dob}
              onChange={(e) => handleChange("dob", e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, dob: true }))}
              error={!!fieldError("dob")}
              helperText={fieldError("dob") ?? "Candidate must be at least 20 years old"}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: maxDobStr }}
            />

            {/* Degree */}
            <TextField
              select
              label="Degree *"
              fullWidth
              value={form.degree}
              onChange={(e) => handleChange("degree", e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, degree: true }))}
              error={!!fieldError("degree")}
              helperText={fieldError("degree") ?? " "}
            >
              {Object.values(Degree).map((deg) => (
                <MenuItem key={deg} value={deg}>
                  {deg}
                </MenuItem>
              ))}
            </TextField>

            {/* Department */}
            <TextField
              select
              label="Department *"
              fullWidth
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, department: true }))}
              error={!!fieldError("department")}
              helperText={fieldError("department") ?? " "}
            >
              {Object.values(Department).map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>

            {/* CGPA — 1.0 to 10.0 */}
            <TextField
              label="CGPA * (1.0 – 10.0)"
              type="number"
              fullWidth
              value={form.cgpa === 0 ? "" : form.cgpa}
              onChange={(e) => {
                const v = e.target.value;
                handleChange("cgpa", v === "" ? 0 : parseFloat(v));
              }}
              onBlur={() => setTouched((p) => ({ ...p, cgpa: true }))}
              error={!!fieldError("cgpa")}
              helperText={fieldError("cgpa") ?? " "}
              inputProps={{ step: "0.01", min: "1", max: "10" }}
            />

            {/* History of Arrears — 0–99, integer */}
            <TextField
              label="History of Arrears * (0 – 99)"
              type="number"
              fullWidth
              value={form.historyOfArrears === 0 ? "" : form.historyOfArrears}
              onChange={(e) => {
                const v = e.target.value;
                const parsed = v === "" ? 0 : parseInt(v);
                if (v === "" || (!isNaN(parsed) && parsed >= 0 && parsed <= 99)) {
                  handleChange("historyOfArrears", parsed);
                }
              }}
              onBlur={() => setTouched((p) => ({ ...p, historyOfArrears: true }))}
              error={!!fieldError("historyOfArrears")}
              helperText={fieldError("historyOfArrears") ?? " "}
              inputProps={{ min: "0", max: "99" }}
            />

            {/* Aadhaar Number (optional) */}
            <TextField
              label="Aadhaar Number (optional)"
              fullWidth
              value={form.aadhaarNo}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (/^\d+$/.test(v) && v.length <= 12)) {
                  handleChange("aadhaarNo", v);
                }
              }}
              onBlur={() => setTouched((p) => ({ ...p, aadhaarNo: true }))}
              error={!!fieldError("aadhaarNo")}
              helperText={fieldError("aadhaarNo") ?? " "}
              inputProps={{ maxLength: 12 }}
            />

            {/* Application Type */}
            <TextField
              select
              label="Application Type *"
              fullWidth
              value={form.applicationType}
              onChange={(e) => handleChange("applicationType", e.target.value)}
              helperText={
                form.applicationType === "STANDARD" && form.cgpa >= 8.5
                  ? "You are eligible for PREMIUM (CGPA ≥ 8.5)"
                  : " "
              }
            >
              <MenuItem value="STANDARD">STANDARD</MenuItem>
              <MenuItem value="PREMIUM" disabled={form.cgpa < 8.5}>
                PREMIUM {form.cgpa > 0 && form.cgpa < 8.5 && "— requires CGPA ≥ 8.5"}
              </MenuItem>
            </TextField>

            {/* Skills (optional) */}
            <Autocomplete
              multiple
              options={skills}
              getOptionLabel={(o) => o.skillName}
              value={selectedSkills}
              onChange={(_, newValue) => setSelectedSkills(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Skills (optional)"
                  placeholder="Search and select skills…"
                  helperText=" "
                />
              )}
              className="public-reg-full-width"
            />
          </Box>

          <Box className="public-reg-submit-container">
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              className="t-btn-primary public-reg-submit-btn"
            >
              {loading ? "Submitting…" : "Submit Registration"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PublicCandidateRegistration;
