"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Ensure upload directories exist
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
const avatarsDir = path_1.default.join(uploadsDir, 'avatars');
const docsDir = path_1.default.join(uploadsDir, 'documents');
[uploadsDir, avatarsDir, docsDir].forEach((d) => { if (!fs_1.default.existsSync(d))
    fs_1.default.mkdirSync(d, { recursive: true }); });
// AVATAR STORAGE
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarsDir),
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `avatar_${req.user?.employeeId || 'unknown'}_${Date.now()}${ext}`);
    },
});
const avatarUpload = (0, multer_1.default)({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext))
            cb(null, true);
        else
            cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    },
});
// DOCUMENT STORAGE
const docStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, docsDir),
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${req.user?.employeeId || 'unknown'}_${Date.now()}_${safeName}`);
    },
});
const docUpload = (0, multer_1.default)({
    storage: docStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
// ============================
// AVATAR UPLOAD
// ============================
router.post('/avatar', auth_1.authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
    if (!req.file || !req.user)
        return res.status(400).json({ message: 'No file uploaded' });
    try {
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await db_1.pool.query('UPDATE employees SET avatar_url = $1 WHERE employee_id = $2', [avatarUrl, req.user.employeeId]);
        return res.json({ message: 'Profile picture updated', avatarUrl });
    }
    catch (err) {
        console.error('Avatar upload error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// ============================
// DOCUMENT UPLOAD
// ============================
router.post('/document', auth_1.authenticateToken, docUpload.single('document'), async (req, res) => {
    if (!req.file || !req.user)
        return res.status(400).json({ message: 'No file uploaded' });
    try {
        const docName = req.body.docName || req.file.originalname;
        const docType = req.body.docType || 'General';
        const fileUrl = `/uploads/documents/${req.file.filename}`;
        // Store in a documents table (we'll create it) or embed in employee JSON
        // For simplicity, use a separate documents table
        const result = await db_1.pool.query(`INSERT INTO documents (employee_id, name, type, file_url, upload_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *`, [req.user.employeeId, docName, docType, fileUrl]);
        return res.status(201).json({
            id: result.rows[0].id,
            name: result.rows[0].name,
            type: result.rows[0].type,
            url: result.rows[0].file_url,
            uploadDate: result.rows[0].upload_date,
        });
    }
    catch (err) {
        console.error('Document upload error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// GET MY DOCUMENTS
router.get('/documents', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM documents WHERE employee_id = $1 ORDER BY upload_date DESC', [req.user?.employeeId]);
        return res.json(result.rows.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            url: r.file_url,
            uploadDate: r.upload_date instanceof Date ? r.upload_date.toISOString().split('T')[0] : r.upload_date,
        })));
    }
    catch (err) {
        console.error('Get documents error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// DELETE DOCUMENT
router.delete('/document/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM documents WHERE id = $1 AND employee_id = $2', [req.params.id, req.user?.employeeId]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Document not found' });
        const filePath = path_1.default.join(__dirname, '../../', result.rows[0].file_url);
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
        await db_1.pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
        return res.json({ message: 'Document deleted' });
    }
    catch (err) {
        console.error('Delete document error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
