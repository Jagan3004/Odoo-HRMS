-- ============================================================
-- DAYFLOW HRMS — PostgreSQL Database Schema + Seed Data
-- Run this entire script in pgAdmin Query Tool
-- ============================================================

-- 1. Create Database (run separately if needed)
-- CREATE DATABASE dayflow_hrms;

-- Connect to dayflow_hrms before running below

-- ============================================================
-- DROP EXISTING TABLES (for clean re-runs)
-- ============================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    employee_id     VARCHAR(20) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'Employee' CHECK (role IN ('Admin', 'Employee')),
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token_hash TEXT,
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE employees (
    id                  SERIAL PRIMARY KEY,
    employee_id         VARCHAR(20) UNIQUE NOT NULL REFERENCES users(employee_id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    role                VARCHAR(20) NOT NULL DEFAULT 'Employee',
    designation         VARCHAR(255) NOT NULL DEFAULT 'Staff Member',
    department          VARCHAR(100) NOT NULL DEFAULT 'General',
    joining_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    phone               VARCHAR(50) DEFAULT '',
    address             TEXT DEFAULT '',
    emergency_contact   VARCHAR(255) DEFAULT '',
    avatar_url          TEXT DEFAULT '',
    manager_name        VARCHAR(255) DEFAULT '',
    -- Salary Structure (flattened columns)
    salary_basic            NUMERIC(12,2) NOT NULL DEFAULT 5000,
    salary_hra              NUMERIC(12,2) NOT NULL DEFAULT 2000,
    salary_special_allowance NUMERIC(12,2) NOT NULL DEFAULT 1000,
    salary_conveyance       NUMERIC(12,2) NOT NULL DEFAULT 300,
    salary_pf_deduction     NUMERIC(12,2) NOT NULL DEFAULT 600,
    salary_tax_deduction    NUMERIC(12,2) NOT NULL DEFAULT 700,
    salary_gross            NUMERIC(12,2) GENERATED ALWAYS AS (salary_basic + salary_hra + salary_special_allowance + salary_conveyance) STORED,
    salary_net              NUMERIC(12,2) GENERATED ALWAYS AS (salary_basic + salary_hra + salary_special_allowance + salary_conveyance - salary_pf_deduction - salary_tax_deduction) STORED,
    -- Leave Balances
    leave_paid              INTEGER NOT NULL DEFAULT 15,
    leave_sick              INTEGER NOT NULL DEFAULT 10,
    leave_unpaid            INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);

-- ============================================================
-- TABLE: attendance
-- ============================================================
CREATE TABLE attendance (
    id              SERIAL PRIMARY KEY,
    employee_id     VARCHAR(20) NOT NULL REFERENCES users(employee_id) ON DELETE CASCADE,
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in        TIME,
    check_out       TIME,
    total_hours     NUMERIC(5,2),
    status          VARCHAR(20) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Half-day', 'Leave')),
    notes           TEXT DEFAULT '',
    UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);

-- ============================================================
-- TABLE: leaves
-- ============================================================
CREATE TABLE leaves (
    id              SERIAL PRIMARY KEY,
    employee_id     VARCHAR(20) NOT NULL REFERENCES users(employee_id) ON DELETE CASCADE,
    employee_name   VARCHAR(255) NOT NULL,
    department      VARCHAR(100) NOT NULL,
    leave_type      VARCHAR(20) NOT NULL CHECK (leave_type IN ('Paid', 'Sick', 'Unpaid')),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      INTEGER NOT NULL,
    reason          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    applied_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    admin_comment   TEXT DEFAULT '',
    reviewed_by     VARCHAR(20),
    reviewed_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_leaves_employee ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);

-- ============================================================
-- TABLE: payslips
-- ============================================================
CREATE TABLE payslips (
    id              SERIAL PRIMARY KEY,
    employee_id     VARCHAR(20) NOT NULL REFERENCES users(employee_id) ON DELETE CASCADE,
    month           VARCHAR(50) NOT NULL,
    month_code      VARCHAR(10) NOT NULL,
    paid_days       INTEGER NOT NULL DEFAULT 22,
    -- Salary snapshot at time of generation
    salary_basic            NUMERIC(12,2) NOT NULL,
    salary_hra              NUMERIC(12,2) NOT NULL,
    salary_special_allowance NUMERIC(12,2) NOT NULL,
    salary_conveyance       NUMERIC(12,2) NOT NULL,
    salary_pf_deduction     NUMERIC(12,2) NOT NULL,
    salary_tax_deduction    NUMERIC(12,2) NOT NULL,
    salary_gross            NUMERIC(12,2) NOT NULL,
    salary_net              NUMERIC(12,2) NOT NULL,
    issued_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid', 'Processing')),
    UNIQUE(employee_id, month_code)
);

CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_month ON payslips(month_code);

-- ============================================================
-- TABLE: documents
-- ============================================================
CREATE TABLE documents (
    id              SERIAL PRIMARY KEY,
    employee_id     VARCHAR(20) NOT NULL REFERENCES users(employee_id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(50) NOT NULL DEFAULT 'General',
    file_url        TEXT NOT NULL,
    upload_date     DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_documents_employee ON documents(employee_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(20) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read            BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);


INSERT INTO users (employee_id, email, password_hash, role, email_verified) VALUES
    ('HR-001',  'admin@dayflow.com',         '$2b$10$0hAnqaJx0l.QKkH/A1F7SuAQpfl5HGKh1SaVSc7S0tvRv2xrmn3cy', 'Admin', TRUE),
    ('EMP-101', 'employee@dayflow.com',       '$2b$10$4/iYhx35fCYZFeUpjDkCxeYRVBEmpOnlpuKg6aD1e.8ZzWVQ7oKBG', 'Employee', TRUE),
    ('EMP-102', 'john.doe@dayflow.com',       '$2b$10$4/iYhx35fCYZFeUpjDkCxeYRVBEmpOnlpuKg6aD1e.8ZzWVQ7oKBG', 'Employee', TRUE),
    ('EMP-103', 'emily.chen@dayflow.com',     '$2b$10$4/iYhx35fCYZFeUpjDkCxeYRVBEmpOnlpuKg6aD1e.8ZzWVQ7oKBG', 'Employee', TRUE),
    ('EMP-104', 'david.miller@dayflow.com',   '$2b$10$4/iYhx35fCYZFeUpjDkCxeYRVBEmpOnlpuKg6aD1e.8ZzWVQ7oKBG', 'Employee', TRUE);

-- Employees
INSERT INTO employees (employee_id, name, email, role, designation, department, joining_date, phone, address, emergency_contact, avatar_url, manager_name,
    salary_basic, salary_hra, salary_special_allowance, salary_conveyance, salary_pf_deduction, salary_tax_deduction,
    leave_paid, leave_sick) VALUES
    ('HR-001',  'vinoth',         'admin@dayflow.com',       'Admin',    'HR Lead & Operations Director', 'Human Resources', '2022-03-15', '+1 (555) 234-5678', '742 Evergreen Terrace, Springfield, OR', '+1 (555) 987-6543 (Spouse - Robert)', '', 'Board of Directors',
        6500, 2600, 1900, 500, 780, 1100, 18, 10),
    ('EMP-101', 'Alex Morgan',    'employee@dayflow.com',    'Employee', 'Senior Frontend Engineer',      'Engineering',     '2023-01-10', '+1 (555) 345-6789', '100 Market St, San Francisco, CA',       '+1 (555) 876-5432 (Mother - Jane)',     '', 'vinoth',
        5500, 2200, 1500, 400, 660, 840, 12, 7),
    ('EMP-102', 'John Doe',       'john.doe@dayflow.com',    'Employee', 'Backend Systems Architect',     'Engineering',     '2022-08-01', '+1 (555) 456-7890', '456 Mission St, San Francisco, CA',      '+1 (555) 765-4321 (Brother - Mark)',    '', 'vinoth',
        6000, 2400, 1600, 400, 720, 980, 14, 9),
    ('EMP-103', 'Emily Chen',     'emily.chen@dayflow.com',  'Employee', 'UI/UX Product Designer',        'Design',          '2023-05-18', '+1 (555) 567-8901', '789 Castro St, San Francisco, CA',       '+1 (555) 654-3210 (Father - David)',    '', 'vinoth',
        4800, 1920, 1280, 300, 576, 624, 15, 8),
    ('EMP-104', 'David Miller',   'david.miller@dayflow.com','Employee', 'Financial Analyst',             'Finance',         '2023-11-01', '+1 (555) 678-9012', '321 Pine St, San Francisco, CA',          '+1 (555) 543-2109 (Spouse - Jessica)',  '', 'vinoth',
        5000, 2000, 1400, 400, 600, 700, 16, 10);

-- Attendance (past 7 weekdays for all employees)
DO $$
DECLARE
    emp_rec RECORD;
    day_offset INTEGER;
    att_date DATE;
BEGIN
    FOR emp_rec IN SELECT employee_id FROM employees LOOP
        FOR day_offset IN 1..7 LOOP
            att_date := CURRENT_DATE - day_offset;
            IF EXTRACT(DOW FROM att_date) NOT IN (0, 6) THEN
                INSERT INTO attendance (employee_id, date, check_in, check_out, total_hours, status, notes)
                VALUES (emp_rec.employee_id, att_date, '09:00:00', '17:30:00', 8.50, 'Present', 'Seeded record')
                ON CONFLICT (employee_id, date) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Leaves
INSERT INTO leaves (employee_id, employee_name, department, leave_type, start_date, end_date, total_days, reason, status, applied_date) VALUES
    ('EMP-101', 'Alex Morgan', 'Engineering', 'Paid',  '2026-09-01', '2026-09-03', 3, 'Annual family vacation', 'Pending',  '2026-08-20'),
    ('EMP-103', 'Emily Chen',  'Design',      'Paid',  '2026-08-25', '2026-08-26', 2, 'Personal appointments',  'Pending',  '2026-08-21');

INSERT INTO leaves (employee_id, employee_name, department, leave_type, start_date, end_date, total_days, reason, status, applied_date, admin_comment, reviewed_by, reviewed_at) VALUES
    ('EMP-102', 'John Doe',    'Engineering', 'Sick',  '2026-08-18', '2026-08-19', 2, 'Severe flu and fever',   'Approved', '2026-08-17', 'Approved. Rest well!', 'HR-001', '2026-08-17 10:30:00+05:30');

-- Payslips (July 2026 for all employees)
INSERT INTO payslips (employee_id, month, month_code, paid_days,
    salary_basic, salary_hra, salary_special_allowance, salary_conveyance,
    salary_pf_deduction, salary_tax_deduction, salary_gross, salary_net, issued_date, status)
SELECT
    e.employee_id, 'July 2026', '2026-07', 22,
    e.salary_basic, e.salary_hra, e.salary_special_allowance, e.salary_conveyance,
    e.salary_pf_deduction, e.salary_tax_deduction, e.salary_gross, e.salary_net,
    '2026-07-31', 'Paid'
FROM employees e;

-- Notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
    ('ALL',    'Welcome to Dayflow HRMS', 'The new HR portal is now live! Track attendance, leaves, and payslips effortlessly.', 'info'),
    ('HR-001', 'New Leave Request Pending', 'Alex Morgan has submitted a 3-day Paid Leave request for review.', 'warning');

-- ============================================================
-- VERIFICATION QUERIES (uncomment to test)
-- ============================================================
-- SELECT * FROM users;
-- SELECT * FROM employees;
-- SELECT * FROM attendance ORDER BY date DESC LIMIT 10;
-- SELECT * FROM leaves;
-- SELECT * FROM payslips;
-- SELECT * FROM notifications;
