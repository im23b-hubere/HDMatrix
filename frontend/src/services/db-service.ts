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
    success: boolean;
    message?: string;
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

interface SearchFilters {
    department?: number;
    skills?: string[];
    location?: string;
    experience?: number;
    page?: number;
    page_size?: number;
}

interface Department {
    id: number;
    name: string;
    description?: string;
}

export class DatabaseService {
    private static readonly API_BASE_URL = '/api'; // Relative URL für Proxy-Nutzung
    private static readonly DEBUG = true; // Für Debugging-Zwecke

    static async searchEmployees(query: string, filters?: SearchFilters): Promise<SearchResult> {
        try {
            if (this.DEBUG) console.log('Sende Suchanfrage:', { query, filters });
            const queryParams = new URLSearchParams();
            if (query) queryParams.append('query', query);
            if (filters?.department) queryParams.append('department', filters.department.toString());
            if (filters?.skills?.length) queryParams.append('skills', filters.skills.join(','));
            if (filters?.location) queryParams.append('location', filters.location);
            if (filters?.experience) queryParams.append('experience', filters.experience.toString());
            if (filters?.page) queryParams.append('page', filters.page.toString());
            if (filters?.page_size) queryParams.append('page_size', filters.page_size.toString());

            const url = `${this.API_BASE_URL}/employees/search?${queryParams}`;
            if (this.DEBUG) console.log('Request URL:', url);

            // Verwende temporäre Mockergebnisse, wenn API nicht erreichbar ist
            try {
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                if (this.DEBUG) console.log('API Response Status:', response.status);
                
                if (!response.ok) {
                    console.warn(`API-Fehler: ${response.status} ${response.statusText}`);
                    return this.getMockEmployees(query, filters);
                }
                
                const data = await response.json();
                if (this.DEBUG) console.log('API Response Data:', data);
                return {
                    ...data,
                    success: true
                };
            } catch (error) {
                console.warn('API nicht erreichbar, verwende Mock-Daten:', error);
                return this.getMockEmployees(query, filters);
            }
        } catch (error) {
            console.error('Fehler bei der Mitarbeitersuche:', error);
            return { 
                employees: [],
                success: false,
                message: error instanceof Error ? error.message : 'Unbekannter Fehler',
                total: 0,
                page: 1,
                page_size: 10,
                total_pages: 0,
                has_next: false,
                has_prev: false
            };
        }
    }

    private static getMockEmployees(query: string, filters?: SearchFilters): SearchResult {
        console.log('Verwende Mock-Mitarbeiterdaten für:', { query, filters });
        
        // Mock-Mitarbeiter für Testzwecke
        const mockEmployees: Employee[] = [
            {
                id: 1,
                vorname: 'Max',
                nachname: 'Mustermann',
                email: 'max.mustermann@company.com',
                position: 'Senior Software Entwickler',
                abteilung_id: 1,
                skills: ['JavaScript', 'React', 'Node.js', 'TypeScript']
            },
            {
                id: 2,
                vorname: 'Anna',
                nachname: 'Schmidt',
                email: 'anna.schmidt@company.com',
                position: 'UX Designer',
                abteilung_id: 3,
                skills: ['UI Design', 'UX Research', 'Figma', 'Prototyping']
            },
            {
                id: 3,
                vorname: 'Thomas',
                nachname: 'Weber',
                email: 'thomas.weber@company.com',
                position: 'Product Manager',
                abteilung_id: 5,
                skills: ['Agile', 'Scrum', 'Product Strategy', 'Roadmapping']
            },
            {
                id: 4,
                vorname: 'Sarah',
                nachname: 'Mayer',
                email: 'sarah.mayer@company.com',
                position: 'Frontend Developer',
                abteilung_id: 1,
                skills: ['HTML', 'CSS', 'JavaScript', 'Vue.js']
            },
            {
                id: 5,
                vorname: 'Jan',
                nachname: 'Becker',
                email: 'jan.becker@company.com',
                position: 'Backend Developer',
                abteilung_id: 1,
                skills: ['Java', 'Spring', 'SQL', 'Microservices']
            }
        ];
        
        // Filter nach Suchbegriff
        let filteredEmployees = [...mockEmployees];
        if (query) {
            const queryLower = query.toLowerCase();
            filteredEmployees = filteredEmployees.filter(emp => 
                emp.vorname.toLowerCase().includes(queryLower) ||
                emp.nachname.toLowerCase().includes(queryLower) ||
                emp.position.toLowerCase().includes(queryLower) ||
                emp.skills.some(s => s.toLowerCase().includes(queryLower))
            );
        }
        
        // Filter nach Abteilung
        if (filters?.department) {
            filteredEmployees = filteredEmployees.filter(
                emp => emp.abteilung_id === filters.department
            );
        }
        
        // Filter nach Skills
        if (filters?.skills?.length) {
            filteredEmployees = filteredEmployees.filter(emp => 
                filters.skills!.some(skill => 
                    emp.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
                )
            );
        }
        
        // Paginierung anwenden
        const page = filters?.page || 1;
        const page_size = filters?.page_size || 10;
        const total = filteredEmployees.length;
        const total_pages = Math.ceil(total / page_size);
        
        // Slice der Daten für die aktuelle Seite
        const start = (page - 1) * page_size;
        const end = Math.min(start + page_size, total);
        const paginatedEmployees = filteredEmployees.slice(start, end);
        
        return { 
            employees: paginatedEmployees,
            success: true,
            message: 'Mock-Daten geladen',
            total: total,
            page: page,
            page_size: page_size,
            total_pages: total_pages,
            has_next: page < total_pages,
            has_prev: page > 1
        };
    }

