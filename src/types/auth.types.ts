// Authentication related types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  roleId: number;
  roleName: string;
  username: string;
  email: string;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface AuthUser {
  userId: number;
  roleId: number;
  roleName: string;
  username: string;
  email: string;
}
