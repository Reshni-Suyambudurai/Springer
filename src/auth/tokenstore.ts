import Cookies from "js-cookie";
import type { AuthUser } from "../types/auth.types";

const TOKEN_KEY = "auth_token";
const CUSTOMER_KEY = "springer_user";
const THEME_KEY = "theme";

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
};