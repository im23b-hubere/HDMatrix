import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  tenant_id: number;
  role_id: number;
  create_employee?: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_id: number;
  tenant_id: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

// Authentifizierungs-Service
const authService = {
  // Login-Funktion
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log(`Login-Versuch für ${credentials.email}`);
      
      // Verwende direkt-login Endpunkt 
      const loginUrl = 'http://localhost:5000/api/auth/direct-login';
      console.log(`Sende Login-Anfrage an: ${loginUrl}`);
      
      const response = await axios.post(loginUrl, credentials, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Login-Antwort erhalten:', response.data);
      
      if (response.data.success && response.data.token) {
        // Token im localStorage speichern
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Wichtig: isLoggedIn-Flag setzen für die Router-Guards
        localStorage.setItem('isLoggedIn', 'true');
        console.log('Token, Benutzer und isLoggedIn-Status im localStorage gespeichert');
      } else {
        console.warn('Login nicht erfolgreich oder kein Token in der Antwort');
        localStorage.removeItem('isLoggedIn');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login-Fehler:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios-Fehler:', error.message);
        if (error.response) {
          console.error('Fehler-Response:', error.response.data);
          console.error('Status:', error.response.status);
          console.error('Headers:', error.response.headers);
          return error.response.data as AuthResponse;
        } else if (error.request) {
          console.error('Keine Antwort erhalten. Request:', error.request);
        } else {
          console.error('Fehler beim Erstellen der Anfrage:', error.message);
        }
      }
      
      localStorage.removeItem('isLoggedIn');
      return {
        success: false,
        message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      };
    }
  },
  
  // Registrierungs-Funktion
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      };
    }
  },
  
  // Logout-Funktion
  logout: async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Token auf dem Server invalidieren
        await axios.post(
          `${API_URL}/auth/logout`, 
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Logout-Fehler:', error);
    } finally {
      // Lokalen Speicher löschen
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
    }
  },
  
  // Passwort-Zurücksetzen initiieren
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      };
    }
  },
  
  // Passwort-Zurücksetzen abschließen
  resetPassword: async (token: string, new_password: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, { 
        token, 
        new_password 
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      };
    }
  },
  
  // Passwort ändern
  changePassword: async (current_password: string, new_password: string): Promise<AuthResponse> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return {
          success: false,
          message: 'Nicht eingeloggt'
        };
      }
      
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        { current_password, new_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      };
    }
  },
  
  // E-Mail-Adresse verifizieren
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      };
    }
  },
  
  // Aktuelle Benutzerinformationen holen
  getCurrentUser: async (): Promise<User | null> => {
    // Zuerst aus localStorage holen
    const userString = localStorage.getItem('user');
    if (userString) {
      return JSON.parse(userString);
    }
    
    // Falls nicht im localStorage, versuche vom Server zu holen
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    try {
      const response = await axios.get(
        `${API_URL}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success && response.data.user) {
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des aktuellen Benutzers:', error);
      return null;
    }
  },
  
  // Prüft, ob der Benutzer eingeloggt ist
  isLoggedIn: (): boolean => {
    return localStorage.getItem('token') !== null;
  },
  
  // Benutzer-Token holen
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  // Setup des Axios-Interceptors für automatische Authentifizierung
  setupAxiosInterceptors: (): void => {
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response-Interceptor für 401-Fehler (Token abgelaufen)
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Token ist ungültig oder abgelaufen
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Optional: Umleitung zur Login-Seite
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  },
  
  // Mandant anhand der Subdomain abrufen
  getTenantBySubdomain: async (subdomain: string): Promise<Tenant | null> => {
    try {
      const response = await axios.get(`${API_URL}/auth/tenants/by-subdomain/${subdomain}`);
      
      if (response.data.success) {
        return response.data.tenant;
      }
      
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Mandanten:', error);
      return null;
    }
  },
  
  // Verfügbare Rollen abrufen
  getRoles: async (): Promise<Role[]> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return [];
      }
      
      const response = await axios.get(
        `${API_URL}/auth/roles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        return response.data.roles;
      }
      
      return [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Rollen:', error);
      return [];
    }
  }
};

// Interceptors beim Import des Services einrichten
authService.setupAxiosInterceptors();

export default authService; 