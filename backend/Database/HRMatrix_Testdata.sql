-- Erstelle die Tabellen
CREATE TABLE abteilungen (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    beschreibung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mitarbeiter (
    id SERIAL PRIMARY KEY,
    vorname VARCHAR(50) NOT NULL,
    nachname VARCHAR(50) NOT NULL,
    position VARCHAR(100),
    abteilung_id INTEGER REFERENCES abteilungen(id),
    email VARCHAR(100) UNIQUE,
    telefon VARCHAR(20),
    geburtsdatum DATE,
    eintrittsdatum DATE,
    ausbildungsgrad VARCHAR(50),
    sprachen TEXT[],
    zertifikate TEXT[],
    skills TEXT[],
    cv_path TEXT,
    profilbild_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projekterfahrungen (
    id SERIAL PRIMARY KEY,
    mitarbeiter_id INTEGER REFERENCES mitarbeiter(id),
    projektname VARCHAR(200) NOT NULL,
    rolle VARCHAR(100),
    start_datum DATE,
    end_datum DATE,
    beschreibung TEXT,
    verwendete_technologien TEXT[],
    kunde VARCHAR(200),
    projektvolumen DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weiterbildungen (
    id SERIAL PRIMARY KEY,
    mitarbeiter_id INTEGER REFERENCES mitarbeiter(id),
    thema VARCHAR(200) NOT NULL,
    anbieter VARCHAR(200),
    datum DATE,
    zertifikat VARCHAR(200),
    beschreibung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bewertungen (
    id SERIAL PRIMARY KEY,
    mitarbeiter_id INTEGER REFERENCES mitarbeiter(id),
    kategorie VARCHAR(100) NOT NULL,
    punkte INTEGER CHECK (punkte >= 0 AND punkte <= 5),
    kommentar TEXT,
    datum DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ausschreibungen (
    id SERIAL PRIMARY KEY,
    titel VARCHAR(200) NOT NULL,
    beschreibung TEXT,
    kunde VARCHAR(200),
    deadline DATE,
    status VARCHAR(50) DEFAULT 'offen',
    anforderungen TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE angepasste_cvs (
    id SERIAL PRIMARY KEY,
    mitarbeiter_id INTEGER REFERENCES mitarbeiter(id),
    ausschreibung_id INTEGER REFERENCES ausschreibungen(id),
    angepasste_skills TEXT[],
    angepasste_projekte TEXT[],
    cv_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projektteams (
    id SERIAL PRIMARY KEY,
    ausschreibung_id INTEGER REFERENCES ausschreibungen(id),
    team_name VARCHAR(200),
    beschreibung TEXT,
    status VARCHAR(50) DEFAULT 'aktiv',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_mitglieder (
    projektteam_id INTEGER REFERENCES projektteams(id),
    mitarbeiter_id INTEGER REFERENCES mitarbeiter(id),
    rolle VARCHAR(100),
    PRIMARY KEY (projektteam_id, mitarbeiter_id)
);

-- Trigger für automatische Aktualisierung des updated_at Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Erstelle Trigger für alle Tabellen
CREATE TRIGGER update_mitarbeiter_updated_at
    BEFORE UPDATE ON mitarbeiter
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projekterfahrungen_updated_at
    BEFORE UPDATE ON projekterfahrungen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weiterbildungen_updated_at
    BEFORE UPDATE ON weiterbildungen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bewertungen_updated_at
    BEFORE UPDATE ON bewertungen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ausschreibungen_updated_at
    BEFORE UPDATE ON ausschreibungen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_angepasste_cvs_updated_at
    BEFORE UPDATE ON angepasste_cvs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projektteams_updated_at
    BEFORE UPDATE ON projektteams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Beispieldaten für abteilungen
INSERT INTO abteilungen (name, beschreibung) VALUES
('IT & Entwicklung', 'Softwareentwicklung und IT-Infrastruktur'),
('Projektmanagement', 'Projektplanung und -steuerung'),
('HR & Personal', 'Personalwesen und Mitarbeiterentwicklung'),
('Marketing & Vertrieb', 'Marketing und Vertriebsaktivitäten');

-- Beispieldaten für mitarbeiter
INSERT INTO mitarbeiter (vorname, nachname, position, abteilung_id, email, skills, geburtsdatum, eintrittsdatum, ausbildungsgrad, sprachen, zertifikate) VALUES
('Giovanni', 'Pergande', 'Software Entwickler', 1, 'giovanni.pergande@pieper-kg.de', ARRAY['Python', 'Java', 'SQL', 'React'], '1990-01-01', '2020-01-01', 'Bachelor', ARRAY['Deutsch', 'Englisch'], ARRAY['AWS Certified Developer']),
('Philip', 'Stadelmann', 'Senior Entwickler', 1, 'philip.stadelmann@krein-gmbh.de', ARRAY['Python', 'Docker', 'Kubernetes', 'AWS'], '1985-05-15', '2019-06-01', 'Master', ARRAY['Deutsch', 'Englisch'], ARRAY['AWS Solutions Architect']);

-- Beispieldaten für projekterfahrungen
INSERT INTO projekterfahrungen (mitarbeiter_id, projektname, rolle, start_datum, end_datum, beschreibung, verwendete_technologien, kunde, projektvolumen) VALUES
(1, 'E-Commerce Plattform', 'Backend Entwickler', '2020-03-01', '2021-02-28', 'Entwicklung einer E-Commerce Plattform mit Python und Django', ARRAY['Python', 'Django', 'PostgreSQL', 'Docker'], 'Online Shop GmbH', 150000.00),
(2, 'Cloud Migration', 'Lead Developer', '2021-01-01', '2021-12-31', 'Migration einer Legacy-Anwendung in die AWS Cloud', ARRAY['AWS', 'Docker', 'Kubernetes', 'Python'], 'Enterprise Solutions AG', 250000.00);

-- Beispieldaten für weiterbildungen
INSERT INTO weiterbildungen (mitarbeiter_id, thema, anbieter, datum, zertifikat, beschreibung) VALUES
(1, 'AWS Cloud Practitioner', 'Amazon Web Services', '2020-06-15', 'AWS Certified Cloud Practitioner', 'Grundlagen der AWS Cloud Services'),
(2, 'Kubernetes Administration', 'Cloud Native Computing Foundation', '2021-03-20', 'CKA', 'Certified Kubernetes Administrator');

-- Beispieldaten für bewertungen
INSERT INTO bewertungen (mitarbeiter_id, kategorie, punkte, kommentar) VALUES
(1, 'Technische Kompetenz', 4, 'Sehr gute Python-Kenntnisse'),
(1, 'Teamarbeit', 5, 'Ausgezeichnete Zusammenarbeit'),
(2, 'Technische Kompetenz', 5, 'Experte für Cloud-Technologien'),
(2, 'Führung', 4, 'Gute Teamführung');

-- Beispieldaten für ausschreibungen
INSERT INTO ausschreibungen (titel, beschreibung, kunde, deadline, anforderungen) VALUES
('E-Commerce Plattform Modernisierung', 'Modernisierung einer bestehenden E-Commerce Plattform mit Cloud-Technologien', 'Retail Solutions GmbH', '2024-12-31', ARRAY['Python', 'AWS', 'Docker', 'Kubernetes']),
('Microservices Architektur', 'Entwicklung einer Microservices-basierten Anwendung', 'Tech Innovations AG', '2024-10-15', ARRAY['Python', 'Docker', 'Kubernetes', 'React']);

-- Beispieldaten für angepasste_cvs
INSERT INTO angepasste_cvs (mitarbeiter_id, ausschreibung_id, angepasste_skills, angepasste_projekte) VALUES
(1, 1, ARRAY['Python', 'AWS', 'Docker', 'Kubernetes'], ARRAY['E-Commerce Plattform']),
(2, 2, ARRAY['Python', 'Docker', 'Kubernetes', 'React'], ARRAY['Cloud Migration']);

-- Beispieldaten für projektteams
INSERT INTO projektteams (ausschreibung_id, team_name, beschreibung) VALUES
(1, 'E-Commerce Team', 'Team für die Modernisierung der E-Commerce Plattform'),
(2, 'Microservices Team', 'Team für die Entwicklung der Microservices-Anwendung');

-- Beispieldaten für team_mitglieder
INSERT INTO team_mitglieder (projektteam_id, mitarbeiter_id, rolle) VALUES
(1, 1, 'Backend Entwickler'),
(1, 2, 'Lead Developer'),
(2, 2, 'Architekt'),
(2, 1, 'Senior Entwickler');