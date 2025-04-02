export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  title: string;
  summary: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  achievements?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  description?: string;
}

export interface Skill {
  name: string;
  level?: string;
  category?: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Project {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
  role?: string;
  achievements?: string[];
}

export interface CV {
  id: string;
  userId: string;
  title: string;
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  skills: Skill[];
  languages: Language[];
  projects: Project[];
  createdAt: string;
  updatedAt: string;
} 