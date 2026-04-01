import Cookies from "js-cookie";
import type { AuthUser } from "../types/auth.types";
import type { CandidateFilters } from "../types/TA_Recruiter/Drive/candidate.types";
import type { InstituteFilters } from "../types/TA_Recruiter/Hiring/institute.types";

const TOKEN_KEY = "auth_token";
const CUSTOMER_KEY = "user";
const THEME_KEY = "theme";
const CANDIDATE_FILTERS_KEY = "savedCandidateFilters";
const SIDEBAR_STATE_KEY = "sidebarOpen";

export const tokenstore = {
  getToken() {
    return Cookies.get(TOKEN_KEY) || null;
  },

  setToken(token: string) {
    Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "strict" });
  },

  setUser(user: AuthUser) {
    Cookies.set(CUSTOMER_KEY, JSON.stringify(user), {
      expires: 7,
      sameSite: "strict",
    });
  },

  getUser(): AuthUser | null {
    const data = Cookies.get(CUSTOMER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setTheme(theme: "light" | "dark") {
    localStorage.setItem(THEME_KEY, theme);
  },

  getTheme(): "light" | "dark" {
    return (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
  },

  clear() {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(CUSTOMER_KEY);
  },

  // Candidate Filters (SessionStorage)
  saveCandidateFilters(filters: CandidateFilters) {
    try {
      sessionStorage.setItem(CANDIDATE_FILTERS_KEY, JSON.stringify(filters));
      return true;
    } catch (error) {
      console.error("Failed to save candidate filters:", error);
      return false;
    }
  },

  getCandidateFilters(): CandidateFilters | null {
    try {
      const saved = sessionStorage.getItem(CANDIDATE_FILTERS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to retrieve candidate filters:", error);
      return null;
    }
  },

  clearCandidateFilters() {
    sessionStorage.removeItem(CANDIDATE_FILTERS_KEY);
  },

  // Institute Filters (SessionStorage)
  saveInstituteFilters(filters: InstituteFilters) {
    try {
      sessionStorage.setItem('savedInstituteFilters', JSON.stringify(filters));
      return true;
    } catch (error) {
      console.error("Failed to save institute filters:", error);
      return false;
    }
  },

  getInstituteFilters(): InstituteFilters | null {
    try {
      const saved = sessionStorage.getItem('savedInstituteFilters');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to retrieve institute filters:", error);
      return null;
    }
  },

  clearInstituteFilters() {
    sessionStorage.removeItem('savedInstituteFilters');
  },

  // Sidebar State (LocalStorage - User Preference)
  setSidebarOpen(isOpen: boolean) {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isOpen));
  },

  getSidebarOpen(): boolean {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved !== null ? JSON.parse(saved) : true; // Default to true (open)
    } catch (error) {
      console.error("Failed to retrieve sidebar state:", error);
      return true; // Default to true on error
    }
  },
};