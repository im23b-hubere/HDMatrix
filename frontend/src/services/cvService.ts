import axios from 'axios';
import { CV, Skill, Employee } from '../types/cv';

const API_URL = 'http://localhost:5000/api/cv';

// CV Services
export const getAllCVs = async (): Promise<CV[]> => {
  try {
    const response = await axios.get(`${API_URL}/cvs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching CVs:', error);
    throw error;
  }
};

export const getCVById = async (cvId: number): Promise<CV> => {
  const response = await axios.get(`${API_URL}/cvs/${cvId}`);
  return response.data;
};

export const createCV = async (cvData: Partial<CV>): Promise<CV> => {
  const response = await axios.post(`${API_URL}/cvs`, cvData);
  return response.data;
};

export const updateCV = async (cvId: number, cvData: Partial<CV>): Promise<{ message: string }> => {
  const response = await axios.put(`${API_URL}/cvs/${cvId}`, cvData);
  return response.data;
};

export const deleteCV = async (cvId: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_URL}/cvs/${cvId}`);
  return response.data;
};

// Employee Services
export const getAllEmployees = async (): Promise<Employee[]> => {
  const response = await axios.get(`${API_URL}/employees`);
  return response.data;
};

export const getEmployeeById = async (employeeId: number): Promise<Employee> => {
  const response = await axios.get(`${API_URL}/employees/${employeeId}`);
  return response.data;
};

export const createEmployee = async (employeeData: Partial<Employee>): Promise<Employee> => {
  const response = await axios.post(`${API_URL}/employees`, employeeData);
  return response.data;
};

export const updateEmployee = async (employeeId: number, employeeData: Partial<Employee>): Promise<{ message: string }> => {
  const response = await axios.put(`${API_URL}/employees/${employeeId}`, employeeData);
  return response.data;
};

// Skill Categories
export const getSkillCategories = async (): Promise<{id: string, name: string, skills: Array<{id: string, name: string}>}[]> => {
  // In einer echten Anwendung würden wir hier einen API-Aufruf machen
  // Für jetzt geben wir Mock-Daten zurück
  return [
    {
      id: "1",
      name: "Programmiersprachen",
      skills: [
        { id: "101", name: "JavaScript" },
        { id: "102", name: "TypeScript" },
        { id: "103", name: "Python" },
        { id: "104", name: "Java" },
        { id: "105", name: "C#" }
      ]
    },
    {
      id: "2",
      name: "Frontend",
      skills: [
        { id: "201", name: "React" },
        { id: "202", name: "Angular" },
        { id: "203", name: "Vue.js" },
        { id: "204", name: "HTML/CSS" },
        { id: "205", name: "SCSS/SASS" }
      ]
    },
    {
      id: "3",
      name: "Backend",
      skills: [
        { id: "301", name: "Node.js" },
        { id: "302", name: "Express" },
        { id: "303", name: "NestJS" },
        { id: "304", name: "Django" },
        { id: "305", name: "Spring Boot" }
      ]
    },
    {
      id: "4",
      name: "Datenbanken",
      skills: [
        { id: "401", name: "SQL" },
        { id: "402", name: "PostgreSQL" },
        { id: "403", name: "MongoDB" },
        { id: "404", name: "MySQL" },
        { id: "405", name: "Redis" }
      ]
    },
    {
      id: "5",
      name: "DevOps",
      skills: [
        { id: "501", name: "Docker" },
        { id: "502", name: "Kubernetes" },
        { id: "503", name: "AWS" },
        { id: "504", name: "CI/CD" },
        { id: "505", name: "Jenkins" }
      ]
    },
    {
      id: "6",
      name: "Sprachen",
      skills: [
        { id: "601", name: "Deutsch" },
        { id: "602", name: "Englisch" },
        { id: "603", name: "Französisch" },
        { id: "604", name: "Spanisch" },
        { id: "605", name: "Italienisch" }
      ]
    }
  ];
};

export const createSkillCategory = async (name: string): Promise<{ id: number; name: string }> => {
  const response = await axios.post(`${API_URL}/skill-categories`, { name });
  return response.data;
};

// File Upload
export const uploadPhoto = async (employeeId: number, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('photo', file);
  
  const response = await axios.post(`${API_URL}/employees/${employeeId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data.photoUrl;
};

// Template-based Export
export const exportCVWithTemplate = async (cvId: number, templateId: number): Promise<Blob> => {
  const response = await axios.get(`${API_URL}/cvs/${cvId}/export/${templateId}`, { 
    responseType: 'blob' 
  });
  
  return response.data;
};

// Generate CV from data
export const generateCVFromData = async (data: any): Promise<CV> => {
  const response = await axios.post(`${API_URL}/generate-cv`, data);
  return response.data;
};

// Mock data for development
export const getMockCVs = (): CV[] => {
  return [
    {
      id: 1,
      employeeId: 1,
      fullName: 'Max Mustermann',
      position: 'Senior Software Engineer',
      email: 'max.mustermann@example.com',
      phone: '+49 123 456789',
      location: 'Berlin, Deutschland',
      photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      summary: 'Erfahrener Softwareentwickler mit über 8 Jahren Erfahrung in der Entwicklung von Webanwendungen. Spezialisiert auf React, TypeScript und Node.js.',
      skills: [
        { id: '101', name: 'JavaScript', category: 'Programmiersprachen', level: 5 },
        { id: '102', name: 'TypeScript', category: 'Programmiersprachen', level: 4 },
        { id: '201', name: 'React', category: 'Frontend', level: 5 },
        { id: '301', name: 'Node.js', category: 'Backend', level: 4 },
        { id: '401', name: 'SQL', category: 'Datenbanken', level: 3 },
        { id: '602', name: 'Englisch', category: 'Sprachen', level: 4 },
      ],
      experience: [
        {
          id: '1',
          position: 'Senior Software Engineer',
          company: 'Tech GmbH',
          location: 'Berlin',
          startDate: '2020-01-01',
          description: 'Leitung der Frontend-Entwicklung für verschiedene Kundenprojekte.',
          current: true,
          achievements: [
            'Einführung von TypeScript und React Testing Library',
            'Reduzierung der Build-Zeit um 40%',
            'Mentoring von Junior-Entwicklern'
          ]
        },
        {
          id: '2',
          position: 'Software Developer',
          company: 'Web Solutions AG',
          location: 'München',
          startDate: '2015-03-01',
          endDate: '2019-12-31',
          description: 'Entwicklung von Webapplikationen mit React und Node.js.',
          current: false,
          achievements: [
            'Implementierung einer Microservice-Architektur',
            'Integration von Payment-Lösungen'
          ]
        }
      ],
      education: [
        {
          start_year: '2013',
          end_year: '2015',
          degree: 'Master of Science',
          institution: 'Technische Universität Berlin',
          location: 'Berlin',
          details: 'Fokus auf Softwareentwicklung und Datenbanksysteme'
        },
        {
          start_year: '2010',
          end_year: '2013',
          degree: 'Bachelor of Science',
          institution: 'Universität Hamburg',
          location: 'Hamburg'
        }
      ],
      certifications: [
        {
          id: '1',
          name: 'AWS Certified Developer',
          issuer: 'Amazon Web Services',
          issueDate: '2021-05-15',
          current: true
        },
        {
          id: '2',
          name: 'Professional Scrum Master I',
          issuer: 'Scrum.org',
          issueDate: '2019-11-10',
          current: true
        }
      ],
      projects: [
        {
          id: '1',
          name: 'E-Commerce Platform',
          description: 'Entwicklung einer skalierbaren E-Commerce-Plattform mit React, Node.js und MongoDB.',
          startDate: '2021-01-01',
          endDate: '2021-12-31',
          current: false,
          technologies: ['React', 'Redux', 'Node.js', 'Express', 'MongoDB'],
          achievements: ['Steigerung der Konversionsrate um 25%']
        },
        {
          id: '2',
          name: 'Banking App',
          description: 'Implementierung einer sicheren Banking-App für mobile und Desktop-Geräte.',
          startDate: '2020-03-01',
          endDate: '2020-12-31',
          current: false,
          technologies: ['React Native', 'TypeScript', 'GraphQL'],
          achievements: ['Erhöhung der App-Bewertung von 3,2 auf 4,7 Sterne']
        }
      ],
      lastUpdated: '2023-05-15T10:30:00Z'
    },
    {
      id: 2,
      employeeId: 2,
      fullName: 'Anna Schmidt',
      position: 'UX/UI Designer',
      email: 'anna.schmidt@example.com',
      phone: '+49 234 567890',
      location: 'Hamburg, Deutschland',
      photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
      summary: 'Kreative UX/UI Designerin mit einem Auge für Details und 5 Jahren Erfahrung in der Gestaltung benutzerfreundlicher Interfaces.',
      skills: [
        { id: '204', name: 'HTML/CSS', category: 'Frontend', level: 5 },
        { id: '205', name: 'SCSS/SASS', category: 'Frontend', level: 5 },
        { id: '206', name: 'Figma', category: 'Design', level: 5 },
        { id: '207', name: 'Adobe XD', category: 'Design', level: 4 },
        { id: '208', name: 'Sketch', category: 'Design', level: 4 },
        { id: '101', name: 'JavaScript', category: 'Programmiersprachen', level: 3 },
        { id: '602', name: 'Englisch', category: 'Sprachen', level: 4 },
      ],
      experience: [
        {
          id: '3',
          position: 'Senior UX/UI Designer',
          company: 'Creative Solutions GmbH',
          location: 'Hamburg',
          startDate: '2021-02-01',
          current: true,
          description: 'Leitung des Design-Teams und Entwicklung konsistenter Design-Systeme für Enterprise-Produkte.',
          achievements: [
            'Neugestaltung der Hauptproduktplattform mit 30% höherer Konversionsrate',
            'Einführung eines Design Systems zur Verbesserung der Teameffizienz',
            'Optimierung des Design-Prozesses durch Automatisierung und Standardisierung'
          ]
        },
        {
          id: '4',
          position: 'UI Designer',
          company: 'Digital Agency',
          location: 'Berlin',
          startDate: '2018-05-01',
          endDate: '2021-01-31',
          current: false,
          description: 'Gestaltung von Benutzeroberflächen für mobile und Web-Anwendungen verschiedener Kunden.',
          achievements: [
            'Erstellung von über 30 Markenidentitäten',
            'Leitung von UX-Workshops für Kunden'
          ]
        }
      ],
      education: [
        {
          start_year: '2014',
          end_year: '2018',
          degree: 'Bachelor of Arts',
          institution: 'Hochschule für angewandte Wissenschaften Hamburg',
          location: 'Hamburg',
          details: 'Kommunikationsdesign mit Schwerpunkt auf digitale Medien'
        }
      ],
      certifications: [
        {
          id: '3',
          name: 'Certified UX Designer',
          issuer: 'Nielsen Norman Group',
          issueDate: '2020-03-15',
          current: true
        }
      ],
      projects: [
        {
          id: '3',
          name: 'Fintech App Redesign',
          description: 'Komplettes Redesign der Benutzeroberfläche einer Fintech-App mit Fokus auf Benutzerfreundlichkeit und Barrierefreiheit.',
          startDate: '2022-01-01',
          endDate: '2022-06-30',
          current: false,
          technologies: ['Figma', 'Adobe XD', 'Sketch', 'Principle'],
          achievements: ['Steigerung der Nutzerzufriedenheit um 40%']
        }
      ],
      lastUpdated: '2023-06-10T14:45:00Z'
    },
    {
      id: 3,
      employeeId: 3,
      fullName: 'Thomas Meyer',
      position: 'DevOps Engineer',
      email: 'thomas.meyer@example.com',
      phone: '+49 345 678901',
      location: 'München, Deutschland',
      photoUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
      summary: 'DevOps-Spezialist mit Fokus auf Cloud-Infrastruktur und Automatisierung. Erfahrung mit AWS, Docker und Kubernetes.',
      skills: [
        { id: '501', name: 'Docker', category: 'DevOps', level: 5 },
        { id: '502', name: 'Kubernetes', category: 'DevOps', level: 4 },
        { id: '503', name: 'AWS', category: 'DevOps', level: 5 },
        { id: '504', name: 'CI/CD', category: 'DevOps', level: 5 },
        { id: '103', name: 'Python', category: 'Programmiersprachen', level: 4 },
        { id: '301', name: 'Node.js', category: 'Backend', level: 3 },
        { id: '602', name: 'Englisch', category: 'Sprachen', level: 5 },
      ],
      experience: [
        {
          id: '5',
          position: 'Lead DevOps Engineer',
          company: 'Cloud Solutions AG',
          location: 'München',
          startDate: '2019-08-01',
          current: true,
          description: 'Verantwortlich für die Cloud-Infrastruktur und Implementierung von CI/CD-Pipelines.',
          achievements: [
            'Migration von On-Premise zu AWS mit 50% Kosteneinsparung',
            'Implementierung einer vollautomatisierten Deployment-Pipeline',
            'Verkürzung der Release-Zyklen von monatlich auf täglich'
          ]
        },
        {
          id: '6',
          position: 'System Administrator',
          company: 'IT Services GmbH',
          location: 'Frankfurt',
          startDate: '2017-03-01',
          endDate: '2019-07-31',
          current: false,
          description: 'Betreuung und Weiterentwicklung der Server-Infrastruktur.',
          achievements: [
            'Aufbau eines Monitoring-Systems',
            'Automatisierung von Backup-Prozessen'
          ]
        }
      ],
      education: [
        {
          start_year: '2013',
          end_year: '2017',
          degree: 'Bachelor of Science',
          institution: 'Technische Universität München',
          location: 'München',
          details: 'Informatik mit Schwerpunkt auf verteilte Systeme'
        }
      ],
      certifications: [
        {
          id: '4',
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          issueDate: '2020-07-20',
          current: true
        },
        {
          id: '5',
          name: 'Certified Kubernetes Administrator',
          issuer: 'Cloud Native Computing Foundation',
          issueDate: '2021-02-15',
          current: true
        }
      ],
      projects: [
        {
          id: '4',
          name: 'Microservices-Infrastruktur',
          description: 'Aufbau einer skalierbaren Kubernetes-Infrastruktur für Microservices.',
          startDate: '2020-01-01',
          endDate: '2020-09-30',
          current: false,
          technologies: ['Kubernetes', 'Docker', 'Terraform', 'AWS'],
          achievements: ['Skalierbarkeit bei 300% höherer Last ohne Performance-Einbußen']
        }
      ],
      lastUpdated: '2023-04-22T09:15:00Z'
    }
  ];
};

const searchCVsBySkills = async (skillIds: string[], teamSize: number = 1, minExperience: number = 0): Promise<CV[]> => {
  try {
    // In einer echten Anwendung würden wir hier einen API-Aufruf machen
    // mit den skillIds als Parameter
    // Für jetzt filtern wir die Mock-CVs
    const cvs = getMockCVs();
    
    // Skill-Matching Score-Algorithmus
    const scoredCVs = cvs.map(cv => {
      // Basis-Score für jedes CV
      let score = 0;
      // Übereinstimmende Skills finden
      const matchingSkills = cv.skills.filter(skill => skillIds.includes(skill.id));
      
      // Score-Berechnung basierend auf:
      // 1. Anzahl der übereinstimmenden Skills
      score += matchingSkills.length * 10;
      
      // 2. Skill-Level der übereinstimmenden Skills
      const averageSkillLevel = matchingSkills.reduce((sum, skill) => sum + skill.level, 0) / 
        (matchingSkills.length || 1);
      score += averageSkillLevel * 5;
      
      // 3. Berufserfahrung in Jahren
      const totalExperience = cv.experience.reduce((total, exp) => {
        const startYear = new Date(exp.startDate).getFullYear();
        const endYear = exp.current 
          ? new Date().getFullYear() 
          : (exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear());
        return total + (endYear - startYear);
      }, 0);
      
      if (totalExperience >= minExperience) {
        score += Math.min(totalExperience, 10) * 2; // Max 20 Punkte für Erfahrung
      } else {
        // Wenn Minimalerfahrung nicht erreicht, deutliche Punktabzüge
        score -= 50;
      }
      
      // 4. Aktualität des CVs (neuere CVs bevorzugen)
      const lastUpdatedDate = new Date(cv.lastUpdated);
      const now = new Date();
      const monthsAgo = (now.getFullYear() - lastUpdatedDate.getFullYear()) * 12 + 
        now.getMonth() - lastUpdatedDate.getMonth();
      
      // Je neuer, desto besser (max 5 Punkte)
      score += Math.max(0, 5 - Math.min(monthsAgo, 5));
      
      // 5. Fertigkeitsabdeckung (Prozent der geforderten Skills, die abgedeckt sind)
      const coveragePercent = (matchingSkills.length / skillIds.length) * 100;
      score += Math.floor(coveragePercent / 10); // 0-10 Punkte basierend auf Abdeckung
      
      return { cv, score, matchingSkills };
    });
    
    // Filtern von CVs ohne passende Skills
    const relevantCVs = scoredCVs.filter(item => 
      // Entweder muss der Score positiv sein oder mindestens ein Skills übereinstimmen
      (item.score > 0 || item.matchingSkills.length > 0)
    );
    
    // Nach Score sortieren (absteigend)
    const sortedCVs = relevantCVs.sort((a, b) => b.score - a.score);
    
    // Die Anzahl besten Übereinstimmungen zurückgeben
    const topMatches = sortedCVs.slice(0, teamSize).map(item => item.cv);
    
    // Logging für Entwicklungs-/Testzwecke
    console.log('Skill-Matching Ergebnisse:', sortedCVs.map(item => ({ 
      name: item.cv.fullName, 
      score: item.score,
      matchingSkills: item.matchingSkills.map(s => s.name)
    })));
    
    return topMatches;
  } catch (error) {
    console.error('Fehler bei der Suche nach CVs:', error);
    throw error;
  }
};

const cvService = {
  getAllCVs,
  getCVById,
  createCV,
  updateCV,
  deleteCV,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getSkillCategories,
  createSkillCategory,
  uploadPhoto,
  exportCVWithTemplate,
  generateCVFromData,
  getMockCVs,
  searchCVsBySkills
};

export default cvService; 