    static async getDepartments(): Promise<Department[]> {
        try {
            if (this.DEBUG) console.log('Lade Abteilungen...');
            
            try {
                const response = await fetch(`${this.API_BASE_URL}/departments`);
                if (!response.ok) {
                    console.warn('Fehler beim Laden der Abteilungen, verwende Mock-Daten');
                    return this.getMockDepartments();
                }
                const data = await response.json();
                if (this.DEBUG) console.log('Geladene Abteilungen:', data);
                return data;
            } catch (error) {
                console.warn('API nicht erreichbar, verwende Mock-Abteilungen:', error);
                return this.getMockDepartments();
            }
        } catch (error) {
            console.error('Fehler beim Laden der Abteilungen:', error);
            return this.getMockDepartments();
        }
    }

    private static getMockDepartments(): Department[] {
        return [
            { id: 1, name: 'IT & Entwicklung', description: 'Softwareentwicklung und IT-Infrastruktur' },
            { id: 2, name: 'Data Science & KI', description: 'Datenanalyse und Künstliche Intelligenz' },
            { id: 3, name: 'Design & Kreativ', description: 'UI/UX Design und Grafikdesign' },
            { id: 4, name: 'Marketing & Kommunikation', description: 'Digitales Marketing und PR' },
            { id: 5, name: 'Projektmanagement', description: 'Projektleitung und Methoden' },
            { id: 6, name: 'Personal & HR', description: 'Personalwesen und Personalentwicklung' },
            { id: 7, name: 'Finanzen & Controlling', description: 'Finanzwesen und Controlling' },
            { id: 8, name: 'Qualität & Compliance', description: 'Qualitätsmanagement und Compliance' }
        ];
    }

    static async getAllSkills(): Promise<string[]> {
        try {
            if (this.DEBUG) console.log('Lade Skills...');
            
            try {
                const response = await fetch(`${this.API_BASE_URL}/skills`);
                if (!response.ok) {
                    console.warn('Fehler beim Laden der Skills, verwende Mock-Daten');
                    return this.getMockSkills();
                }
                const data = await response.json();
                if (this.DEBUG) console.log('Geladene Skills:', data);
                return data;
            } catch (error) {
                console.warn('API nicht erreichbar, verwende Mock-Skills:', error);
                return this.getMockSkills();
            }
        } catch (error) {
            console.error('Fehler beim Laden der Skills:', error);
            return this.getMockSkills();
        }
    }

    private static getMockSkills(): string[] {
        return [
            'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js',
            'Python', 'Java', 'C#', 'PHP', 'SQL', 'NoSQL', 'MongoDB', 'Docker',
            'Kubernetes', 'AWS', 'Azure', 'Git', 'CI/CD', 'Agile', 'Scrum',
            'UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Sketch',
            'Project Management', 'Product Management', 'Data Analysis',
            'Machine Learning', 'AI', 'Business Intelligence', 'Consulting'
        ];
    }

    static async getEmployeeDetails(id: number): Promise<Employee | null> {
        try {
            if (this.DEBUG) console.log(`Lade Mitarbeiterdaten für ID ${id}...`);
            
            try {
                const response = await fetch(`${this.API_BASE_URL}/employees/${id}`);
                if (!response.ok) {
                    console.warn(`Fehler beim Laden der Mitarbeiterdaten für ID ${id}, verwende Mock-Daten`);
                    return this.getMockEmployees('', {}). employees.find(e => e.id === id) || null;
                }
                const data = await response.json();
                if (this.DEBUG) console.log('Geladene Mitarbeiterdaten:', data);
                return data;
            } catch (error) {
                console.warn('API nicht erreichbar, verwende Mock-Mitarbeiterdaten:', error);
                return this.getMockEmployees('', {}).employees.find(e => e.id === id) || null;
            }
        } catch (error) {
            console.error('Fehler beim Laden der Mitarbeiterdaten:', error);
            return null;
        }
    }

    static async getEmployeeSkills(employeeId: number): Promise<string[]> {
        try {
            if (this.DEBUG) console.log(`Lade Skills für Mitarbeiter ID ${employeeId}...`);
            
            try {
                const response = await fetch(`${this.API_BASE_URL}/employees/${employeeId}/skills`);
                if (!response.ok) {
                    console.warn(`Fehler beim Laden der Skills für Mitarbeiter ID ${employeeId}, verwende Mock-Daten`);
                    return this.getMockEmployees('', {}).employees.find(e => e.id === employeeId)?.skills || [];
                }
                const data = await response.json();
                if (this.DEBUG) console.log('Geladene Mitarbeiter-Skills:', data);
                return data;
            } catch (error) {
                console.warn('API nicht erreichbar, verwende Mock-Mitarbeiter-Skills:', error);
                return this.getMockEmployees('', {}).employees.find(e => e.id === employeeId)?.skills || [];
            }
        } catch (error) {
            console.error('Fehler beim Laden der Mitarbeiter-Skills:', error);
            return [];
        }
    }
} 