-- Authentifizierungstabellen für HRMatrix
-- Diese Tabellen erweitern die bestehende Datenbank um Authentifizierungs- und Berechtigungsfunktionen

-- Tabelle für Mandanten (Tenants)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_users INTEGER DEFAULT 0,
    logo_url TEXT,
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_expires TIMESTAMP,
    custom_domain VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50)
);

-- Tabelle für Benutzerrollen
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE
);

-- Tabelle für Berechtigungen
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL
);

-- Verknüpfungstabelle für Rollen und Berechtigungen
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    UNIQUE (role_id, permission_id)
);

-- Tabelle für Benutzer
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employee_id INTEGER, -- Verknüpfung mit mitarbeiter-Tabelle
    profile_image TEXT,
    phone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'de',
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id),
    FOREIGN KEY (employee_id) REFERENCES mitarbeiter (id) ON DELETE SET NULL
);

-- Tabelle für Anmeldeversuche
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Tabelle für Token-Blacklist
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_by_user_id INTEGER,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(50) DEFAULT 'logout',
    FOREIGN KEY (revoked_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Tabelle für Audit-Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    tenant_id INTEGER,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    changes JSONB,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE SET NULL
);

-- Tabelle für Benutzereinstellungen
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'de',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabelle für Sitzungen
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Trigger für automatische Aktualisierung von updated_at
CREATE OR REPLACE FUNCTION update_auth_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Erstelle Trigger für alle Authentifizierungstabellen
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_auth_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_auth_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_auth_updated_at_column();

-- Erstelle Indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts (ip_address);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist (token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants (subdomain);

-- Standard-Rollen erstellen
INSERT INTO roles (name, description, is_system_role) VALUES
('Admin', 'Systemadministrator mit vollen Rechten', TRUE),
('Manager', 'Projektmanager mit erweiterten Rechten', TRUE),
('HR', 'HR-Mitarbeiter mit Zugriff auf Personalverwaltung', TRUE),
('Employee', 'Normaler Mitarbeiter', TRUE),
('Guest', 'Gast mit eingeschränkten Rechten', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Standard-Berechtigungen erstellen
INSERT INTO permissions (name, description, module) VALUES
('user_read', 'Benutzer anzeigen', 'auth'),
('user_create', 'Benutzer erstellen', 'auth'),
('user_update', 'Benutzer bearbeiten', 'auth'),
('user_delete', 'Benutzer löschen', 'auth'),
('tenant_manage', 'Mandanten verwalten', 'auth'),
('cv_read', 'Lebensläufe anzeigen', 'cv'),
('cv_create', 'Lebensläufe erstellen', 'cv'),
('cv_update', 'Lebensläufe bearbeiten', 'cv'),
('cv_delete', 'Lebensläufe löschen', 'cv'),
('workflow_manage', 'Workflows verwalten', 'workflow'),
('employee_read', 'Mitarbeiter anzeigen', 'employee'),
('employee_create', 'Mitarbeiter erstellen', 'employee'),
('employee_update', 'Mitarbeiter bearbeiten', 'employee'),
('employee_delete', 'Mitarbeiter löschen', 'employee'),
('project_manage', 'Projekte verwalten', 'project'),
('report_access', 'Auf Berichte zugreifen', 'report')
ON CONFLICT (name) DO NOTHING;

-- Standard-Mandant erstellen
INSERT INTO tenants (name, subdomain, max_users, subscription_plan, primary_color)
VALUES ('HRMatrix', 'default', 100, 'enterprise', '#3f51b5')
ON CONFLICT (subdomain) DO NOTHING;

-- Standard Admin-Benutzer erstellen (Passwort: admin123)
DO $$
DECLARE
    admin_role_id INTEGER;
    default_tenant_id INTEGER;
BEGIN
    -- Hole Role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
    
    -- Hole Tenant ID
    SELECT id INTO default_tenant_id FROM tenants WHERE subdomain = 'default' LIMIT 1;
    
    -- Erstelle Admin-Benutzer wenn noch keiner existiert
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
        INSERT INTO users (
            tenant_id,
            email,
            password_hash,
            first_name,
            last_name,
            role_id,
            is_active,
            is_email_verified,
            created_at
        )
        VALUES (
            default_tenant_id,
            'admin@example.com',
            '$2b$12$K3JNi95.z8K0LhGIq48reu9kbVXGj2CNmB5xO1gR4OYIqzP2S48fK', -- bcrypt hash für 'admin123'
            'Admin',
            'User',
            admin_role_id,
            TRUE,
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Verknüpfe bestehende Mitarbeiter mit Benutzerkonten
DO $$
DECLARE
    default_tenant_id INTEGER;
    employee_role_id INTEGER;
    mitarbeiter_record RECORD;
BEGIN
    -- Hole Role ID und Tenant ID
    SELECT id INTO employee_role_id FROM roles WHERE name = 'Employee' LIMIT 1;
    SELECT id INTO default_tenant_id FROM tenants WHERE subdomain = 'default' LIMIT 1;
    
    -- Für jeden Mitarbeiter ohne Benutzerkonto
    FOR mitarbeiter_record IN 
        SELECT m.id, m.vorname, m.nachname, m.email 
        FROM mitarbeiter m
        LEFT JOIN users u ON u.employee_id = m.id
        WHERE u.id IS NULL AND m.email IS NOT NULL
    LOOP
        -- Erstelle Benutzerkonto
        INSERT INTO users (
            tenant_id,
            email,
            password_hash,
            first_name,
            last_name,
            role_id,
            is_active,
            is_email_verified,
            employee_id,
            created_at
        )
        VALUES (
            default_tenant_id,
            mitarbeiter_record.email,
            '$2b$12$K3JNi95.z8K0LhGIq48reu9kbVXGj2CNmB5xO1gR4OYIqzP2S48fK', -- bcrypt hash für 'admin123'
            mitarbeiter_record.vorname,
            mitarbeiter_record.nachname,
            employee_role_id,
            TRUE,
            TRUE,
            mitarbeiter_record.id,
            CURRENT_TIMESTAMP
        );
    END LOOP;
END $$;

-- Berechtigungen für Rollen zuweisen
DO $$
DECLARE
    admin_role_id INTEGER;
    manager_role_id INTEGER;
    hr_role_id INTEGER;
    employee_role_id INTEGER;
    perm_record RECORD;
BEGIN
    -- Hole Role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
    SELECT id INTO manager_role_id FROM roles WHERE name = 'Manager' LIMIT 1;
    SELECT id INTO hr_role_id FROM roles WHERE name = 'HR' LIMIT 1;
    SELECT id INTO employee_role_id FROM roles WHERE name = 'Employee' LIMIT 1;
    
    -- Admin bekommt alle Berechtigungen
    FOR perm_record IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm_record.id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    -- Manager Berechtigungen
    FOR perm_record IN 
        SELECT id FROM permissions 
        WHERE name IN ('cv_read', 'cv_create', 'cv_update', 'employee_read', 
                        'project_manage', 'report_access', 'workflow_manage')
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (manager_role_id, perm_record.id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    -- HR Berechtigungen
    FOR perm_record IN 
        SELECT id FROM permissions 
        WHERE name IN ('cv_read', 'cv_create', 'cv_update', 'cv_delete',
                      'employee_read', 'employee_create', 'employee_update', 'employee_delete',
                      'report_access')
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (hr_role_id, perm_record.id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    -- Employee Berechtigungen
    FOR perm_record IN 
        SELECT id FROM permissions 
        WHERE name IN ('cv_read', 'employee_read')
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (employee_role_id, perm_record.id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
END $$; 