import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // {id,name,email,role}
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // LOGIN
  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
    return res.data;
  };

  // REGISTER
  const register = async (name, email, password) => {
    const res = await API.post("/auth/register", {
      name,
      email,
      password
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
    return res.data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};
