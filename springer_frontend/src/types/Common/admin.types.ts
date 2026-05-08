// ==================== Admin User Types ====================

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  roleName: string;
  department?: string;
  location?: string;
}

export interface UserResponse {
  userId: number;
  username: string;
  email: string;
  department: string | null;
  location: string | null;
  roleId: number;
  roleName: string;
  isActive: boolean;
}
