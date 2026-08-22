"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET all employees
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM employees ORDER BY name');
        return res.json(result.rows.map(db_1.mapEmployee));
    }
    catch (err) {
        console.error('Get employees error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// GET single employee by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM employees WHERE id::text = $1 OR employee_id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        return res.json((0, db_1.mapEmployee)(result.rows[0]));
    }
    catch (err) {
        console.error('Get employee error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// CREATE employee (Admin only)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), async (req, res) => {
    const { employeeId, name, email, password, role, designation, department, joiningDate, phone, address, emergencyContact, managerName, salaryStructure, } = req.body;
    if (!employeeId || !name || !email) {
        return res.status(400).json({ message: 'Employee ID, Name, and Email are required' });
    }
    try {
        const existing = await db_1.pool.query('SELECT id FROM employees WHERE employee_id = $1 OR LOWER(email) = LOWER($2)', [employeeId, email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Employee with this ID or Email already exists' });
        }
        const empRole = role === 'Admin' ? 'Admin' : 'Employee';
        const passwordHash = bcryptjs_1.default.hashSync(password || 'emp123', 10);
        // Insert user first
        await db_1.pool.query('INSERT INTO users (employee_id, email, password_hash, role) VALUES ($1, $2, $3, $4)', [employeeId, email, passwordHash, empRole]);
        const sal = salaryStructure || { basic: 5000, hra: 2000, specialAllowance: 1000, conveyance: 300, pfDeduction: 600, taxDeduction: 700 };
        // Insert employee
        const empResult = await db_1.pool.query(`INSERT INTO employees (employee_id, name, email, role, designation, department, joining_date, phone, address, emergency_contact, manager_name,
        salary_basic, salary_hra, salary_special_allowance, salary_conveyance, salary_pf_deduction, salary_tax_deduction)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`, [
            employeeId, name, email, empRole,
            designation || 'Staff Member', department || 'General',
            joiningDate || new Date().toISOString().split('T')[0],
            phone || '', address || '', emergencyContact || '',
            managerName || 'Sarah Jenkins',
            sal.basic, sal.hra, sal.specialAllowance, sal.conveyance, sal.pfDeduction, sal.taxDeduction,
        ]);
        return res.status(201).json((0, db_1.mapEmployee)(empResult.rows[0]));
    }
    catch (err) {
        console.error('Create employee error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// UPDATE employee profile
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM employees WHERE id::text = $1 OR employee_id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const emp = result.rows[0];
        const isSelf = req.user?.employeeId === emp.employee_id;
        const isAdmin = req.user?.role === 'Admin';
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ message: 'You can only update your own profile unless you are an Admin' });
        }
        const u = req.body;
        // Update employee fields
        await db_1.pool.query(`UPDATE employees SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        designation = COALESCE($3, designation),
        department = COALESCE($4, department),
        phone = COALESCE($5, phone),
        address = COALESCE($6, address),
        emergency_contact = COALESCE($7, emergency_contact),
        manager_name = COALESCE($8, manager_name),
        joining_date = COALESCE($9, joining_date),
        salary_basic = COALESCE($10, salary_basic),
        salary_hra = COALESCE($11, salary_hra),
        salary_special_allowance = COALESCE($12, salary_special_allowance),
        salary_conveyance = COALESCE($13, salary_conveyance),
        salary_pf_deduction = COALESCE($14, salary_pf_deduction),
        salary_tax_deduction = COALESCE($15, salary_tax_deduction)
       WHERE employee_id = $16`, [
            u.name !== undefined ? u.name : null,
            u.email !== undefined ? u.email : null,
            u.designation !== undefined ? u.designation : null,
            u.department !== undefined ? u.department : null,
            u.phone !== undefined ? u.phone : null,
            u.address !== undefined ? u.address : null,
            u.emergencyContact !== undefined ? u.emergencyContact : null,
            u.managerName !== undefined ? u.managerName : null,
            u.joiningDate !== undefined ? u.joiningDate : null,
            u.salaryStructure?.basic !== undefined ? Number(u.salaryStructure.basic) : (u.basic !== undefined ? Number(u.basic) : null),
            u.salaryStructure?.hra !== undefined ? Number(u.salaryStructure.hra) : (u.hra !== undefined ? Number(u.hra) : null),
            u.salaryStructure?.specialAllowance !== undefined ? Number(u.salaryStructure.specialAllowance) : (u.specialAllowance !== undefined ? Number(u.specialAllowance) : null),
            u.salaryStructure?.conveyance !== undefined ? Number(u.salaryStructure.conveyance) : (u.conveyance !== undefined ? Number(u.conveyance) : null),
            u.salaryStructure?.pfDeduction !== undefined ? Number(u.salaryStructure.pfDeduction) : (u.pfDeduction !== undefined ? Number(u.pfDeduction) : null),
            u.salaryStructure?.taxDeduction !== undefined ? Number(u.salaryStructure.taxDeduction) : (u.taxDeduction !== undefined ? Number(u.taxDeduction) : null),
            emp.employee_id
        ]);
        // Sync email and name with users table if changed
        if (u.email) {
            await db_1.pool.query('UPDATE users SET email = $1 WHERE employee_id = $2', [u.email, emp.employee_id]);
        }
        const updated = await db_1.pool.query('SELECT * FROM employees WHERE employee_id = $1', [emp.employee_id]);
        return res.json((0, db_1.mapEmployee)(updated.rows[0]));
    }
    catch (err) {
        console.error('Update employee error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// DELETE employee (Admin only)
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT employee_id FROM employees WHERE id::text = $1 OR employee_id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const empId = result.rows[0].employee_id;
        // CASCADE will remove employee, attendance, leaves, payslips
        await db_1.pool.query('DELETE FROM users WHERE employee_id = $1', [empId]);
        return res.json({ message: 'Employee removed successfully' });
    }
    catch (err) {
        console.error('Delete employee error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
