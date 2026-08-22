"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const getTodayString = () => new Date().toISOString().split('T')[0];
router.get('/dashboard', auth_1.authenticateToken, (req, res) => {
    const data = database_1.db.getData();
    const todayStr = getTodayString();
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Unauthorized' });
    const totalEmployees = data.employees.length;
    // Attendance stats for today
    const todayAttendance = data.attendance.filter((a) => a.date === todayStr);
    const presentToday = todayAttendance.filter((a) => a.status === 'Present' || a.status === 'Half-day').length;
    // Leaves active today
    const activeLeavesToday = data.leaves.filter((l) => l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr).length;
    const pendingLeaveRequests = data.leaves.filter((l) => l.status === 'Pending').length;
    // Monthly Payroll total cost
    const totalMonthlyPayroll = data.employees.reduce((acc, emp) => acc + emp.salaryStructure.netSalary, 0);
    // Department distribution
    const deptCounts = {};
    data.employees.forEach((emp) => {
        deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    });
    const departmentBreakdown = Object.keys(deptCounts).map((dept) => ({
        name: dept,
        count: deptCounts[dept],
    }));
    // Weekly attendance chart data (past 7 days)
    const attendanceTrend = [];
    const todayDate = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const presentCount = data.attendance.filter((a) => a.date === dStr && (a.status === 'Present' || a.status === 'Half-day')).length;
        const leaveCount = data.attendance.filter((a) => a.date === dStr && a.status === 'Leave').length;
        attendanceTrend.push({
            date: dayLabel,
            fullDate: dStr,
            Present: presentCount,
            Leave: leaveCount,
            Absent: Math.max(0, totalEmployees - presentCount - leaveCount),
        });
    }
    // Current employee specific summary
    const currentEmp = data.employees.find((e) => e.employeeId === user.employeeId);
    const userLeaves = data.leaves.filter((l) => l.employeeId === user.employeeId);
    const userAttendanceToday = todayAttendance.find((a) => a.employeeId === user.employeeId);
    return res.json({
        adminStats: {
            totalEmployees,
            presentToday,
            activeLeavesToday,
            pendingLeaveRequests,
            totalMonthlyPayroll,
            departmentBreakdown,
            attendanceTrend,
        },
        employeeStats: {
            employee: currentEmp,
            todayAttendance: userAttendanceToday || null,
            leaveBalance: currentEmp?.leaveBalance || { paidLeave: 0, sickLeave: 0, unpaidLeave: 0 },
            pendingLeavesCount: userLeaves.filter((l) => l.status === 'Pending').length,
        },
    });
});
// GET NOTIFICATIONS
router.get('/notifications', auth_1.authenticateToken, (req, res) => {
    const user = req.user;
    const data = database_1.db.getData();
    const userNotifs = data.notifications.filter((n) => n.userId === 'ALL' || n.userId === user?.employeeId || (user?.role === 'Admin' && n.userId === 'HR-001'));
    return res.json(userNotifs);
});
// MARK NOTIFICATION READ
router.put('/notifications/:id/read', auth_1.authenticateToken, (req, res) => {
    const data = database_1.db.getData();
    const notif = data.notifications.find((n) => n.id === req.params.id);
    if (notif) {
        notif.read = true;
        database_1.db.saveData(data);
    }
    return res.json({ success: true });
});
exports.default = router;
