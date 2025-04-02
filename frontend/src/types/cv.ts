export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  title?: string;
  summary?: string;
  location?: string;
  birthYear?: string;
  nationality?: string;
  languages?: Array<{
    language: string;
    level: string;
  }>;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  description?: string;
  skills?: string[];
  achievements?: string[];
  technologies?: string[];
}

export interface Education {
  start_year: string;
  end_year: string;
  degree: string;
  institution?: string;
  location?: string;
  grade?: string;
  details?: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  name: string;
  category: string;
  level?: number;
  yearsOfExperience?: number;
}

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native';

export interface Language {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  current: boolean;
  credentialId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  technologies?: string[];
  achievements?: string[];
}

export interface Experience {
  start_year: string;
  end_year: string;
  description: string;
  company?: string;
  position?: string;
  location?: string;
  achievements?: string[];
  technologies?: string[];
}

export interface Publication {
  title: string;
  publisher: string;
  date: string;
  url?: string;
  description?: string;
}

export interface CV {
  id?: string;
  personalInfo?: PersonalInfo;
  summary?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  certifications?: Certification[];
  publications?: Publication[];
  lastUpdated?: Date;
  languages?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    role?: string;
    url?: string;
  }>;
}

export interface CVResponse {
  text: string;
  cv: CV;
}

// Beispiel-CV
export const EXAMPLE_CV: CV = {
  id: 'cv-1',
  userId: 'user-1',
  title: 'Softwareentwickler CV',
  personalInfo: {
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max.mustermann@example.com',
    phone: '+49 123 456789',
    location: 'Berlin, Deutschland',
    title: 'Senior Softwareentwickler',
    summary: 'Erfahrener Softwareentwickler mit Fokus auf Webtechnologien',
    desiredPosition: 'Senior Frontend Developer',
    desiredLocation: 'Berlin oder Remote',
    availability: 'Ab sofort',
  },
  workExperience: [
    {
      id: 'exp-1',
      company: 'Tech GmbH',
      position: 'Senior Frontend Developer',
      location: 'Berlin',
      startDate: '2020-01',
      current: true,
      description: 'Entwicklung moderner Webanwendungen mit React und TypeScript',
      achievements: [
        'Implementierung einer Micro-Frontend-Architektur',
        'Einführung von TypeScript im gesamten Frontend',
      ],
      skills: ['React', 'TypeScript', 'Next.js'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Technische Universität Berlin',
      degree: 'Bachelor of Science',
      field: 'Informatik',
      location: 'Berlin',
      startDate: '2015-10',
      endDate: '2019-09',
      current: false,
      description: 'Schwerpunkt auf Softwareentwicklung und Webtechnologien',
      start_year: '2015',
      end_year: '2019',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      name: 'React',
      category: 'Frontend',
      level: 'expert',
      yearsOfExperience: 5,
    },
    {
      id: 'skill-2',
      name: 'TypeScript',
      category: 'Frontend',
      level: 'advanced',
      yearsOfExperience: 3,
    },
  ],
  languages: [
    {
      id: 'lang-1',
      name: 'Deutsch',
      level: 'native',
    },
    {
      id: 'lang-2',
      name: 'Englisch',
      level: 'C1',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Developer',
      issuer: 'Amazon Web Services',
      date: '2022-01',
      credentialId: 'AWS-123456',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'E-Commerce Platform',
      description: 'Entwicklung einer modernen E-Commerce-Plattform',
      startDate: '2021-01',
      endDate: '2021-12',
      current: false,
      technologies: ['React', 'Node.js', 'MongoDB'],
      achievements: [
        'Steigerung der Konversionsrate um 25%',
        'Reduzierung der Ladezeit um 40%',
      ],
    },
  ],
  experience: [
    {
      start_year: '2020',
      end_year: '2022',
      description: 'Entwicklung moderner Webanwendungen mit React und TypeScript',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: {
    id: string;
    type: 'personal' | 'education' | 'experience' | 'skills' | 'languages' | 'certifications' | 'projects' | 'summary' | 'custom';
    title: string;
    order: number;
    required: boolean;
    fields: {
      id: string;
      type: 'text' | 'textarea' | 'date' | 'select' | 'multiselect' | 'number' | 'email' | 'phone' | 'url';
      label: string;
      required: boolean;
      options?: string[];
      placeholder?: string;
      validation?: {
        pattern?: string;
        min?: number;
        max?: number;
      };
    }[];
  }[];
  styling: {
    theme: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    font: {
      family: string;
      size: string;
    };
  };
} 