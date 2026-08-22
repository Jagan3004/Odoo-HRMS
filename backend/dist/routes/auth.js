"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const userResult = await db_1.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials. User not found.' });
        }
        const user = userResult.rows[0];
        const isPasswordValid = bcryptjs_1.default.compareSync(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
        }
        const empResult = await db_1.pool.query('SELECT * FROM employees WHERE employee_id = $1', [user.employee_id]);
        const payload = {
            id: user.id,
            employeeId: user.employee_id,
            email: user.email,
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, auth_1.JWT_SECRET, { expiresIn: '7d' });
        return res.json({
            token,
            user: payload,
            employee: empResult.rows.length > 0 ? (0, db_1.mapEmployee)(empResult.rows[0]) : null,
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// REGISTER
router.post('/register', async (req, res) => {
    const { email, password, employeeId, role, name, designation, department, phone, address } = req.body;
    if (!email || !password || !employeeId || !name) {
        return res.status(400).json({ message: 'Email, password, employeeId, and name are required' });
    }
    try {
        const existing = await db_1.pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR employee_id = $2', [email, employeeId]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email or Employee ID already exists' });
        }
        const userRole = role === 'Admin' ? 'Admin' : 'Employee';
        const passwordHash = bcryptjs_1.default.hashSync(password, 10);
        // Insert user
        const userResult = await db_1.pool.query('INSERT INTO users (employee_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *', [employeeId, email, passwordHash, userRole]);
        // Insert employee
        const empResult = await db_1.pool.query(`INSERT INTO employees (employee_id, name, email, role, designation, department, phone, address, manager_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [employeeId, name, email, userRole, designation || 'Software Engineer', department || 'Engineering', phone || '', address || '', 'Sarah Jenkins']);
        const newUser = userResult.rows[0];
        const payload = {
            id: newUser.id,
            employeeId: newUser.employee_id,
            email: newUser.email,
            role: newUser.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, auth_1.JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({
            token,
            user: payload,
            employee: (0, db_1.mapEmployee)(empResult.rows[0]),
        });
    }
    catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// GET CURRENT USER PROFILE
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const empResult = await db_1.pool.query('SELECT * FROM employees WHERE employee_id = $1', [req.user.employeeId]);
        return res.json({
            user: req.user,
            employee: empResult.rows.length > 0 ? (0, db_1.mapEmployee)(empResult.rows[0]) : null,
        });
    }
    catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
