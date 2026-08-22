import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const docsDir = path.join(uploadsDir, 'documents');
[uploadsDir, avatarsDir, docsDir].forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// AVATAR STORAGE
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user?.employeeId || 'unknown'}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  },
});

// DOCUMENT STORAGE
const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsDir),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${req.user?.employeeId || 'unknown'}_${Date.now()}_${safeName}`);
  },
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, Word, and image documents are allowed'));
  },
});

// ============================
// AVATAR UPLOAD
// ============================
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req: AuthRequest, res: Response) => {
  if (!req.file || !req.user) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await pool.query('UPDATE employees SET avatar_url = $1 WHERE employee_id = $2', [avatarUrl, req.user.employeeId]);
    return res.json({ message: 'Profile picture updated', avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ============================
// DOCUMENT UPLOAD
// ============================
router.post('/document', authenticateToken, docUpload.single('document'), async (req: AuthRequest, res: Response) => {
  if (!req.file || !req.user) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const docName = req.body.docName || req.file.originalname;
    const docType = req.body.docType || 'General';
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    // Store in a documents table (we'll create it) or embed in employee JSON
    // For simplicity, use a separate documents table
    const result = await pool.query(
      `INSERT INTO documents (employee_id, name, type, file_url, upload_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *`,
      [req.user.employeeId, docName, docType, fileUrl]
    );

    return res.status(201).json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      type: result.rows[0].type,
      url: result.rows[0].file_url,
      uploadDate: result.rows[0].upload_date,
    });
  } catch (err) {
    console.error('Document upload error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET MY DOCUMENTS
router.get('/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE employee_id = $1 ORDER BY upload_date DESC',
      [req.user?.employeeId]
    );
    return res.json(result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      url: r.file_url,
      uploadDate: r.upload_date instanceof Date ? r.upload_date.toISOString().split('T')[0] : r.upload_date,
    })));
  } catch (err) {
    console.error('Get documents error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE DOCUMENT
router.delete('/document/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND employee_id = $2',
      [req.params.id, req.user?.employeeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Document not found' });

    const filePath = path.join(__dirname, '../../', result.rows[0].file_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
