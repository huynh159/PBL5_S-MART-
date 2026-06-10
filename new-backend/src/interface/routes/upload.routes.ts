import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../../infrastructure/external-services/cloudinaryUpload';

const router = Router();

// Dùng memoryStorage — giữ file trong RAM buffer, không ghi disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/upload/image
router.post('/image', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Không có file được upload' });
            return;
        }

        const result = await uploadToCloudinary(req.file.buffer, 'smart-sport');
        res.json({ url: result.url, publicId: result.publicId });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload ảnh thất bại' });
    }
});

export default router;
