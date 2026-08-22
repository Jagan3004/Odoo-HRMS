import { Router, Response } from 'express';
import { pool, mapLeave, mapEmployee } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// APPLY FOR LEAVE
router.post('/apply', authenticateToken, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user?.employeeId;
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason?.trim()) {
    return res.status(400).json({ message: 'Leave type, start date, end date, and reason are required' });
  }
  if (!['Paid', 'Sick', 'Unpaid'].includes(leaveType)) return res.status(400).json({ message: 'Invalid leave type' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return res.status(400).json({ message: 'Dates must use YYYY-MM-DD format' });

  try {
    const empResult = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [employeeId]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const emp = empResult.rows[0];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      return res.status(400).json({ message: 'End date must be on or after start date' });
    }

    const balanceColumn = leaveType === 'Paid' ? 'leave_paid' : leaveType === 'Sick' ? 'leave_sick' : 'leave_unpaid';
    if (leaveType !== 'Unpaid' && Number(emp[balanceColumn]) < totalDays) return res.status(400).json({ message: `Insufficient ${leaveType.toLowerCase()} leave balance` });
    const overlap = await pool.query(
      `SELECT 1 FROM leaves WHERE employee_id = $1 AND status IN ('Pending', 'Approved') AND start_date <= $3 AND end_date >= $2 LIMIT 1`,
      [employeeId, startDate, endDate]
    );
    if (overlap.rows.length) return res.status(409).json({ message: 'This date range overlaps an existing leave request' });

    const leaveResult = await pool.query(
      `INSERT INTO leaves (employee_id, employee_name, department, leave_type, start_date, end_date, total_days, reason, status, applied_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', CURRENT_DATE) RETURNING *`,
      [employeeId, emp.name, emp.department, leaveType, startDate, endDate, totalDays, reason.trim()]
    );

    // Notification for HR
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
      VALUES ('ALL', 'New Leave Application', $1, 'warning')`,
      [`${emp.name} has applied for ${totalDays} day(s) of ${leaveType} leave.`]
    );

    return res.status(201).json(mapLeave(leaveResult.rows[0]));
  } catch (err) {
    console.error('Apply leave error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET CURRENT EMPLOYEE LEAVES
router.get('/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const empResult = await pool.query(
      'SELECT leave_paid, leave_sick, leave_unpaid FROM employees WHERE employee_id = $1',
      [req.user?.employeeId]
    );

    const leavesResult = await pool.query(
      'SELECT * FROM leaves WHERE employee_id = $1 ORDER BY applied_date DESC',
      [req.user?.employeeId]
    );

    const balance = empResult.rows.length > 0
      ? { paidLeave: empResult.rows[0].leave_paid, sickLeave: empResult.rows[0].leave_sick, unpaidLeave: empResult.rows[0].leave_unpaid }
      : { paidLeave: 0, sickLeave: 0, unpaidLeave: 0 };

    return res.json({
      balance,
      requests: leavesResult.rows.map(mapLeave),
    });
  } catch (err) {
    console.error('Get my leaves error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: GET ALL LEAVE REQUESTS
router.get('/all', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM leaves ORDER BY applied_date DESC');
    return res.json(result.rows.map(mapLeave));
  } catch (err) {
    console.error('Get all leaves error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: REVIEW LEAVE REQUEST
router.put('/:id/review', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res: Response) => {
  const { status, adminComment } = req.body;

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const leaveResult = await client.query('SELECT * FROM leaves WHERE id::text = $1 FOR UPDATE', [req.params.id]);
    if (leaveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leave = leaveResult.rows[0];
    if (leave.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This leave request has already been reviewed' });
    }

    if (status === 'Approved' && leave.leave_type !== 'Unpaid') {
      const column = leave.leave_type === 'Paid' ? 'leave_paid' : 'leave_sick';
      const balance = await client.query(`SELECT ${column} FROM employees WHERE employee_id = $1 FOR UPDATE`, [leave.employee_id]);
      if (!balance.rows.length || Number(balance.rows[0][column]) < leave.total_days) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient leave balance for approval' });
      }
      await client.query(`UPDATE employees SET ${column} = ${column} - $1 WHERE employee_id = $2`, [leave.total_days, leave.employee_id]);
      await client.query(`INSERT INTO attendance (employee_id, date, status, notes) SELECT $1, day::date, 'Leave', 'Approved leave' FROM generate_series($2::date, $3::date, interval '1 day') AS day ON CONFLICT (employee_id, date) DO UPDATE SET status = 'Leave', notes = 'Approved leave'`, [leave.employee_id, leave.start_date, leave.end_date]);
    }

    await client.query(
      `UPDATE leaves SET status = $1, admin_comment = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id::text = $4 AND status = 'Pending'`,
      [status, adminComment || '', req.user?.employeeId, req.params.id]
    );

    // Notification for employee
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        leave.employee_id,
        `Leave Request ${status}`,
        `Your ${leave.leave_type} leave from ${leave.start_date} to ${leave.end_date} has been ${status.toLowerCase()}.`,
        status === 'Approved' ? 'success' : 'error',
      ]
    );

    const updated = await client.query('SELECT * FROM leaves WHERE id::text = $1', [req.params.id]);
    await client.query('COMMIT');
    return res.json(mapLeave(updated.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Review leave error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
