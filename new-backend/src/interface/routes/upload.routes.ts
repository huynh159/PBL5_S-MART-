import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// POST /api/upload/image
router.post('/image', upload.single('image'), (req: Request, res: Response): void => {
    if (!req.file) { res.status(400).json({ error: 'Không có file được upload' }); return; }
    const relativeUrl = `/uploads/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}${relativeUrl}`;
    res.json({ url, filename: req.file.filename });
});

export default router;
