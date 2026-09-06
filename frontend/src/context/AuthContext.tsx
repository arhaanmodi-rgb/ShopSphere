import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserProfile } from "../services/authApi";
import {
  getToken,
  getStoredUser,
  login as apiLogin,
  register as apiRegister,
  getMe,
  logout as apiLogout,
} from "../services/authApi";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string) => Promise<UserProfile>;
  logoutUser: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    async function initAuth() {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const profile = await getMe();
          setUser(profile);
          setTokenState(storedToken);
        } catch {
          // Token expired or invalid
          setUser(null);
          setTokenState(null);
        }
      } else {
        setUser(null);
        setTokenState(null);
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const loginUser = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setTokenState(data.access_token);
    if (data.user) {
      setUser(data.user);
    } else {
      const profile = await getMe();
      setUser(profile);
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    password: string
  ) => {
    const newUser = await apiRegister(name, email, password);
    return newUser;
  };

  const logoutUser = () => {
    apiLogout();
    setUser(null);
    setTokenState(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await getMe();
      setUser(profile);
    } catch {
      logoutUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        loginUser,
        registerUser,
        logoutUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
