import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  Admin: { email: 'admin@relief.org', label: 'Dr. Rajesh Sharma (Admin)' },
  Authority: { email: 'authority@relief.org', label: 'Commissioner Deshmukh (Authority)' },
  Coordinator: { email: 'coordinator@relief.org', label: 'Vikram Malhotra (Coordinator)' },
  Volunteer: { email: 'volunteer@relief.org', label: 'Rohan Verma (Volunteer)' },
  Donor: { email: 'donor@relief.org', label: 'Pooja Patel (Donor)' },
  Citizen: { email: 'citizen@relief.org', label: 'Amit Kumar (Citizen)' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vanguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vanguard_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.user);
            localStorage.setItem('vanguard_user', JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('vanguard_token', data.token);
    localStorage.setItem('vanguard_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vanguard_token');
    localStorage.removeItem('vanguard_user');
  };

  // Helper to switch instantly between the 6 demo roles
  const switchDemoRole = async (roleName) => {
    const demo = DEMO_USERS[roleName];
    if (demo) {
      return await login(demo.email, 'Password@123');
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin has super-access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
