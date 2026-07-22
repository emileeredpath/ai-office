import { useAppStore } from '@/store/appStore';

export function useAppContext() {
  const companyId = useAppStore((s) => s.companyId);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const currentUserName = useAppStore((s) => s.currentUserName);
  const setCompanyId = useAppStore((s) => s.setCompanyId);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  return {
    companyId,
    currentUserId,
    currentUserName,
    setCompanyId,
    setCurrentUser,
  };
}
