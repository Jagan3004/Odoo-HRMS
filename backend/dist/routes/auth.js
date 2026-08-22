"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const data = database_1.db.getData();
    const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }
    const isPasswordValid = bcryptjs_1.default.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }
    const employee = data.employees.find((e) => e.employeeId === user.employeeId);
    const payload = {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
    };
    const token = jsonwebtoken_1.default.sign(payload, auth_1.JWT_SECRET, { expiresIn: '7d' });
    return res.json({
        token,
        user: payload,
        employee,
    });
});
// REGISTER
router.post('/register', (req, res) => {
    const { email, password, employeeId, role, name, designation, department, phone, address } = req.body;
    if (!email || !password || !employeeId || !name) {
        return res.status(400).json({ message: 'Email, password, employeeId, and name are required' });
    }
    const data = database_1.db.getData();
    const existingUser = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase() || u.employeeId === employeeId);
    if (existingUser) {
        return res.status(400).json({ message: 'User with this email or Employee ID already exists' });
    }
    const userRole = role === 'Admin' ? 'Admin' : 'Employee';
    const passwordHash = bcryptjs_1.default.hashSync(password, 10);
    const newUser = {
        id: `u-${Date.now()}`,
        employeeId,
        email,
        passwordHash,
        role: userRole,
        createdAt: new Date().toISOString(),
    };
    const newEmployee = {
        id: `e-${Date.now()}`,
        employeeId,
        name,
        email,
        role: userRole,
        designation: designation || 'Software Engineer',
        department: department || 'Engineering',
        joiningDate: new Date().toISOString().split('T')[0],
        phone: phone || '+1 (555) 000-0000',
        address: address || '123 Tech Park Way, San Francisco, CA',
        emergencyContact: '+1 (555) 111-2222',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
        managerName: 'Sarah Jenkins',
        salaryStructure: {
            basic: 5000,
            hra: 2000,
            specialAllowance: 1000,
            conveyance: 300,
            pfDeduction: 600,
            taxDeduction: 700,
            grossSalary: 8300,
            netSalary: 7000,
        },
        documents: [],
        leaveBalance: { paidLeave: 15, sickLeave: 10, unpaidLeave: 0 },
    };
    data.users.push(newUser);
    data.employees.push(newEmployee);
    database_1.db.saveData(data);
    const payload = {
        id: newUser.id,
        employeeId: newUser.employeeId,
        email: newUser.email,
        role: newUser.role,
    };
    const token = jsonwebtoken_1.default.sign(payload, auth_1.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
        token,
        user: payload,
        employee: newEmployee,
    });
});
// GET CURRENT USER PROFILE
router.get('/me', auth_1.authenticateToken, (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });
    const data = database_1.db.getData();
    const employee = data.employees.find((e) => e.employeeId === req.user?.employeeId);
    return res.json({
        user: req.user,
        employee,
    });
});
exports.default = router;
