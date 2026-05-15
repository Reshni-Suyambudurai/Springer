import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { http } from '../services/api/https';

interface Role {
  roleId: number;
  roleName: string;
}

interface RolesContextType {
  roles: Role[];
  loading: boolean;
  getRoleId: (roleName: string) => number | null;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export const RolesProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch roles once on app load
    http.get('/auth/roles')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setRoles(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRoleId = (roleName: string): number | null => {
    const role = roles.find(r => r.roleName === roleName);
    return role ? role.roleId : null;
  };

  return (
    <RolesContext.Provider value={{ roles, loading, getRoleId }}>
      {children}
    </RolesContext.Provider>
  );
};

export const useRoles = () => {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error('useRoles must be used within RolesProvider');
  }
  return context;
};
