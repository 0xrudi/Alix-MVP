// src/types/auth.ts
export interface AuthUser {
    id: string;
    email?: string;
    metadata?: Record<string, any>;
  }
  
  export interface AuthState {
    user: AuthUser | null;
    loading: boolean;
    error: Error | null;
  }
  
  export interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => Promise<void>;
  }