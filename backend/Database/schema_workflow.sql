-- Workflow-Management-System Schema

-- Workflow-Tabellen
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_id INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_stages (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    estimated_duration INTEGER, -- in hours
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES workflow_stages(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to INTEGER REFERENCES mitarbeiter(id),
    assigned_by INTEGER REFERENCES mitarbeiter(id),
    due_date TIMESTAMP,
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    estimated_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES mitarbeiter(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES mitarbeiter(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id)
);

CREATE TABLE workflows_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_template_stages (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES workflows_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    estimated_duration INTEGER, -- in hours
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_template_tasks (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES workflows_templates(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES workflow_template_stages(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    estimated_hours INTEGER,
    role_required VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES mitarbeiter(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- History/Audit logs
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES mitarbeiter(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status transition definitions
CREATE TABLE status_transitions (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    is_allowed BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    approval_role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example status values for tasks
-- Pending, In Progress, Blocked, Under Review, Completed, Cancelled

-- Trigger für automatische Aktualisierung des updated_at Timestamps
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    END IF;
END
$$;

-- Erstelle Trigger für alle relevanten Tabellen
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_templates_updated_at
    BEFORE UPDATE ON workflows_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Beispieldaten für Workflows und Phasen
INSERT INTO workflows (name, description, status, created_by) VALUES
('Client Onboarding', 'Standard process for onboarding new clients', 'active', 1),
('Software Release', 'Release process for software updates', 'active', 2);

-- Phasen für Client Onboarding
INSERT INTO workflow_stages (workflow_id, name, description, order_index, is_required, estimated_duration) VALUES
(1, 'Initial Contact', 'First contact with client and requirements gathering', 1, true, 8),
(1, 'Contract & Legal', 'Finalize contracts and legal requirements', 2, true, 16),
(1, 'Setup & Configuration', 'Set up client systems and initial configuration', 3, true, 24),
(1, 'Training', 'Train client staff on systems', 4, true, 16),
(1, 'Handover & Support', 'Complete handover and establish ongoing support', 5, true, 8);

-- Phasen für Software Release
INSERT INTO workflow_stages (workflow_id, name, description, order_index, is_required, estimated_duration) VALUES
(2, 'Planning', 'Define scope and requirements for the release', 1, true, 16),
(2, 'Development', 'Implement features and changes', 2, true, 80),
(2, 'Testing', 'Perform QA and testing', 3, true, 40),
(2, 'Documentation', 'Update all documentation', 4, true, 16),
(2, 'Deployment', 'Deploy to production', 5, true, 8),
(2, 'Post-Release', 'Post-release monitoring and fixes', 6, true, 16);

-- Beispiel-Tasks für den Client Onboarding Workflow
INSERT INTO tasks (workflow_id, stage_id, title, description, status, priority, assigned_to, due_date, estimated_hours) VALUES
(1, 1, 'Initial Client Meeting', 'Schedule and conduct initial client meeting to gather requirements', 'completed', 'high', 1, CURRENT_TIMESTAMP + INTERVAL '3 days', 2),
(1, 1, 'Create Client Profile', 'Create profile of client needs and expectations', 'in progress', 'medium', 1, CURRENT_TIMESTAMP + INTERVAL '5 days', 3),
(1, 2, 'Draft Contract', 'Prepare initial contract draft based on requirements', 'pending', 'high', 2, CURRENT_TIMESTAMP + INTERVAL '7 days', 4),
(1, 2, 'Legal Review', 'Send contract for legal review', 'pending', 'medium', 2, CURRENT_TIMESTAMP + INTERVAL '10 days', 2),
(1, 3, 'System Setup', 'Initial system setup for client', 'pending', 'high', 1, CURRENT_TIMESTAMP + INTERVAL '15 days', 8),
(1, 4, 'Training Plan', 'Develop training plan for client staff', 'pending', 'medium', 2, CURRENT_TIMESTAMP + INTERVAL '20 days', 4);

-- Beispiel für Task Dependencies
INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type) VALUES
(3, 2, 'finish_to_start'),
(4, 3, 'finish_to_start'),
(5, 4, 'finish_to_start'),
(6, 5, 'finish_to_start');

-- Beispiel Benachrichtigungen
INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES
(1, 'New Task Assigned', 'You have been assigned to create a client profile', 'task_assignment', 'task', 2),
(2, 'Task Due Soon', 'The "Draft Contract" task is due in 3 days', 'due_date_reminder', 'task', 3),
(1, 'Comment on Task', 'New comment added to "Initial Client Meeting"', 'comment', 'task', 1);

-- Status-Übergänge für Tasks
INSERT INTO status_transitions (entity_type, from_status, to_status, is_allowed, requires_approval) VALUES
('task', 'pending', 'in progress', true, false),
('task', 'in progress', 'blocked', true, false),
('task', 'in progress', 'under review', true, false),
('task', 'blocked', 'in progress', true, false),
('task', 'under review', 'in progress', true, false),
('task', 'under review', 'completed', true, true),
('task', 'in progress', 'completed', true, false),
('task', 'pending', 'cancelled', true, true),
('task', 'in progress', 'cancelled', true, true); 