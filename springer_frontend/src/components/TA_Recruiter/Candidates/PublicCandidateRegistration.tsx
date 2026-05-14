import React, { useState, useEffect } from "react";
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

// Public API methods (no auth required)
const publicFormApi = {
  async getFormById(formId: number) {
    const response = await publicHttp.get(`/forms/${formId}`);
    return response.data;
  }
};

const publicInstituteApi = {
  async getAllInstitutes() {
    const response = await publicHttp.get('/institutes');
    return response.data;
  }
};

const publicSkillsApi = {
  async getAllSkills() {
    const response = await publicHttp.get('/skills');
    return response.data;
  }
};

const publicRegistrationApi = {
  async submitRegistration(driveId: number, data: CandidateRegistrationRequest) {
    const response = await publicHttp.post(`/candidate-registrations/drive/${driveId}/register`, data);
    return response.data;
  }
};

const PublicCandidateRegistration: React.FC = () => {
  const { driveName, formId } = useParams<{ driveName: string; formName: string; formId: string }>();
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formClosed, setFormClosed] = useState(false);
  const [driveId, setDriveId] = useState<number | null>(null);
  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteResponse | null>(null);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SkillResponse[]>([]);
  const [formData, setFormData] = useState<Omit<CandidateRegistrationRequest, "formId">>({
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
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchFormDetails = async () => {
      if (!formId) return;
      
      try {
        const response = await publicFormApi.getFormById(parseInt(formId));
        if (response.success && response.data) {
          setDriveId(response.data.driveId);
        }
      } catch {
        showToast("Failed to load form details", "error");
      }
    };

    const fetchInstitutes = async () => {
      try {
        const response = await publicInstituteApi.getAllInstitutes();
        if (response.success && response.data) {
          setInstitutes(response.data.filter((inst: InstituteResponse) => inst.isActive));
        }
      } catch {
        showToast("Failed to load institutes", "error");
      }
    };

    const fetchSkills = async () => {
      try {
        const response = await publicSkillsApi.getAllSkills();
        if (response.success && response.data) {
          setSkills(response.data);
        }
      } catch {
        showToast("Failed to load skills", "error");
      }
    };

    fetchFormDetails();
    fetchInstitutes();
    fetchSkills();
  }, [formId]);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, boolean> = {};
    
    // Required fields validation
    if (!formData.fname.trim()) errors.fname = true;
    if (!formData.email.trim()) errors.email = true;
    if (!formData.phone.trim()) errors.phone = true;
    if (!selectedInstitute) errors.collegeName = true;
    else if (selectedInstitute.instituteId === 1) {
      const customName = formData.collegeName.trim();
      const isStillDefault = customName === "" || customName.toLowerCase() === selectedInstitute.instituteName.trim().toLowerCase();
      if (isStillDefault) {
        errors.customCollegeName = true;
        showToast("Please enter your full college name", "error");
      }
    }
    if (!formData.degree) errors.degree = true;
    if (!formData.department) errors.department = true;
    if (!formData.dob) errors.dob = true;
    const currentYear = new Date().getFullYear();
    if (!formData.graduationYear || formData.graduationYear < 1990 || formData.graduationYear > currentYear + 6) errors.graduationYear = true;
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = true;
      showToast("Please enter a valid email address", "error");
    }
    
    // Phone format validation (10-digit Indian mobile starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.phone = true;
      showToast("Phone must be a valid 10-digit Indian number starting with 6-9", "error");
    }
    
    // CGPA validation
    if (isNaN(formData.cgpa) || formData.cgpa <= 0 || formData.cgpa > 10) {
      errors.cgpa = true;
      showToast("CGPA must be a valid number between 0 and 10", "error");
    }
    
    // History of Arrears validation
    if (isNaN(formData.historyOfArrears) || formData.historyOfArrears < 0 || !Number.isInteger(formData.historyOfArrears)) {
      errors.historyOfArrears = true;
      showToast("History of arrears must be a valid non-negative integer", "error");
    }
    
    // Aadhaar format validation (12 digits) - only if provided
    if (formData.aadhaarNo && formData.aadhaarNo.trim()) {
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(formData.aadhaarNo)) {
        errors.aadhaarNo = true;
        showToast("Aadhaar must be exactly 12 digits", "error");
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Please fill all required fields correctly", "error");
      return;
    }

    if (!formId || !driveId) {
      showToast("Invalid form or drive ID", "error");
      return;
    }

    try {
      setLoading(true);
      const requestData: CandidateRegistrationRequest = {
        ...formData,
        formId: parseInt(formId),
        instituteId: selectedInstitute?.instituteId,
        skills: selectedSkills.length > 0 ? selectedSkills.map(skill => skill.skillId).join(",") : undefined,
        aadhaarNo: formData.aadhaarNo?.trim() || undefined,
      };

      const response = await publicRegistrationApi.submitRegistration(driveId, requestData);
      if (response.success) {
        showToast(response.message || "Registration submitted successfully!", "success");
        setSubmitted(true);
      }
    } catch (error) {
      const responseData = (error as { response?: { data?: { success?: boolean; message?: string; data?: unknown } } })?.response?.data;

      // Extract the most descriptive error message available:
      // If the backend returned field-level validation errors in `data`, join them.
      // Otherwise fall back to the top-level `message`.
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

      // Check if form is closed/inactive
      if (errorMessage.toLowerCase().includes("inactive") || errorMessage.toLowerCase().includes("cannot accept registrations")) {
        setFormClosed(true);
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Box className="public-reg-container">
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

      <Card className="public-reg-form-card">
        <CardContent>
          <Box className="public-reg-form-grid">
            {/* First Name */}
            <TextField
              label="First Name *"
              fullWidth
              value={formData.fname}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only alphabets and spaces
                if (value === "" || /^[A-Za-z\s]+$/.test(value)) {
                  setFormData({ ...formData, fname: value });
                  clearFieldError("fname");
                }
              }}
              error={fieldErrors.fname}
              helperText={fieldErrors.fname && "First name is required"}
            />

            {/* Last Name */}
            <TextField
              label="Last Name"
              fullWidth
              value={formData.lname}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only alphabets and spaces
                if (value === "" || /^[A-Za-z\s]+$/.test(value)) {
                  setFormData({ ...formData, lname: value });
                }
              }}
            />

            {/* Email */}
            <TextField
              label="Email *"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                clearFieldError("email");
              }}
              error={fieldErrors.email}
              helperText={fieldErrors.email && "Valid email is required"}
            />

            {/* Phone */}
            <TextField
              label="Phone *"
              fullWidth
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and max 10 digits
                if (value === "" || (/^\d+$/.test(value) && value.length <= 10)) {
                  setFormData({ ...formData, phone: value });
                  clearFieldError("phone");
                }
              }}
              error={fieldErrors.phone}
              helperText={fieldErrors.phone && "Phone number is required"}
              inputProps={{ maxLength: 10 }}
            />

            {/* College Name */}
            <div className="public-reg-others-college-wrapper">
              <Autocomplete
                options={institutes}
                getOptionLabel={(option) => option.instituteName}
                value={selectedInstitute}
                onChange={(_, newValue) => {
                  setSelectedInstitute(newValue);
                  setFormData({ ...formData, collegeName: newValue ? newValue.instituteName : "" });
                  clearFieldError("collegeName");
                  clearFieldError("customCollegeName");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="College Name *"
                    error={fieldErrors.collegeName}
                    helperText={fieldErrors.collegeName && "Please select a college from the list"}
                  />
                )}
                className="public-reg-full-width"
              />
              {selectedInstitute?.instituteId === 1 && (
                <TextField
                  label="Enter Full College Name *"
                  fullWidth
                  placeholder="Enter full college name"
                  value={formData.collegeName === selectedInstitute.instituteName ? "" : formData.collegeName}
                  onChange={(e) => {
                    setFormData({ ...formData, collegeName: e.target.value });
                    clearFieldError("customCollegeName");
                  }}
                  error={fieldErrors.customCollegeName}
                  helperText={fieldErrors.customCollegeName ? "College name is required" : " "}
                />
              )}
            </div>

            {/* Graduation Year */}
            <TextField
              label="Graduation Year *"
              type="number"
              fullWidth
              value={formData.graduationYear}
              onChange={(e) => {
                setFormData({ ...formData, graduationYear: parseInt(e.target.value) });
                clearFieldError("graduationYear");
              }}
              error={fieldErrors.graduationYear}
              helperText={fieldErrors.graduationYear && "Graduation year is required"}
            />
            
            {/* Date of Birth */}
            <TextField
              label="Date of Birth *"
              type="date"
              fullWidth
              value={formData.dob}
              onChange={(e) => {
                setFormData({ ...formData, dob: e.target.value });
                clearFieldError("dob");
              }}
              error={fieldErrors.dob}
              helperText={fieldErrors.dob && "Date of birth is required"}
              InputLabelProps={{ shrink: true }}
            />


            {/* Degree */}
            <TextField
              select
              label="Degree *"
              fullWidth
              value={formData.degree}
              onChange={(e) => {
                setFormData({ ...formData, degree: e.target.value });
                clearFieldError("degree");
              }}
              error={fieldErrors.degree}
              helperText={fieldErrors.degree && "Degree is required"}
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
              value={formData.department}
              onChange={(e) => {
                setFormData({ ...formData, department: e.target.value });
                clearFieldError("department");
              }}
              error={fieldErrors.department}
              helperText={fieldErrors.department && "Department is required"}
            >
              {Object.values(Department).map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>

            {/* CGPA */}
            <TextField
              label="CGPA *"
              type="number"
              fullWidth
              value={formData.cgpa === 0 ? "" : formData.cgpa}
              onChange={(e) => {
                const value = e.target.value;
                const newCgpa = value === "" ? 0 : parseFloat(value);
                setFormData({ 
                  ...formData, 
                  cgpa: isNaN(newCgpa) ? 0 : newCgpa,
                  // Reset to STANDARD if CGPA drops below 8.5 and PREMIUM was selected
                  applicationType: newCgpa < 8.5 && formData.applicationType === "PREMIUM" ? "STANDARD" : formData.applicationType
                });
                clearFieldError("cgpa");
              }}
              error={fieldErrors.cgpa}
              helperText={fieldErrors.cgpa && "Valid CGPA is required"}
              inputProps={{ step: "0.01", min: "0", max: "10" }}
            />

            {/* History of Arrears */}
            <TextField
              label="History of Arrears *"
              type="number"
              fullWidth
              value={formData.historyOfArrears === 0 ? "" : formData.historyOfArrears}
              onChange={(e) => {
                const value = e.target.value;
                const newValue = value === "" ? 0 : parseInt(value);
                setFormData({ ...formData, historyOfArrears: isNaN(newValue) ? 0 : newValue });
                clearFieldError("historyOfArrears");
              }}
              error={fieldErrors.historyOfArrears}
              helperText={fieldErrors.historyOfArrears && "Valid number is required"}
              inputProps={{ min: "0" }}
            />

            {/* Aadhaar Number */}
            <TextField
              label="Aadhaar Number"
              fullWidth
              value={formData.aadhaarNo}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and max 12 digits
                if (value === "" || (/^\d+$/.test(value) && value.length <= 12)) {
                  setFormData({ ...formData, aadhaarNo: value });
                  clearFieldError("aadhaarNo");
                }
              }}
              error={fieldErrors.aadhaarNo}
              helperText={fieldErrors.aadhaarNo && "Aadhaar must be 12 digits"}
              inputProps={{ maxLength: 12 }}
            />

            {/* Application Type */}
            <TextField
              select
              label="Application Type *"
              fullWidth
              value={formData.applicationType}
              onChange={(e) => {
                setFormData({ ...formData, applicationType: e.target.value });
              }}
            >
              <MenuItem value="STANDARD">STANDARD</MenuItem>
              <MenuItem value="PREMIUM" disabled={formData.cgpa < 8.5}>
                PREMIUM {formData.cgpa < 8.5 && "(Requires CGPA >= 8.5)"}
              </MenuItem>
            </TextField>

            {/* Skills */}
            <Autocomplete
              multiple
              options={skills}
              getOptionLabel={(option) => option.skillName}
              value={selectedSkills}
              onChange={(_, newValue) => {
                setSelectedSkills(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Skills"
                  placeholder="Search and select skills..."
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
              className="t-btn-primary"
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PublicCandidateRegistration;
