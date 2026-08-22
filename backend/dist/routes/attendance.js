"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const getTodayString = () => new Date().toISOString().split('T')[0];
const getTimeString = () => new Date().toTimeString().split(' ')[0];
// CHECK-IN
router.post('/check-in', auth_1.authenticateToken, (req, res) => {
    const employeeId = req.user?.employeeId;
    if (!employeeId)
        return res.status(401).json({ message: 'Unauthorized' });
    const today = getTodayString();
    const data = database_1.db.getData();
    let record = data.attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (record && record.checkIn) {
        return res.status(400).json({ message: 'Already checked in for today', record });
    }
    const checkInTime = getTimeString();
    if (record) {
        record.checkIn = checkInTime;
        record.status = 'Present';
    }
    else {
        record = {
            id: `att-${Date.now()}`,
            employeeId,
            date: today,
            checkIn: checkInTime,
            status: 'Present',
            notes: 'Standard Clock-In',
        };
        data.attendance.push(record);
    }
    database_1.db.saveData(data);
    return res.json({ message: 'Checked in successfully', record });
});
// CHECK-OUT
router.post('/check-out', auth_1.authenticateToken, (req, res) => {
    const employeeId = req.user?.employeeId;
    if (!employeeId)
        return res.status(401).json({ message: 'Unauthorized' });
    const today = getTodayString();
    const data = database_1.db.getData();
    const record = data.attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (!record || !record.checkIn) {
        return res.status(400).json({ message: 'You have not checked in today yet' });
    }
    if (record.checkOut) {
        return res.status(400).json({ message: 'Already checked out for today', record });
    }
    const checkOutTime = getTimeString();
    record.checkOut = checkOutTime;
    // Calculate total hours
    const [inH, inM, inS] = record.checkIn.split(':').map(Number);
    const [outH, outM, outS] = checkOutTime.split(':').map(Number);
    const startMinutes = inH * 60 + inM;
    const endMinutes = outH * 60 + outM;
    const diffHours = Math.max(0, (endMinutes - startMinutes) / 60);
    record.totalHours = parseFloat(diffHours.toFixed(2));
    if (diffHours < 4) {
        record.status = 'Half-day';
    }
    else {
        record.status = 'Present';
    }
    database_1.db.saveData(data);
    return res.json({ message: 'Checked out successfully', record });
});
// GET TODAY STATUS FOR LOGGED IN EMPLOYEE
router.get('/today', auth_1.authenticateToken, (req, res) => {
    const employeeId = req.user?.employeeId;
    const today = getTodayString();
    const data = database_1.db.getData();
    const record = data.attendance.find((a) => a.employeeId === employeeId && a.date === today);
    return res.json({ record: record || null });
});
// GET LOGGED IN EMPLOYEE ATTENDANCE LOG
router.get('/my', auth_1.authenticateToken, (req, res) => {
    const employeeId = req.user?.employeeId;
    const data = database_1.db.getData();
    const records = data.attendance.filter((a) => a.employeeId === employeeId);
    return res.json(records);
});
// ADMIN: GET ALL ATTENDANCE RECORDS (with employee names)
router.get('/all', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const data = database_1.db.getData();
    const result = data.attendance.map((att) => {
        const emp = data.employees.find((e) => e.employeeId === att.employeeId);
        return {
            ...att,
            employeeName: emp ? emp.name : att.employeeId,
            department: emp ? emp.department : 'General',
        };
    });
    return res.json(result);
});
// ADMIN: UPDATE ATTENDANCE RECORD
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const data = database_1.db.getData();
    const record = data.attendance.find((a) => a.id === req.params.id);
    if (!record) {
        return res.status(404).json({ message: 'Attendance record not found' });
    }
    const { status, checkIn, checkOut, totalHours, notes } = req.body;
    if (status)
        record.status = status;
    if (checkIn !== undefined)
        record.checkIn = checkIn;
    if (checkOut !== undefined)
        record.checkOut = checkOut;
    if (totalHours !== undefined)
        record.totalHours = totalHours;
    if (notes !== undefined)
        record.notes = notes;
    database_1.db.saveData(data);
    return res.json(record);
});
exports.default = router;
