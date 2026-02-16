export interface User {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  company?: string;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  company?: string | null;
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
}

export interface LoginDto {
  email: string;
  password: string;
}
