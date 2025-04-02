export const FIELD_TYPES = [
  'text',
  'textarea',
  'date',
  'select',
  'multiselect',
  'number',
  'email',
  'phone',
  'url',
] as const;

export type FieldType = typeof FIELD_TYPES[number];

export interface FieldValidation {
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: any) => boolean;
}

export interface TemplateField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: FieldValidation;
  defaultValue?: any;
  helpText?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  required: boolean;
  description?: string;
  fields: TemplateField[];
}

export interface TemplateStyling {
  theme: 'classic' | 'modern' | 'minimal' | 'professional';
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
  spacing: {
    section: string;
    field: string;
  };
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'creative' | 'academic' | 'technical';
  sections: TemplateSection[];
  styling: TemplateStyling;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

// Beispiel-Templates
export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'template-1',
    name: 'Klassisch',
    description: 'Ein klassisches, professionelles Design',
    category: 'standard',
    sections: [
      {
        id: 'personal',
        title: 'Persönliche Daten',
        order: 1,
        visible: true,
        required: true,
        description: 'Persönliche Informationen',
        fields: [],
      },
      {
        id: 'experience',
        title: 'Berufserfahrung',
        order: 2,
        visible: true,
        required: true,
        description: 'Berufliche Erfahrungen',
        fields: [],
      },
      {
        id: 'education',
        title: 'Ausbildung',
        order: 3,
        visible: true,
        required: true,
        description: 'Ausbildungsweg',
        fields: [],
      },
      {
        id: 'skills',
        title: 'Fähigkeiten',
        order: 4,
        visible: true,
        required: true,
        description: 'Fachliche und persönliche Kompetenzen',
        fields: [],
      },
      {
        id: 'languages',
        title: 'Sprachen',
        order: 5,
        visible: true,
        required: true,
        description: 'Sprachkenntnisse',
        fields: [],
      },
      {
        id: 'certifications',
        title: 'Zertifikate',
        order: 6,
        visible: true,
        required: false,
        description: 'Zusätzliche Qualifikationen',
        fields: [],
      },
      {
        id: 'projects',
        title: 'Projekte',
        order: 7,
        visible: true,
        required: false,
        description: 'Projektarbeit',
        fields: [],
      },
    ],
    styling: {
      theme: 'classic',
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        text: '#000000',
      },
      font: {
        family: 'Roboto',
        size: '14px',
      },
      spacing: {
        section: '24px',
        field: '16px',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'template-2',
    name: 'Modern',
    description: 'Ein modernes, minimalistisches Design',
    category: 'creative',
    sections: [
      {
        id: 'personal',
        title: 'Persönliche Daten',
        order: 1,
        visible: true,
        required: true,
        description: 'Persönliche Informationen',
        fields: [],
      },
      {
        id: 'experience',
        title: 'Berufserfahrung',
        order: 2,
        visible: true,
        required: true,
        description: 'Berufliche Erfahrungen',
        fields: [],
      },
      {
        id: 'education',
        title: 'Ausbildung',
        order: 3,
        visible: true,
        required: true,
        description: 'Ausbildungsweg',
        fields: [],
      },
      {
        id: 'skills',
        title: 'Fähigkeiten',
        order: 4,
        visible: true,
        required: true,
        description: 'Fachliche und persönliche Kompetenzen',
        fields: [],
      },
      {
        id: 'languages',
        title: 'Sprachen',
        order: 5,
        visible: true,
        required: true,
        description: 'Sprachkenntnisse',
        fields: [],
      },
      {
        id: 'certifications',
        title: 'Zertifikate',
        order: 6,
        visible: true,
        required: false,
        description: 'Zusätzliche Qualifikationen',
        fields: [],
      },
      {
        id: 'projects',
        title: 'Projekte',
        order: 7,
        visible: true,
        required: false,
        description: 'Projektarbeit',
        fields: [],
      },
    ],
    styling: {
      theme: 'modern',
      colors: {
        primary: '#2196f3',
        secondary: '#f50057',
        background: '#ffffff',
        text: '#333333',
      },
      font: {
        family: 'Open Sans',
        size: '14px',
      },
      spacing: {
        section: '32px',
        field: '20px',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
  },
]; 