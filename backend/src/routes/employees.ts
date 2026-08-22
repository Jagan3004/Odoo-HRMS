import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool, mapEmployee } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// GET all employees
router.get('/', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT e.*, COALESCE((SELECT json_agg(d ORDER BY d.upload_date DESC) FROM documents d WHERE d.employee_id = e.employee_id), '[]') AS documents_json FROM employees e ORDER BY e.name`);
    return res.json(result.rows.map(mapEmployee));
  } catch (err) {
    console.error('Get employees error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single employee by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT e.*, COALESCE((SELECT json_agg(d ORDER BY d.upload_date DESC) FROM documents d WHERE d.employee_id = e.employee_id), '[]') AS documents_json
       FROM employees e WHERE (e.id::text = $1 OR e.employee_id = $1) AND ($2 = 'Admin' OR e.employee_id = $3)`,
      [req.params.id, req.user?.role, req.user?.employeeId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.json(mapEmployee(result.rows[0]));
  } catch (err) {
    console.error('Get employee error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE employee (Admin only)
router.post('/', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res: Response) => {
  const {
    employeeId, name, email, password, role, designation, department,
    joiningDate, phone, address, emergencyContact, managerName, salaryStructure,
  } = req.body;

  if (!employeeId || !name || !email) {
    return res.status(400).json({ message: 'Employee ID, Name, and Email are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM employees WHERE employee_id = $1 OR LOWER(email) = LOWER($2)',
      [employeeId, email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Employee with this ID or Email already exists' });
    }

    const empRole: Role = role === 'Admin' ? 'Admin' : 'Employee';
    const passwordHash = bcrypt.hashSync(password || 'emp123', 10);

    // Insert user first
    await pool.query(
      'INSERT INTO users (employee_id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [employeeId, email, passwordHash, empRole]
    );

    const sal = salaryStructure || { basic: 5000, hra: 2000, specialAllowance: 1000, conveyance: 300, pfDeduction: 600, taxDeduction: 700 };

    // Insert employee
    const empResult = await pool.query(
      `INSERT INTO employees (employee_id, name, email, role, designation, department, joining_date, phone, address, emergency_contact, manager_name,
        salary_basic, salary_hra, salary_special_allowance, salary_conveyance, salary_pf_deduction, salary_tax_deduction)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [
        employeeId, name, email, empRole,
        designation || 'Staff Member', department || 'General',
        joiningDate || new Date().toISOString().split('T')[0],
        phone || '', address || '', emergencyContact || '',
        managerName || 'Sarah Jenkins',
        sal.basic, sal.hra, sal.specialAllowance, sal.conveyance, sal.pfDeduction, sal.taxDeduction,
      ]
    );

    return res.status(201).json(mapEmployee(empResult.rows[0]));
  } catch (err) {
    console.error('Create employee error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE employee profile
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE id::text = $1 OR employee_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const emp = result.rows[0];
    const isSelf = req.user?.employeeId === emp.employee_id;
    const isAdmin = req.user?.role === 'Admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'You can only update your own profile unless you are an Admin' });
    }

    const u = req.body;

    if (isAdmin) {
      await pool.query(
        `UPDATE employees SET
          name = COALESCE($1, name), designation = COALESCE($2, designation),
          department = COALESCE($3, department), phone = COALESCE($4, phone),
          address = COALESCE($5, address), emergency_contact = COALESCE($6, emergency_contact),
          manager_name = COALESCE($7, manager_name)
         WHERE employee_id = $8`,
        [u.name, u.designation, u.department, u.phone, u.address, u.emergencyContact, u.managerName, emp.employee_id]
      );
    } else {
      await pool.query(
        `UPDATE employees SET phone = COALESCE($1, phone), address = COALESCE($2, address),
          emergency_contact = COALESCE($3, emergency_contact)
         WHERE employee_id = $4`,
        [u.phone, u.address, u.emergencyContact, emp.employee_id]
      );
    }

    const updated = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [emp.employee_id]);
    return res.json(mapEmployee(updated.rows[0]));
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE employee (Admin only)
router.delete('/:id', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT employee_id FROM employees WHERE id::text = $1 OR employee_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const empId = result.rows[0].employee_id;
    // CASCADE will remove employee, attendance, leaves, payslips
    await pool.query('DELETE FROM users WHERE employee_id = $1', [empId]);

    return res.json({ message: 'Employee removed successfully' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
