import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, mapEmployee } from '../db';
import { JWT_SECRET, authenticateToken, AuthRequest } from '../middleware/auth';
import { Role } from '../types';
import crypto from 'crypto';

const router = Router();

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const user = userResult.rows[0];
    if (user.email_verified === false) return res.status(403).json({ message: 'Please verify your email before signing in.', code: 'EMAIL_VERIFICATION_REQUIRED' });
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    const empResult = await pool.query(
      `SELECT e.*, COALESCE((SELECT json_agg(d ORDER BY d.upload_date DESC) FROM documents d WHERE d.employee_id = e.employee_id), '[]') AS documents_json
       FROM employees e WHERE e.employee_id = $1`,
      [user.employee_id]
    );

    const payload = {
      id: user.id,
      employeeId: user.employee_id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: payload,
      employee: empResult.rows.length > 0 ? mapEmployee(empResult.rows[0]) : null,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// REGISTER
router.post('/register', async (req, res) => {
  const { email, password, employeeId, role, name, designation, department, phone, address } = req.body;

  if (!email || !password || !employeeId || !name) {
    return res.status(400).json({ message: 'Email, password, employeeId, and name are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR employee_id = $2',
      [email, employeeId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email or Employee ID already exists' });
    }

    // Public registration must never grant administrative privileges.
    const userRole: Role = 'Employee';
    const passwordHash = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Insert user
    const userResult = await pool.query(
      'INSERT INTO users (employee_id, email, password_hash, role, email_verified, verification_token_hash, verification_expires_at) VALUES ($1, $2, $3, $4, FALSE, $5, NOW() + INTERVAL \'24 hours\') RETURNING *',
      [employeeId, email, passwordHash, userRole, verificationHash]
    );

    // Insert employee
    const empResult = await pool.query(
      `INSERT INTO employees (employee_id, name, email, role, designation, department, phone, address, manager_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [employeeId, name, email, userRole, designation || 'Software Engineer', department || 'Engineering', phone || '', address || '', 'Sarah Jenkins']
    );

    const newUser = userResult.rows[0];
    const payload = {
      id: newUser.id,
      employeeId: newUser.employee_id,
      email: newUser.email,
      role: newUser.role,
    };

    return res.status(201).json({
      verificationRequired: true,
      verificationToken,
      message: 'Registration successful. Verify your email to activate your account.',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// VERIFY EMAIL. In production, send verificationToken by email instead of exposing it in the response.
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Verification token is required' });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  try {
    const result = await pool.query(
      `UPDATE users SET email_verified = TRUE, verification_token_hash = NULL, verification_expires_at = NULL
       WHERE verification_token_hash = $1 AND verification_expires_at > NOW() RETURNING email`, [hash]
    );
    if (!result.rows.length) return res.status(400).json({ message: 'Verification token is invalid or expired' });
    return res.json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const empResult = await pool.query(
      `SELECT e.*, COALESCE((SELECT json_agg(d ORDER BY d.upload_date DESC) FROM documents d WHERE d.employee_id = e.employee_id), '[]') AS documents_json
       FROM employees e WHERE e.employee_id = $1`,
      [req.user.employeeId]
    );

    return res.json({
      user: req.user,
      employee: empResult.rows.length > 0 ? mapEmployee(empResult.rows[0]) : null,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
// CHANGE PASSWORD
router.put('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new passwords are required' });
  if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE employee_id = $1', [req.user.employeeId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = userResult.rows[0];
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE employee_id = $2', [newHash, req.user.employeeId]);

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
