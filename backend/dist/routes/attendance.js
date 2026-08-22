"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// CHECK-IN
router.post('/check-in', auth_1.authenticateToken, async (req, res) => {
    const employeeId = req.user?.employeeId;
    if (!employeeId)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        // Check if already checked in today
        const existing = await db_1.pool.query('SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [employeeId]);
        if (existing.rows.length > 0 && existing.rows[0].check_in) {
            return res.status(400).json({ message: 'Already checked in for today', record: (0, db_1.mapAttendance)(existing.rows[0]) });
        }
        let record;
        if (existing.rows.length > 0) {
            // Update existing row
            const result = await db_1.pool.query(`UPDATE attendance SET check_in = CURRENT_TIME, status = 'Present'
         WHERE employee_id = $1 AND date = CURRENT_DATE RETURNING *`, [employeeId]);
            record = result.rows[0];
        }
        else {
            // Insert new
            const result = await db_1.pool.query(`INSERT INTO attendance (employee_id, date, check_in, status, notes)
         VALUES ($1, CURRENT_DATE, CURRENT_TIME, 'Present', 'Standard Clock-In') RETURNING *`, [employeeId]);
            record = result.rows[0];
        }
        return res.json({ message: 'Checked in successfully', record: (0, db_1.mapAttendance)(record) });
    }
    catch (err) {
        console.error('Check-in error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// CHECK-OUT
router.post('/check-out', auth_1.authenticateToken, async (req, res) => {
    const employeeId = req.user?.employeeId;
    if (!employeeId)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const existing = await db_1.pool.query('SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [employeeId]);
        if (existing.rows.length === 0 || !existing.rows[0].check_in) {
            return res.status(400).json({ message: 'You have not checked in today yet' });
        }
        if (existing.rows[0].check_out) {
            return res.status(400).json({ message: 'Already checked out for today', record: (0, db_1.mapAttendance)(existing.rows[0]) });
        }
        // Calculate a same-day duration and guard against invalid negative values.
        const result = await db_1.pool.query(`UPDATE attendance
       SET check_out = CURRENT_TIME,
           total_hours = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIME - check_in)) / 3600.0, 2)),
           status = CASE
             WHEN EXTRACT(EPOCH FROM (CURRENT_TIME - check_in)) / 3600.0 < 4 THEN 'Half-day'
             ELSE 'Present'
           END
       WHERE employee_id = $1 AND date = CURRENT_DATE RETURNING *`, [employeeId]);
        return res.json({ message: 'Checked out successfully', record: (0, db_1.mapAttendance)(result.rows[0]) });
    }
    catch (err) {
        console.error('Check-out error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// GET TODAY STATUS
router.get('/today', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE', [req.user?.employeeId]);
        return res.json({ record: result.rows.length > 0 ? (0, db_1.mapAttendance)(result.rows[0]) : null });
    }
    catch (err) {
        console.error('Get today attendance error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// GET MY ATTENDANCE LOG
router.get('/my', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC', [req.user?.employeeId]);
        return res.json(result.rows.map(db_1.mapAttendance));
    }
    catch (err) {
        console.error('Get my attendance error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// ADMIN: GET ALL ATTENDANCE WITH EMPLOYEE NAMES
router.get('/all', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), async (req, res) => {
    try {
        const result = await db_1.pool.query(`SELECT a.*, e.name AS emp_name, e.department AS emp_department
       FROM attendance a
       LEFT JOIN employees e ON e.employee_id = a.employee_id
       ORDER BY a.date DESC, e.name`);
        return res.json(result.rows.map(db_1.mapAttendance));
    }
    catch (err) {
        console.error('Get all attendance error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// ADMIN: UPDATE ATTENDANCE RECORD
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), async (req, res) => {
    try {
        const { status, checkIn, checkOut, totalHours, notes } = req.body;
        const existing = await db_1.pool.query('SELECT * FROM attendance WHERE id::text = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        const result = await db_1.pool.query(`UPDATE attendance SET
        status = COALESCE($1, status),
        check_in = COALESCE($2::time, check_in),
        check_out = COALESCE($3::time, check_out),
        total_hours = COALESCE($4, total_hours),
        notes = COALESCE($5, notes)
       WHERE id::text = $6 RETURNING *`, [status, checkIn || null, checkOut || null, totalHours, notes, req.params.id]);
        return res.json((0, db_1.mapAttendance)(result.rows[0]));
    }
    catch (err) {
        console.error('Update attendance error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
