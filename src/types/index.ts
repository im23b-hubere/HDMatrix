export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  skills: string[];
  position?: string;
  phone?: string;
  location?: string;
  experience?: number;
  avatar?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
