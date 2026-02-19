export interface User {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  isOemSeller: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  company?: string;
  isOemSeller?: boolean;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  isOemSeller: boolean;
  createdAt: string;
  token?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
  company?: string;
  isOemSeller: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface ValidateResetTokenResponse {
  valid: boolean;
  email?: string;
}
