import { CV } from '../types/cv';
import { v4 as uuidv4 } from 'uuid';

export const exampleCVs: CV[] = [
  {
    id: uuidv4(),
    userId: '1',
    title: 'Software Entwickler CV',
    personalInfo: {
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'max.mustermann@example.com',
      phone: '+49 123 456789',
      location: 'Berlin, Deutschland',
      summary: 'Erfahrener Fullstack-Entwickler mit Schwerpunkt auf React und Node.js. 5 Jahre Erfahrung in der Entwicklung skalierbarer Webanwendungen.',
      desiredPosition: 'Senior Software Engineer',
      availability: 'Ab sofort',
      desiredLocation: 'Berlin/Remote'
    },
    workExperience: [
      {
        id: uuidv4(),
        company: 'TechCorp GmbH',
        position: 'Senior Frontend Entwickler',
        startDate: '2020-01',
        endDate: 'heute',
        location: 'Berlin',
        description: 'Entwicklung und Wartung von Enterprise React-Anwendungen',
        achievements: [
          'Implementierung einer neuen Microservices-Architektur',
          'Reduzierung der Ladezeit um 40%',
          'Mentoring von Junior Entwicklern'
        ],
        skills: ['React', 'TypeScript', 'Node.js'],
        current: true
      }
    ],
    education: [
      {
        id: uuidv4(),
        institution: 'Technische Universität Berlin',
        degree: 'M.Sc. Informatik',
        field: 'Informatik',
        startDate: '2015-10',
        endDate: '2018-09',
        location: 'Berlin',
        description: 'Schwerpunkt: Softwaretechnik und Verteilte Systeme',
        current: false
      }
    ],
    skills: [
      {
        id: uuidv4(),
        name: 'React',
        level: 'expert',
        category: 'Frontend'
      },
      {
        id: uuidv4(),
        name: 'TypeScript',
        level: 'advanced',
        category: 'Programmiersprachen'
      },
      {
        id: uuidv4(),
        name: 'Node.js',
        level: 'advanced',
        category: 'Backend'
      }
    ],
    languages: [
      {
        id: uuidv4(),
        name: 'Deutsch',
        level: 'native'
      },
      {
        id: uuidv4(),
        name: 'Englisch',
        level: 'C1'
      }
    ],
    certifications: [
      {
        id: uuidv4(),
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        date: '2022-06'
      }
    ],
    projects: [
      {
        id: uuidv4(),
        name: 'E-Commerce Platform',
        description: 'Entwicklung einer skalierbaren E-Commerce-Plattform mit React und Node.js',
        startDate: '2021-03',
        endDate: '2022-02',
        technologies: ['React', 'Node.js', 'MongoDB']
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    userId: '2',
    title: 'UX Designer CV',
    personalInfo: {
      firstName: 'Anna',
      lastName: 'Schmidt',
      email: 'anna.schmidt@example.com',
      phone: '+49 987 654321',
      location: 'München, Deutschland',
      summary: 'Kreative UX Designerin mit 3 Jahren Erfahrung in der Gestaltung benutzerfreundlicher Interfaces.',
      desiredPosition: 'Senior UX Designer',
      availability: 'Ab Januar 2024',
      desiredLocation: 'München/Hybrid'
    },
    workExperience: [
      {
        id: uuidv4(),
        company: 'Design Studio XYZ',
        position: 'UX Designer',
        startDate: '2021-03',
        endDate: 'heute',
        location: 'München',
        description: 'Gestaltung von Benutzeroberflächen für Web- und Mobile-Anwendungen',
        achievements: [
          'Verbesserung der User Engagement Rate um 25%',
          'Einführung von Design Systems',
          'Leitung von User Research Projekten'
        ],
        skills: ['Figma', 'Adobe XD', 'Prototyping'],
        current: true
      }
    ],
    education: [
      {
        id: uuidv4(),
        institution: 'Hochschule München',
        degree: 'B.A. Kommunikationsdesign',
        field: 'Kommunikationsdesign',
        startDate: '2017-10',
        endDate: '2021-02',
        location: 'München',
        description: 'Fokus auf User Interface Design und User Experience',
        current: false
      }
    ],
    skills: [
      {
        id: uuidv4(),
        name: 'Figma',
        level: 'expert',
        category: 'Design Tools'
      },
      {
        id: uuidv4(),
        name: 'User Research',
        level: 'advanced',
        category: 'UX Methods'
      },
      {
        id: uuidv4(),
        name: 'HTML/CSS',
        level: 'advanced',
        category: 'Frontend'
      }
    ],
    languages: [
      {
        id: uuidv4(),
        name: 'Deutsch',
        level: 'native'
      },
      {
        id: uuidv4(),
        name: 'Englisch',
        level: 'B2'
      }
    ],
    certifications: [
      {
        id: uuidv4(),
        name: 'Google UX Design Certificate',
        issuer: 'Google',
        date: '2022-01'
      }
    ],
    projects: [
      {
        id: uuidv4(),
        name: 'Banking App Redesign',
        description: 'Komplettes Redesign einer Banking App mit Fokus auf Benutzerfreundlichkeit',
        startDate: '2022-06',
        endDate: '2022-12',
        technologies: ['Figma', 'Prototyping', 'User Testing']
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 