interface Employee {
    id: number;
    vorname: string;
    nachname: string;
    email: string;
    position: string;
    abteilung_id: number;
    skills: string[];
}

interface SearchResult {
    employees: Employee[];
}

interface SearchFilters {
    department?: number;
    skills?: string[];
}

interface Department {
    id: number;
    name: string;
}

export class DatabaseService {
    private static readonly API_BASE_URL = 'http://localhost:5000/api';

    static async searchEmployees(query: string, filters?: SearchFilters): Promise<SearchResult> {
        try {
            console.log('Sende Suchanfrage:', { query, filters });
            const queryParams = new URLSearchParams();
            if (query) queryParams.append('query', query);
            if (filters?.department) queryParams.append('department', filters.department.toString());
            if (filters?.skills?.length) queryParams.append('skills', filters.skills.join(','));

            const url = `${this.API_BASE_URL}/employees/search?${queryParams}`;
            console.log('Request URL:', url);

            const response = await fetch(url);
            console.log('API Response Status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Fehler bei der Mitarbeitersuche: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response Data:', data);
            return data;
        } catch (error) {
            console.error('Fehler bei der Mitarbeitersuche:', error);
            return { employees: [] };
        }
    }

    static async getDepartments(): Promise<Department[]> {
        try {
            console.log('Lade Abteilungen...');
            const response = await fetch(`${this.API_BASE_URL}/departments`);
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Abteilungen');
            }
            const data = await response.json();
            console.log('Geladene Abteilungen:', data);
            return data;
        } catch (error) {
            console.error('Fehler beim Laden der Abteilungen:', error);
            return [];
        }
    }

    static async getAllSkills(): Promise<string[]> {
        try {
            console.log('Lade Skills...');
            const response = await fetch(`${this.API_BASE_URL}/skills`);
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Skills');
            }
            const data = await response.json();
            console.log('Geladene Skills:', data);
            return data;
        } catch (error) {
            console.error('Fehler beim Laden der Skills:', error);
            return [];
        }
    }

    static async getEmployeeDetails(id: number): Promise<Employee | null> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/employees/${id}`);
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Mitarbeiterdaten');
            }
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Mitarbeiterdaten:', error);
            return null;
        }
    }

    static async getEmployeeSkills(employeeId: number): Promise<string[]> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/employees/${employeeId}/skills`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error getting employee skills:', error);
            throw error;
        }
    }
} 