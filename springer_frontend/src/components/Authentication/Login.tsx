import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/auth.api";
import { tokenstore } from "../../auth/tokenstore";
import type { LoginRequest } from "../../types/auth.types";
import { showToast } from "../../utils/toast";
import { getDashboardPathByRole } from "../../utils/navigation";
import { syncEligibilityFiltersToSession } from "../../utils/eligibilityFilterSync";
import "../../css/Authentication/Login.css";

import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  // Validation regex patterns
  const emailRegex = /^[a-zA-Z0-9._%+-]+@kanini\.com$/;
  const passwordMinLength = 4;

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Email must end with @kanini.com");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length <= passwordMinLength) {
      setPasswordError("Password must be greater than 4 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear general error
    if (error) setError("");
    
    // Validate on change
    if (name === "email") {
      if (value) validateEmail(value);
      else setEmailError("");
    }
    if (name === "password") {
      if (value) validatePassword(value);
      else setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.login(formData);

      tokenstore.setToken(response.token);
      tokenstore.setUser({
        userId: response.userId,
        roleId: response.roleId,
        roleName: response.roleName,
        username: response.username,
        email: response.email,
      });

      // Sync eligibility rules to sessionStorage filters (async, non-blocking)
      syncEligibilityFiltersToSession().catch((err: unknown) => 
        console.warn("Failed to sync eligibility filters:", err)
      );

      showToast("Login successful! Welcome back.", "success");
      const dashboardPath = getDashboardPathByRole(response.roleName);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      const e = err as { message?: string };
      const errorMessage = e.message || "Login failed. Please try again.";
      setError(errorMessage);
      showToast("Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay-card">
        {/* Left: Form */}
        <div className="login-left">
          <Box className="login-brand">
            <Typography variant="h4" className="login-title" textAlign="center">
              Welcome back
            </Typography>
            <Typography variant="body2" className="login-subtitle" textAlign="center">
              Login to S-TAMS
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} className="login-form" noValidate>
            <div>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="email"
                fullWidth
                className="login-field"
                error={!!emailError}
              />
              <Typography 
                variant="caption" 
                color="error" 
                className={`login-validation-error ${emailError ? 'visible' : 'hidden'}`}
              >
                {emailError || '\u00A0'}
              </Typography>
            </div>

            <div>
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="current-password"
                fullWidth
                className="login-field"
                error={!!passwordError}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          disabled={loading}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="login-eye-btn"
                        >
                          <span className="login-text-emoji" aria-hidden="true">
                            {showPassword ? "hide" : "show"}
                          </span>
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Typography 
                variant="caption" 
                color="error" 
                className={`login-validation-error ${passwordError ? 'visible' : 'hidden'}`}
              >
                {passwordError || '\u00A0'}
              </Typography>
            </div>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              className="login-submit"
              fullWidth
            >
              {loading ? (
                <span className="login-btn-loading">
                  <CircularProgress size={18} className="login-spinner" />
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </Button>

            <Typography className="login-footer" variant="caption">
              Talent Acquisition Management System
            </Typography>

            {/* Error message slot - always rendered to prevent layout shift */}
            <div className="login-error-slot">
              {error && (
                <Alert
                  className="login-error"
                  variant="outlined"
                  severity="error"
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}
            </div>
          </Box>
        </div>

        {/* Right: Image */}
        <div className="login-right" aria-hidden="true" />
      </div>
    </div>
  );
};

export default Login;