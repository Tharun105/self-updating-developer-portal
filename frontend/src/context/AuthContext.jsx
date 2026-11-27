import { createContext, useContext, useMemo, useState } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const persist = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ ...data, token: undefined }));
    setUser({ ...data, token: undefined });
  };

  const value = useMemo(
    () => ({
      user,
      login: async (creds) => persist(await authApi.login(creds)),
      register: async (body) => persist(await authApi.register(body)),
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      },
      isAdmin: user?.role === 'ADMIN',
      canEdit: user?.role === 'ADMIN' || user?.role === 'DEVELOPER',
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
