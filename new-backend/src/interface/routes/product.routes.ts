import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

const toAbsoluteMediaUrl = (url: string | null | undefined, baseUrl: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
};

const mapProductResponse = (product: any, baseUrl: string) => ({
    ...product,
    imageUrl: toAbsoluteMediaUrl(product.imageUrl, baseUrl),
    imageUrls: Array.isArray(product.images)
        ? product.images.map((img: any) => toAbsoluteMediaUrl(img.imageUrl, baseUrl))
        : []
});

// GET /api/products?page=0&size=12&search=&categoryId=
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.query['page'] as string) || 0;
        const size = parseInt(req.query['size'] as string) || 12;
        const search = req.query['search'] as string || '';
        const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined;
        const where: any = { status: 'ACTIVE' };
        if (search) where.name = { contains: search };
        if (categoryId) where.categoryId = categoryId;
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where, skip: page * size, take: size,
                include: { category: true, images: true },
                orderBy: { id: 'desc' }
            }),
            prisma.product.count({ where })
        ]);
        res.json({
            content: products.map((p) => mapProductResponse(p, baseUrl)),
            totalElements: total,
            totalPages: Math.ceil(total / size),
            number: page
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/products/admin/all?page=0&size=500&search=&categoryId=
router.get('/admin/all', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.query['page'] as string) || 0;
        const size = parseInt(req.query['size'] as string) || 500;
        const search = req.query['search'] as string || '';
        const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined;
        const where: any = {};
        if (search) where.name = { contains: search };
        if (categoryId) where.categoryId = categoryId;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip: page * size,
                take: size,
                include: { category: true, images: true },
                orderBy: { id: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            content: products.map((p) => mapProductResponse(p, baseUrl)),
            totalElements: total,
            totalPages: Math.ceil(total / size),
            number: page
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id as string);
        const product = await prisma.product.findUnique({ where: { id }, include: { category: true, images: true } });
        if (!product) { res.status(404).json({ error: 'Không tìm thấy sản phẩm' }); return; }
        res.json(mapProductResponse(product, baseUrl));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/:id/detail
router.get('/:id/detail', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id as string);
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true, images: true,
                reviews: { include: { user: { select: { id: true, email: true } } }, orderBy: { createdAt: 'desc' } }
            }
        });
        if (!product) { res.status(404).json({ error: 'Không tìm thấy sản phẩm' }); return; }
        res.json(mapProductResponse(product, baseUrl));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/category/:categoryId
router.get('/category/:categoryId', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const categoryId = parseInt(req.params.categoryId as string);
        const products = await prisma.product.findMany({
            where: { categoryId, status: 'ACTIVE' },
            include: { images: true },
            orderBy: { id: 'desc' }
        });
        res.json(products.map((p) => mapProductResponse(p, baseUrl)));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/:id/recommend (sản phẩm cùng danh mục)
router.get('/:id/recommend', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id as string);
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) { res.json([]); return; }
        const similar = await prisma.product.findMany({
            where: { categoryId: product.categoryId, id: { not: id }, status: 'ACTIVE' },
            take: 8, include: { images: true }, orderBy: { id: 'desc' }
        });
        res.json(similar.map((p) => mapProductResponse(p, baseUrl)));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/products (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { imageUrls, ...productData } = req.body || {};
        const product = await prisma.$transaction(async (tx) => {
            const created = await tx.product.create({ data: productData });
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                await tx.productImage.createMany({
                    data: imageUrls
                        .filter((url: unknown) => typeof url === 'string' && url.trim().length > 0)
                        .map((url: string) => ({ productId: created.id, imageUrl: url }))
                });
            }
            return created;
        });
        res.status(201).json(product);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/products/:id (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const { imageUrls, ...productData } = req.body || {};
        const product = await prisma.$transaction(async (tx) => {
            const updated = await tx.product.update({ where: { id }, data: productData });

            if (Array.isArray(imageUrls)) {
                await tx.productImage.deleteMany({ where: { productId: id } });
                if (imageUrls.length > 0) {
                    await tx.productImage.createMany({
                        data: imageUrls
                            .filter((url: unknown) => typeof url === 'string' && url.trim().length > 0)
                            .map((url: string) => ({ productId: id, imageUrl: url }))
                    });
                }
            }

            return updated;
        });
        res.json(product);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/products/:id (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        try {
            await prisma.product.delete({ where: { id } });
        } catch (deleteError: any) {
            // Nếu sản phẩm đã phát sinh đơn hàng thì không thể xóa cứng -> chuyển sang ẩn
            if (String(deleteError?.message || '').includes('Foreign key constraint violated')) {
                await prisma.product.update({
                    where: { id },
                    data: { status: 'HIDDEN' }
                });
                res.json({ message: 'Sản phẩm đã phát sinh dữ liệu, đã chuyển sang trạng thái ẩn' });
                return;
            }
            throw deleteError;
        }
        res.json({ message: 'Đã xóa sản phẩm' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
