-- Tabelle für Mitarbeiter (Employees)
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    location VARCHAR(255),
    photo_url TEXT,
    tenant_id INTEGER REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

-- Tabelle für Lebensläufe (CVs)
CREATE TABLE IF NOT EXISTS cvs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    summary TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

-- Tabelle für Skill-Kategorien
CREATE TABLE IF NOT EXISTS skill_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Skills
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES skill_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category_id)
);

-- Tabelle für CV-Skills-Zuordnung
CREATE TABLE IF NOT EXISTS cv_skills (
    cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id),
    level INTEGER DEFAULT 3, -- 1-5 Skala
    PRIMARY KEY (cv_id, skill_id)
);

-- Tabelle für Berufserfahrung
CREATE TABLE IF NOT EXISTS cv_experience (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    description TEXT,
    achievements JSONB
);

-- Tabelle für Ausbildung
CREATE TABLE IF NOT EXISTS cv_education (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field VARCHAR(255),
    start_year INTEGER,
    end_year INTEGER,
    details TEXT
);

-- Tabelle für Zertifizierungen
CREATE TABLE IF NOT EXISTS cv_certifications (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255)
);

-- Tabelle für Projekte
CREATE TABLE IF NOT EXISTS cv_projects (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    technologies JSONB,
    achievements JSONB
);

-- Tabelle für CV-Vorlagen
CREATE TABLE IF NOT EXISTS cv_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    html_template TEXT NOT NULL,
    css_template TEXT,
    tenant_id INTEGER REFERENCES tenants(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_cvs_employee_id ON cvs(employee_id);
CREATE INDEX IF NOT EXISTS idx_cv_skills_cv_id ON cv_skills(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_skills_skill_id ON cv_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_cv_experience_cv_id ON cv_experience(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_education_cv_id ON cv_education(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_certifications_cv_id ON cv_certifications(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_projects_cv_id ON cv_projects(cv_id);

-- Beispiel-Kategorien für Skills
INSERT INTO skill_categories (name) VALUES 
('Programmiersprachen'),
('Frameworks'),
('Datenbanken'),
('Tools & Software'),
('Methoden'),
('Sprachen'),
('Soft Skills')
ON CONFLICT (name) DO NOTHING;

-- Beispiel-Skills
INSERT INTO skills (name, category_id) VALUES 
('Python', (SELECT id FROM skill_categories WHERE name = 'Programmiersprachen')),
('JavaScript', (SELECT id FROM skill_categories WHERE name = 'Programmiersprachen')),
('TypeScript', (SELECT id FROM skill_categories WHERE name = 'Programmiersprachen')),
('Java', (SELECT id FROM skill_categories WHERE name = 'Programmiersprachen')),
('C#', (SELECT id FROM skill_categories WHERE name = 'Programmiersprachen')),
('SQL', (SELECT id FROM skill_categories WHERE name = 'Programmiersprachen')),
('React', (SELECT id FROM skill_categories WHERE name = 'Frameworks')),
('Angular', (SELECT id FROM skill_categories WHERE name = 'Frameworks')),
('Vue.js', (SELECT id FROM skill_categories WHERE name = 'Frameworks')),
('Django', (SELECT id FROM skill_categories WHERE name = 'Frameworks')),
('Flask', (SELECT id FROM skill_categories WHERE name = 'Frameworks')),
('Spring Boot', (SELECT id FROM skill_categories WHERE name = 'Frameworks')),
('PostgreSQL', (SELECT id FROM skill_categories WHERE name = 'Datenbanken')),
('MySQL', (SELECT id FROM skill_categories WHERE name = 'Datenbanken')),
('MongoDB', (SELECT id FROM skill_categories WHERE name = 'Datenbanken')),
('Docker', (SELECT id FROM skill_categories WHERE name = 'Tools & Software')),
('Kubernetes', (SELECT id FROM skill_categories WHERE name = 'Tools & Software')),
('Git', (SELECT id FROM skill_categories WHERE name = 'Tools & Software')),
('Jenkins', (SELECT id FROM skill_categories WHERE name = 'Tools & Software')),
('Scrum', (SELECT id FROM skill_categories WHERE name = 'Methoden')),
('Kanban', (SELECT id FROM skill_categories WHERE name = 'Methoden')),
('Agile', (SELECT id FROM skill_categories WHERE name = 'Methoden')),
('Deutsch', (SELECT id FROM skill_categories WHERE name = 'Sprachen')),
('Englisch', (SELECT id FROM skill_categories WHERE name = 'Sprachen')),
('Französisch', (SELECT id FROM skill_categories WHERE name = 'Sprachen')),
('Spanisch', (SELECT id FROM skill_categories WHERE name = 'Sprachen')),
('Kommunikation', (SELECT id FROM skill_categories WHERE name = 'Soft Skills')),
('Teamarbeit', (SELECT id FROM skill_categories WHERE name = 'Soft Skills')),
('Führung', (SELECT id FROM skill_categories WHERE name = 'Soft Skills')),
('Problemlösung', (SELECT id FROM skill_categories WHERE name = 'Soft Skills'))
ON CONFLICT (name, category_id) DO NOTHING; 