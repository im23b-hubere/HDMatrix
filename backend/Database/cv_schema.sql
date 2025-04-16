-- CV-Management Schema

-- Benutzer-Tabelle (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mitarbeiter-Tabelle (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS mitarbeiter (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    position VARCHAR(100),
    department VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CV-Haupttabelle
CREATE TABLE IF NOT EXISTS cvs (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES users(id),
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    extracted_text TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by INTEGER REFERENCES users(id)
);

-- Personliche Informationen
CREATE TABLE IF NOT EXISTS cv_personal_info (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    birth_date DATE,
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bildungsweg
CREATE TABLE IF NOT EXISTS cv_education (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
    institution VARCHAR(255),
    degree VARCHAR(255),
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    grade DECIMAL(4,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Berufserfahrung
CREATE TABLE IF NOT EXISTS cv_experience (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
    company VARCHAR(255),
    position VARCHAR(255),
    start_date DATE,
    end_date DATE,
    description TEXT,
    responsibilities TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faehigkeiten
CREATE TABLE IF NOT EXISTS cv_skills (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
    name VARCHAR(100),
    category VARCHAR(100),
    level VARCHAR(50),
    years_of_experience INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sprachen
CREATE TABLE IF NOT EXISTS cv_languages (
    id SERIAL PRIMARY KEY,
    cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
    language VARCHAR(100),
    proficiency_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger fuer automatische Aktualisierung des updated_at Timestamps
CREATE OR REPLACE FUNCTION update_cv_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Erstelle Trigger fuer relevante Tabellen
CREATE TRIGGER update_cvs_updated_at
    BEFORE UPDATE ON cvs
    FOR EACH ROW
    EXECUTE FUNCTION update_cv_updated_at_column();

CREATE TRIGGER update_cv_personal_info_updated_at
    BEFORE UPDATE ON cv_personal_info
    FOR EACH ROW
    EXECUTE FUNCTION update_cv_updated_at_column(); 