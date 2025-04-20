import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  user: any;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  signup: async () => false,
  login: async () => false,
  user: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Signup failed with status:', res.status, errorData);
        throw new Error(errorData.error || `Signup failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log('Signup successful:', data);
      return true;
    } catch (err) {
      console.error('Signup error:', err);
      throw err;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json(); // Get the response data
  
      // Log the response data to see what the server is actually returning
      console.log('Server response:', data);
      console.log(data.ok)
  
      if (!data.ok) {
        throw new Error(data.message );
      }
  
      if (data.token && data.user) {
        console.log("Login success");
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return true;
      } else {
        console.log("Missing token or user", data.token, data.user);
        throw new Error('Invalid response data from server');
      }
    } catch (err: any) {
      console.error('Login error:', err.message); // Log any errors
      throw new Error(err.message || 'An error occurred during login');
    }
  };
  
  

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ signup, login, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
