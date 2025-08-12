import { UserRole, Department } from './enums';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roleName: string;
  department: Department;
  departmentName: string;
  isActive: boolean;
  jobTitle?: string;
  phoneNumber?: string;
  createdDate: Date;
  lastLoginDate?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: Department;
  jobTitle?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  expiresAt?: Date;
  errorMessage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  jobTitle?: string;
}

export interface JwtPayload {
  nameid: string;
  email: string;
  role: string;
  department: string;
  exp: number;
  iss: string;
  aud: string;
}