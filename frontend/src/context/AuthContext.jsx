/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const navigate = useNavigate();

  // Gọi sau khi đăng nhập thành công — nhận token và role từ response
  const login = (newToken, newRole) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole || 'USER');
    setToken(newToken);
    setRole(newRole || 'USER');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
    navigate('/login');
  };

  const isAdmin = role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ token, role, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
