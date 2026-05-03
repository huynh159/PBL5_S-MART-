"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const router = (0, express_1.Router)();
// GET /api/categories
router.get('/', async (_req, res) => {
    try {
        const categories = await PrismaClient_1.prisma.category.findMany();
        res.json(categories);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=category.routes.js.map