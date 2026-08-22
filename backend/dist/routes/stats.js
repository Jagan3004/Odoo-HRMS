"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        // Total employees
        const empCountResult = await db_1.pool.query('SELECT COUNT(*) AS count FROM employees');
        const totalEmployees = parseInt(empCountResult.rows[0].count);
        // Present today
        const presentResult = await db_1.pool.query(`SELECT COUNT(*) AS count FROM attendance
       WHERE date = CURRENT_DATE AND status IN ('Present', 'Half-day')`);
        const presentToday = parseInt(presentResult.rows[0].count);
        // Active leaves today
        const activeLeavesResult = await db_1.pool.query(`SELECT COUNT(*) AS count FROM leaves
       WHERE status = 'Approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`);
        const activeLeavesToday = parseInt(activeLeavesResult.rows[0].count);
        // Pending leave requests
        const pendingResult = await db_1.pool.query(`SELECT COUNT(*) AS count FROM leaves WHERE status = 'Pending'`);
        const pendingLeaveRequests = parseInt(pendingResult.rows[0].count);
        // Total monthly payroll
        const payrollResult = await db_1.pool.query('SELECT COALESCE(SUM(salary_net), 0) AS total FROM employees');
        const totalMonthlyPayroll = Number(payrollResult.rows[0].total);
        // Department distribution
        const deptResult = await db_1.pool.query('SELECT department AS name, COUNT(*) AS count FROM employees GROUP BY department ORDER BY count DESC');
        const departmentBreakdown = deptResult.rows.map((r) => ({
            name: r.name,
            count: parseInt(r.count),
        }));
        const payrollDeptResult = await db_1.pool.query('SELECT department AS name, COALESCE(SUM(salary_net), 0) AS amount FROM employees GROUP BY department ORDER BY amount DESC');
        const payrollByDepartment = payrollDeptResult.rows.map((r) => ({ name: r.name, amount: Number(r.amount) }));
        // Weekly attendance trend (past 7 days)
        const attendanceTrend = [];
        const todayDate = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayDate);
            d.setDate(todayDate.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayResult = await db_1.pool.query(`SELECT
          COUNT(*) FILTER (WHERE status IN ('Present', 'Half-day')) AS present,
          COUNT(*) FILTER (WHERE status = 'Leave') AS on_leave
         FROM attendance WHERE date = $1`, [dStr]);
            const present = parseInt(dayResult.rows[0].present) || 0;
            const onLeave = parseInt(dayResult.rows[0].on_leave) || 0;
            attendanceTrend.push({
                date: dayLabel,
                fullDate: dStr,
                Present: present,
                Leave: onLeave,
                Absent: Math.max(0, totalEmployees - present - onLeave),
            });
        }
        // Current employee specific
        const currentEmpResult = await db_1.pool.query(`SELECT e.*, COALESCE((SELECT json_agg(d ORDER BY d.upload_date DESC) FROM documents d WHERE d.employee_id = e.employee_id), '[]') AS documents_json
       FROM employees e WHERE e.employee_id = $1`, [user.employeeId]);
        const currentEmp = currentEmpResult.rows.length > 0 ? (0, db_1.mapEmployee)(currentEmpResult.rows[0]) : null;
        const userAttResult = await db_1.pool.query('SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [user.employeeId]);
        const userAttendanceToday = userAttResult.rows.length > 0 ? (0, db_1.mapAttendance)(userAttResult.rows[0]) : null;
        const pendingUserLeaves = await db_1.pool.query(`SELECT COUNT(*) AS count FROM leaves WHERE employee_id = $1 AND status = 'Pending'`, [user.employeeId]);
        return res.json({
            adminStats: {
                totalEmployees,
                presentToday,
                activeLeavesToday,
                pendingLeaveRequests,
                totalMonthlyPayroll,
                departmentBreakdown,
                payrollByDepartment,
                attendanceTrend,
            },
            employeeStats: {
                employee: currentEmp,
                todayAttendance: userAttendanceToday,
                leaveBalance: currentEmp?.leaveBalance || { paidLeave: 0, sickLeave: 0, unpaidLeave: 0 },
                pendingLeavesCount: parseInt(pendingUserLeaves.rows[0].count),
            },
        });
    }
    catch (err) {
        console.error('Dashboard stats error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// GET NOTIFICATIONS
router.get('/notifications', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    try {
        let result;
        if (user?.role === 'Admin') {
            result = await db_1.pool.query(`SELECT * FROM notifications
         WHERE user_id = 'ALL' OR user_id = $1
         ORDER BY created_at DESC LIMIT 50`, [user.employeeId]);
        }
        else {
            result = await db_1.pool.query(`SELECT * FROM notifications
         WHERE user_id = 'ALL' OR user_id = $1
         ORDER BY created_at DESC LIMIT 50`, [user?.employeeId]);
        }
        return res.json(result.rows.map(db_1.mapNotification));
    }
    catch (err) {
        console.error('Get notifications error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// MARK NOTIFICATION READ
router.put('/notifications/:id/read', auth_1.authenticateToken, async (req, res) => {
    try {
        await db_1.pool.query('UPDATE notifications SET read = TRUE WHERE id::text = $1', [req.params.id]);
        return res.json({ success: true });
    }
    catch (err) {
        console.error('Mark notification read error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
