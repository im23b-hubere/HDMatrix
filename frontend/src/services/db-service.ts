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

const API_BASE_URL = 'http://localhost:5000/api'; // Basis-URL für unsere API

export class DatabaseService {
    static async searchEmployees(query: string, filters?: SearchFilters): Promise<SearchResult> {
        try {
            const queryParams = new URLSearchParams();
            if (query) queryParams.append('query', query);
            if (filters?.department) queryParams.append('department', filters.department.toString());
            if (filters?.skills?.length) queryParams.append('skills', filters.skills.join(','));

            const response = await fetch(`${API_BASE_URL}/employees/search?${queryParams}`);
            if (!response.ok) {
                throw new Error('Fehler bei der Mitarbeitersuche');
            }
            return await response.json();
        } catch (error) {
            console.error('Fehler bei der Mitarbeitersuche:', error);
            return { employees: [] };
        }
    }

    static async getDepartments(): Promise<Array<{id: number, name: string}>> {
        try {
            const response = await fetch(`${API_BASE_URL}/departments`);
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Abteilungen');
            }
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Abteilungen:', error);
            return [];
        }
    }

    static async getAllSkills(): Promise<string[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/skills`);
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Skills');
            }
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Skills:', error);
            return [];
        }
    }

    static async getEmployeeDetails(id: number): Promise<Employee | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/employees/${id}`);
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
            const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/skills`);
            
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