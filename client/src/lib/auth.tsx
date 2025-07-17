import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, serverUrl: string) => Promise<{
    has_active_plan: boolean;
    token: string;
    user: User;
  }>;
  logout: () => void;
  hasActivePlan: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("keeptur-token");
    const userData = localStorage.getItem("keeptur-user");
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Check plan status
        checkPlanStatus();
      } catch (error) {
        console.error("Error loading saved auth:", error);
        logout();
      }
    }
  }, []);

  const checkPlanStatus = async () => {
    try {
      const empresaId = localStorage.getItem("keeptur-empresa-id");
      if (empresaId) {
        const response = await apiRequest("GET", `/api/plans/status/${empresaId}`);
        const data = await response.json();
        setHasActivePlan(data.has_active_plan);
      }
    } catch (error) {
      console.error("Error checking plan status:", error);
    }
  };

  const login = async (email: string, password: string, serverUrl: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
        serverUrl,
      });

      const data = await response.json();
      
      setUser(data.user);
      setIsAuthenticated(true);
      setHasActivePlan(data.has_active_plan);
      
      // Save to localStorage
      localStorage.setItem("keeptur-token", data.token);
      localStorage.setItem("keeptur-user", JSON.stringify(data.user));
      localStorage.setItem("keeptur-empresa-id", data.empresa_id.toString());
      localStorage.setItem("keeptur-monde-token", data.monde_token);
      localStorage.setItem("keeptur-server-url", serverUrl);
      
      return {
        has_active_plan: data.has_active_plan,
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to invalidate session on server
      const token = localStorage.getItem("keeptur-token");
      if (token) {
        await apiRequest("POST", "/api/auth/logout", {});
      }
    } catch (error) {
      console.log("Erro ao invalidar sessão no servidor:", error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    setHasActivePlan(false);
    
    // Clear localStorage
    localStorage.removeItem("keeptur-token");
    localStorage.removeItem("keeptur-user");
    localStorage.removeItem("keeptur-empresa-id");
    localStorage.removeItem("keeptur-monde-token");
    localStorage.removeItem("keeptur-server-url");
    
    // Force redirect to login
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        hasActivePlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
