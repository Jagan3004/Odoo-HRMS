"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET all employees
router.get('/', auth_1.authenticateToken, (req, res) => {
    const data = database_1.db.getData();
    return res.json(data.employees);
});
// GET single employee by ID
router.get('/:id', auth_1.authenticateToken, (req, res) => {
    const data = database_1.db.getData();
    const emp = data.employees.find((e) => e.id === req.params.id || e.employeeId === req.params.id);
    if (!emp) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    return res.json(emp);
});
// CREATE employee (Admin only)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const { employeeId, name, email, password, role, designation, department, joiningDate, phone, address, emergencyContact, managerName, salaryStructure, } = req.body;
    if (!employeeId || !name || !email) {
        return res.status(400).json({ message: 'Employee ID, Name, and Email are required' });
    }
    const data = database_1.db.getData();
    const existing = data.employees.find((e) => e.employeeId === employeeId || e.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        return res.status(400).json({ message: 'Employee with this ID or Email already exists' });
    }
    const empRole = role === 'Admin' ? 'Admin' : 'Employee';
    const newPasswordHash = bcryptjs_1.default.hashSync(password || 'emp123', 10);
    const newUser = {
        id: `u-${Date.now()}`,
        employeeId,
        email,
        passwordHash: newPasswordHash,
        role: empRole,
        createdAt: new Date().toISOString(),
    };
    const newEmp = {
        id: `e-${Date.now()}`,
        employeeId,
        name,
        email,
        role: empRole,
        designation: designation || 'Staff Member',
        department: department || 'General',
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        phone: phone || '+1 (555) 000-1122',
        address: address || '100 Main St, San Francisco, CA',
        emergencyContact: emergencyContact || '+1 (555) 999-8877',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
        managerName: managerName || 'Sarah Jenkins',
        salaryStructure: salaryStructure || {
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
    data.employees.push(newEmp);
    database_1.db.saveData(data);
    return res.status(201).json(newEmp);
});
// UPDATE employee profile
router.put('/:id', auth_1.authenticateToken, (req, res) => {
    const data = database_1.db.getData();
    const index = data.employees.findIndex((e) => e.id === req.params.id || e.employeeId === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    const existingEmp = data.employees[index];
    const isSelf = req.user?.employeeId === existingEmp.employeeId;
    const isAdmin = req.user?.role === 'Admin';
    if (!isSelf && !isAdmin) {
        return res.status(403).json({ message: 'You can only update your own profile unless you are an Admin' });
    }
    // Employees can edit limited fields (address, phone, avatarUrl, emergencyContact)
    // Admin can edit all details
    const updateData = req.body;
    if (isAdmin) {
        data.employees[index] = {
            ...existingEmp,
            ...updateData,
            salaryStructure: updateData.salaryStructure
                ? { ...existingEmp.salaryStructure, ...updateData.salaryStructure }
                : existingEmp.salaryStructure,
        };
    }
    else {
        data.employees[index] = {
            ...existingEmp,
            phone: updateData.phone !== undefined ? updateData.phone : existingEmp.phone,
            address: updateData.address !== undefined ? updateData.address : existingEmp.address,
            emergencyContact: updateData.emergencyContact !== undefined ? updateData.emergencyContact : existingEmp.emergencyContact,
            avatarUrl: updateData.avatarUrl !== undefined ? updateData.avatarUrl : existingEmp.avatarUrl,
        };
    }
    database_1.db.saveData(data);
    return res.json(data.employees[index]);
});
// DELETE employee (Admin only)
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const data = database_1.db.getData();
    const index = data.employees.findIndex((e) => e.id === req.params.id || e.employeeId === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    const targetEmp = data.employees[index];
    data.employees.splice(index, 1);
    data.users = data.users.filter((u) => u.employeeId !== targetEmp.employeeId);
    database_1.db.saveData(data);
    return res.json({ message: 'Employee removed successfully' });
});
exports.default = router;
