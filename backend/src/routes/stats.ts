import { Router, Response } from 'express';
import { pool, mapEmployee, mapAttendance, mapNotification } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Total employees
    const empCountResult = await pool.query('SELECT COUNT(*) AS count FROM employees');
    const totalEmployees = parseInt(empCountResult.rows[0].count);

    // Present today
    const presentResult = await pool.query(
      `SELECT COUNT(*) AS count FROM attendance
       WHERE date = CURRENT_DATE AND status IN ('Present', 'Half-day')`
    );
    const presentToday = parseInt(presentResult.rows[0].count);

    // Active leaves today
    const activeLeavesResult = await pool.query(
      `SELECT COUNT(*) AS count FROM leaves
       WHERE status = 'Approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`
    );
    const activeLeavesToday = parseInt(activeLeavesResult.rows[0].count);

    // Pending leave requests
    const pendingResult = await pool.query(
      `SELECT COUNT(*) AS count FROM leaves WHERE status = 'Pending'`
    );
    const pendingLeaveRequests = parseInt(pendingResult.rows[0].count);

    // Total monthly payroll
    const payrollResult = await pool.query(
      'SELECT COALESCE(SUM(salary_net), 0) AS total FROM employees'
    );
    const totalMonthlyPayroll = Number(payrollResult.rows[0].total);

    // Department distribution
    const deptResult = await pool.query(
      'SELECT department AS name, COUNT(*) AS count FROM employees GROUP BY department ORDER BY count DESC'
    );
    const departmentBreakdown = deptResult.rows.map((r) => ({
      name: r.name,
      count: parseInt(r.count),
    }));

    // Weekly attendance trend (past 7 days)
    const attendanceTrend = [];
    const todayDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayResult = await pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE status IN ('Present', 'Half-day')) AS present,
          COUNT(*) FILTER (WHERE status = 'Leave') AS on_leave
         FROM attendance WHERE date = $1`,
        [dStr]
      );

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
    const currentEmpResult = await pool.query(
      'SELECT * FROM employees WHERE employee_id = $1',
      [user.employeeId]
    );
    const currentEmp = currentEmpResult.rows.length > 0 ? mapEmployee(currentEmpResult.rows[0]) : null;

    const userAttResult = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE',
      [user.employeeId]
    );
    const userAttendanceToday = userAttResult.rows.length > 0 ? mapAttendance(userAttResult.rows[0]) : null;

    const pendingUserLeaves = await pool.query(
      `SELECT COUNT(*) AS count FROM leaves WHERE employee_id = $1 AND status = 'Pending'`,
      [user.employeeId]
    );

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
        todayAttendance: userAttendanceToday,
        leaveBalance: currentEmp?.leaveBalance || { paidLeave: 0, sickLeave: 0, unpaidLeave: 0 },
        pendingLeavesCount: parseInt(pendingUserLeaves.rows[0].count),
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET NOTIFICATIONS
router.get('/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  try {
    let result;
    if (user?.role === 'Admin') {
      result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = 'ALL' OR user_id = $1 OR user_id = 'HR-001'
         ORDER BY created_at DESC LIMIT 50`,
        [user.employeeId]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = 'ALL' OR user_id = $1
         ORDER BY created_at DESC LIMIT 50`,
        [user?.employeeId]
      );
    }
    return res.json(result.rows.map(mapNotification));
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// MARK NOTIFICATION READ
router.put('/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE id::text = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
