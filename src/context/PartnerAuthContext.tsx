import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { partnerAuthApi } from '../api/partnerClient';
import { PartnerUserType } from '../types/partner.types';
import type { PartnerUser } from '../types/partner.types';

interface PartnerAuthContextType {
  partnerUser: PartnerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  canAccessMerchant: (merchantId: string) => boolean;
  isPartnerType: boolean;
  isClientType: boolean;
}

const PartnerAuthContext = createContext<PartnerAuthContextType | undefined>(
  undefined
);

export function PartnerAuthProvider({ children }: { children: ReactNode }) {
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.location.pathname.includes('/login')) {
      setLoading(false);
      return;
    }
    partnerAuthApi
      .getProfile()
      .then((res) => {
        setPartnerUser({
          userId: res.data.userId,
          email: res.data.email,
          name: res.data.name || res.data.email.split('@')[0],
          partnerId: res.data.partnerId,
          partnerUserType: res.data.partnerUserType,
          assignedMerchants: res.data.assignedMerchants || [],
        });
      })
      .catch(() => { /* no valid session cookie */ })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await partnerAuthApi.login(email, password);
    const profile = await partnerAuthApi.getProfile();
    setPartnerUser({
      userId: profile.data.userId,
      email: profile.data.email,
      name: profile.data.name || profile.data.email.split('@')[0],
      partnerId: profile.data.partnerId,
      partnerUserType: profile.data.partnerUserType,
      assignedMerchants: profile.data.assignedMerchants || [],
    });
  };

  const logout = async () => {
    try { await partnerAuthApi.logout(); } catch { /* ignore */ }
    setPartnerUser(null);
  };

  // Check if user can access a specific merchant
  const canAccessMerchant = (merchantId: string): boolean => {
    if (!partnerUser) return false;
    if (partnerUser.partnerUserType === PartnerUserType.PARTNER) {
      // PARTNER type can access all merchants of their partner (validated in backend)
      return true;
    }
    // CLIENT type can only access assigned merchants
    return partnerUser.assignedMerchants.includes(merchantId);
  };

  const isPartnerType =
    partnerUser?.partnerUserType === PartnerUserType.PARTNER;
  const isClientType = partnerUser?.partnerUserType === PartnerUserType.CLIENT;

  return (
    <PartnerAuthContext.Provider
      value={{
        partnerUser,
        loading,
        login,
        logout,
        canAccessMerchant,
        isPartnerType,
        isClientType,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  const context = useContext(PartnerAuthContext);
  if (!context) {
    throw new Error(
      'usePartnerAuth must be used within PartnerAuthProvider'
    );
  }
  return context;
}
