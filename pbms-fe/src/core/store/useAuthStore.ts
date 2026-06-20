import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  email: string | null;
  role: string | null;
  shiftStatus: 'OPEN' | 'CLOSED';
  activeGateId: string | null;
  name: string | null;
  authProvider: 'LOCAL' | 'GOOGLE' | null;
  hasPassword: boolean;
  setAuth: (token: string, email: string, role: string) => void;
  mockLogin: (role: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setShiftStatus: (status: 'OPEN' | 'CLOSED') => void;
  setActiveGate: (gateId: string | null) => void;
  updateProfile: (name: string) => void;
  linkGoogleAccount: () => void;
  createPassword: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      email: null,
      role: null,
      shiftStatus: 'CLOSED',
      activeGateId: null,
      name: null,
      authProvider: null,
      hasPassword: false,
      setAuth: (token, email, role) => set({ token, email, role }),
      mockLogin: (role) => set({ 
        token: 'mock-jwt-token', 
        email: `mock_${role.toLowerCase()}@pbms.com`, 
        role,
        name: `User ${role}`,
        authProvider: Math.random() > 0.5 ? 'GOOGLE' : 'LOCAL',
        hasPassword: Math.random() > 0.5,
        shiftStatus: 'CLOSED'
      }),
      logout: () => set({ token: null, email: null, role: null, shiftStatus: 'CLOSED', activeGateId: null, name: null, authProvider: null, hasPassword: false }),
      isAuthenticated: () => !!get().token,
      setShiftStatus: (status) => set({ shiftStatus: status }),
      setActiveGate: (gateId) => set({ activeGateId: gateId }),
      updateProfile: (name) => set({ name }),
      linkGoogleAccount: () => set({ authProvider: 'GOOGLE' }),
      createPassword: () => set({ hasPassword: true }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
