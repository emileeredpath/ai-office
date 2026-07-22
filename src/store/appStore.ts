import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppState {
  companyId: string | null;
  currentUserId: string | null;
  currentUserName: string | null;
  setCompanyId: (id: string) => void;
  setCurrentUser: (id: string, name: string) => void;
}

export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set) => ({
      companyId: null,
      currentUserId: null,
      currentUserName: null,
      setCompanyId: (id) => set({ companyId: id }),
      setCurrentUser: (id, name) => set({ currentUserId: id, currentUserName: name }),
    }),
    {
      name: 'ai-office-app-store',
    }
  )
);
