import { Router, Response } from 'express';
import { pool, mapAttendance } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// CHECK-IN
router.post('/check-in', authenticateToken, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Check if already checked in today
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE',
      [employeeId]
    );

    if (existing.rows.length > 0 && existing.rows[0].check_in) {
      return res.status(400).json({ message: 'Already checked in for today', record: mapAttendance(existing.rows[0]) });
    }

    let record;
    if (existing.rows.length > 0) {
      // Update existing row
      const result = await pool.query(
        `UPDATE attendance SET check_in = CURRENT_TIME, status = 'Present'
         WHERE employee_id = $1 AND date = CURRENT_DATE RETURNING *`,
        [employeeId]
      );
      record = result.rows[0];
    } else {
      // Insert new
      const result = await pool.query(
        `INSERT INTO attendance (employee_id, date, check_in, status, notes)
         VALUES ($1, CURRENT_DATE, CURRENT_TIME, 'Present', 'Standard Clock-In') RETURNING *`,
        [employeeId]
      );
      record = result.rows[0];
    }

    return res.json({ message: 'Checked in successfully', record: mapAttendance(record) });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// CHECK-OUT
router.post('/check-out', authenticateToken, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user?.employeeId;
  if (!employeeId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE',
      [employeeId]
    );

    if (existing.rows.length === 0 || !existing.rows[0].check_in) {
      return res.status(400).json({ message: 'You have not checked in today yet' });
    }
    if (existing.rows[0].check_out) {
      return res.status(400).json({ message: 'Already checked out for today', record: mapAttendance(existing.rows[0]) });
    }

    // Calculate hours and update
    const result = await pool.query(
      `UPDATE attendance
       SET check_out = CURRENT_TIME,
           total_hours = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIME - check_in)) / 3600.0, 2),
           status = CASE
             WHEN EXTRACT(EPOCH FROM (CURRENT_TIME - check_in)) / 3600.0 < 4 THEN 'Half-day'
             ELSE 'Present'
           END
       WHERE employee_id = $1 AND date = CURRENT_DATE RETURNING *`,
      [employeeId]
    );

    return res.json({ message: 'Checked out successfully', record: mapAttendance(result.rows[0]) });
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET TODAY STATUS
router.get('/today', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE',
      [req.user?.employeeId]
    );
    return res.json({ record: result.rows.length > 0 ? mapAttendance(result.rows[0]) : null });
  } catch (err) {
    console.error('Get today attendance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET MY ATTENDANCE LOG
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC',
      [req.user?.employeeId]
    );
    return res.json(result.rows.map(mapAttendance));
  } catch (err) {
    console.error('Get my attendance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET MY WEEKLY ATTENDANCE
router.get('/weekly', authenticateToken, async (req: AuthRequest, res: Response) => {
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : new Date().toISOString().split('T')[0];
  const start = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return res.status(400).json({ message: 'Invalid end date' });
  start.setUTCDate(start.getUTCDate() - 6);
  const startDate = start.toISOString().split('T')[0];
  try {
    const result = await pool.query('SELECT * FROM attendance WHERE employee_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date', [req.user?.employeeId, startDate, endDate]);
    return res.json({ startDate, endDate, records: result.rows.map(mapAttendance) });
  } catch (err) {
    console.error('Get weekly attendance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: GET ALL ATTENDANCE WITH EMPLOYEE NAMES
router.get('/all', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, e.name AS emp_name, e.department AS emp_department
       FROM attendance a
       LEFT JOIN employees e ON e.employee_id = a.employee_id
       ORDER BY a.date DESC, e.name`
    );
    return res.json(result.rows.map(mapAttendance));
  } catch (err) {
    console.error('Get all attendance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: UPDATE ATTENDANCE RECORD
router.put('/:id', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, checkIn, checkOut, totalHours, notes } = req.body;

    const existing = await pool.query('SELECT * FROM attendance WHERE id::text = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const result = await pool.query(
      `UPDATE attendance SET
        status = COALESCE($1, status),
        check_in = COALESCE($2::time, check_in),
        check_out = COALESCE($3::time, check_out),
        total_hours = COALESCE($4, total_hours),
        notes = COALESCE($5, notes)
       WHERE id::text = $6 RETURNING *`,
      [status, checkIn || null, checkOut || null, totalHours, notes, req.params.id]
    );

    return res.json(mapAttendance(result.rows[0]));
  } catch (err) {
    console.error('Update attendance error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
