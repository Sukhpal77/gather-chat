'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client-api';

export function useSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/me')
      .then((data) => setUser(data.user))
      .catch((error) => {
        if (error.status !== 401) setError(error.message);
      })
      .finally(() => setLoading(false));
  }, []);
  async function logout() {
    await api('/auth/logout', { method: 'POST', body: {} });
    setUser(null);
  }
  return { user, setUser, loading, error, logout };
}
