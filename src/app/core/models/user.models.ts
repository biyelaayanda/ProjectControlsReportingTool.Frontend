import { UserRole, Department } from './enums';

// DTOs matching backend exactly
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  department: Department;
  phoneNumber?: string;
  jobTitle?: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  roleName: string;
  department: Department;
  departmentName: string;
  isActive: boolean;
  createdDate: Date;
  lastLoginDate: Date;
  phoneNumber?: string;
  jobTitle?: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
  expiresAt: Date;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  jobTitle?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}
