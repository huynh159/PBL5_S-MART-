"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinaryUpload_1 = require("../../infrastructure/external-services/cloudinaryUpload");
const router = (0, express_1.Router)();
// Dùng memoryStorage — giữ file trong RAM buffer, không ghi disk
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
// POST /api/upload/image
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Không có file được upload' });
            return;
        }
        const result = await (0, cloudinaryUpload_1.uploadToCloudinary)(req.file.buffer, 'smart-sport');
        res.json({ url: result.url, publicId: result.publicId });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload ảnh thất bại' });
    }
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map