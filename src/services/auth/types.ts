// src/services/auth/types.ts
export interface User {
    id: string;
    email?: string;
    walletAddress?: string;
    metadata?: Record<string, any>;
  }
  
  export interface AuthProvider {
    login(email: string): Promise<void>;
    logout(): Promise<void>;
    getUser(): User | null;
    onAuthStateChange(callback: (user: User | null) => void): () => void;
  }