"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir))
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
// POST /api/upload/image
router.post('/image', upload.single('image'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'Không có file được upload' });
        return;
    }
    const relativeUrl = `/uploads/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}${relativeUrl}`;
    res.json({ url, filename: req.file.filename });
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map