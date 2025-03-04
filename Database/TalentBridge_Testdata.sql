CREATE DATABASE IF NOT EXISTS TalentBridgeDB;
USE TalentBridgeDB;

-- Tabelle Abteilungen
CREATE TABLE abteilungen (
    abteilungs_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabelle Mitarbeiter
CREATE TABLE mitarbeiter (
    mitarbeiter_id INT AUTO_INCREMENT PRIMARY KEY,
    vorname VARCHAR(255) NOT NULL,
    nachname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    faehigkeiten TEXT,
    abteilungs_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (abteilungs_id) REFERENCES abteilungen(abteilungs_id) ON DELETE SET NULL
);

-- Tabelle Projekte
CREATE TABLE projekte (
    projekt_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabelle Aufgaben
CREATE TABLE aufgaben (
    aufgabe_id INT AUTO_INCREMENT PRIMARY KEY,
    beschreibung TEXT NOT NULL,
    projekt_id INT,
    mitarbeiter_id INT,
    status ENUM('offen', 'in Bearbeitung', 'abgeschlossen') NOT NULL DEFAULT 'offen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projekt_id) REFERENCES projekte(projekt_id) ON DELETE CASCADE,
    FOREIGN KEY (mitarbeiter_id) REFERENCES mitarbeiter(mitarbeiter_id) ON DELETE SET NULL
);

-- Tabelle Zertifikate
CREATE TABLE zertifikate (
    zertifikat_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    mitarbeiter_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mitarbeiter_id) REFERENCES mitarbeiter(mitarbeiter_id) ON DELETE CASCADE
);

-- Tabelle PDF_data
CREATE TABLE pdf_data (
    pdf_data_id INT AUTO_INCREMENT PRIMARY KEY,
    dateiname VARCHAR(255) NOT NULL,
    speicherort TEXT NOT NULL,
    mitarbeiter_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inhalt LONGBLOB,
    FOREIGN KEY (mitarbeiter_id) REFERENCES mitarbeiter(mitarbeiter_id) ON DELETE CASCADE
);


SELECT * FROM mitarbeiter;
