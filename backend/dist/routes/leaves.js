"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// APPLY FOR LEAVE
router.post('/apply', auth_1.authenticateToken, (req, res) => {
    const employeeId = req.user?.employeeId;
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
        return res.status(400).json({ message: 'Leave type, start date, end date, and reason are required' });
    }
    const data = database_1.db.getData();
    const emp = data.employees.find((e) => e.employeeId === employeeId);
    if (!emp) {
        return res.status(404).json({ message: 'Employee profile not found' });
    }
    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    if (totalDays <= 0) {
        return res.status(400).json({ message: 'End date must be on or after start date' });
    }
    const newLeave = {
        id: `l-${Date.now()}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: 'Pending',
        appliedDate: new Date().toISOString().split('T')[0],
    };
    data.leaves.unshift(newLeave);
    // Add notification for HR
    data.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: 'HR-001',
        title: 'New Leave Application',
        message: `${emp.name} has applied for ${totalDays} day(s) of ${leaveType} leave.`,
        type: 'warning',
        createdAt: new Date().toISOString(),
        read: false,
    });
    database_1.db.saveData(data);
    return res.status(201).json(newLeave);
});
// GET CURRENT EMPLOYEE LEAVES
router.get('/my', auth_1.authenticateToken, (req, res) => {
    const employeeId = req.user?.employeeId;
    const data = database_1.db.getData();
    const emp = data.employees.find((e) => e.employeeId === employeeId);
    const requests = data.leaves.filter((l) => l.employeeId === employeeId);
    return res.json({
        balance: emp ? emp.leaveBalance : { paidLeave: 0, sickLeave: 0, unpaidLeave: 0 },
        requests,
    });
});
// ADMIN: GET ALL LEAVE REQUESTS
router.get('/all', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const data = database_1.db.getData();
    return res.json(data.leaves);
});
// ADMIN: REVIEW (APPROVE / REJECT) LEAVE REQUEST
router.put('/:id/review', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const { status, adminComment } = req.body;
    if (!status || !['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }
    const data = database_1.db.getData();
    const leave = data.leaves.find((l) => l.id === req.params.id);
    if (!leave) {
        return res.status(404).json({ message: 'Leave request not found' });
    }
    leave.status = status;
    leave.adminComment = adminComment || '';
    leave.reviewedBy = req.user?.employeeId;
    leave.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    // If approved, deduct from employee's leave balance
    if (status === 'Approved') {
        const emp = data.employees.find((e) => e.employeeId === leave.employeeId);
        if (emp) {
            if (leave.leaveType === 'Paid') {
                emp.leaveBalance.paidLeave = Math.max(0, emp.leaveBalance.paidLeave - leave.totalDays);
            }
            else if (leave.leaveType === 'Sick') {
                emp.leaveBalance.sickLeave = Math.max(0, emp.leaveBalance.sickLeave - leave.totalDays);
            }
        }
    }
    // Send notification to employee
    data.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: leave.employeeId,
        title: `Leave Request ${status}`,
        message: `Your ${leave.leaveType} leave request from ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()}.`,
        type: status === 'Approved' ? 'success' : 'error',
        createdAt: new Date().toISOString(),
        read: false,
    });
    database_1.db.saveData(data);
    return res.json(leave);
});
exports.default = router;
