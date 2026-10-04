import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/users/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('pp_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      async login(payload) {
        const res = await api.post('/auth/login', payload);
        localStorage.setItem('pp_token', res.data.data.token);
        setUser(res.data.data.user);
        return res.data.data.user;
      },
      async register(payload) {
        const res = await api.post('/auth/register', payload);
        localStorage.setItem('pp_token', res.data.data.token);
        setUser(res.data.data.user);
        return res.data.data.user;
      },
      async demo() {
        const res = await api.post('/auth/demo');
        localStorage.setItem('pp_token', res.data.data.token);
        setUser(res.data.data.user);
        return res.data.data.user;
      },
      logout() {
        localStorage.removeItem('pp_token');
        setUser(null);
        api.post('/auth/logout').catch(() => {});
      },
      refresh: async () => {
        const res = await api.get('/users/me');
        setUser(res.data.data);
        return res.data.data;
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
