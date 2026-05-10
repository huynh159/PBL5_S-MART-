import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { GeminiVectorService } from '../../infrastructure/external-services/GeminiVectorService';

const router = Router();
const vectorService = new GeminiVectorService();

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

function removeVietnameseTones(str: string): string {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|MỠ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str.toLowerCase().trim();
}

// ─── Cosine Similarity (Độ tương đồng góc giữa 2 vector) ────────────
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ─── GET /api/products/search/ai?q=...  (Vector Search - AI) ─────────
router.get('/search/ai', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query['q'] as string;
        if (!query || query.trim().length === 0) {
            res.status(400).json({ message: 'Missing query parameter "q"' });
            return;
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const limit = Math.min(parseInt(req.query['limit'] as string) || 12, 50);

        console.log(`🔍 AI Search: "${query}"`);
        const startTime = Date.now();

        // 1. Convert search query to vector using Gemini Embedding
        const queryVector = await vectorService.generateEmbedding(query);

        // 2. Load all products that have vectorData
        const productsWithVectors = await prisma.product.findMany({
            where: { vectorData: { not: null }, status: 'ACTIVE' },
            include: { images: true, category: true }
        });

        // 3. Tính điểm cosine similarity cho từng sản phẩm
        const AI_THRESHOLD = 0.65; // Ngưỡng tối thiểu để hiển thị (65%)
        const scoredProducts = productsWithVectors
            .map(p => {
                try {
                    const pVector: number[] = JSON.parse(p.vectorData!);
                    if (!Array.isArray(pVector) || pVector.length === 0) return null;
                    const similarity = cosineSimilarity(queryVector, pVector);
                    return { ...p, similarity };
                } catch {
                    return null;
                }
            })
            .filter((p): p is NonNullable<typeof p> => p !== null && p.similarity >= AI_THRESHOLD);

        // 4. Sắp xếp theo độ tương đồng giảm dần, lấy top N
        const topProducts = scoredProducts
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        const elapsed = Date.now() - startTime;
        console.log(`✅ AI Search found ${topProducts.length} results in ${elapsed}ms (from ${productsWithVectors.length} indexed products)`);

        // 5. Nếu AI search trả về ít kết quả, bổ sung bằng text search (Hybrid Fallback)
        let fallbackProducts: any[] = [];
        if (topProducts.length < 3) {
            const existingIds = topProducts.map(p => p.id);
            fallbackProducts = await prisma.product.findMany({
                where: {
                    status: 'ACTIVE',
                    id: { notIn: existingIds },
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { brand: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: { images: true, category: true },
                take: limit - topProducts.length
            });
        }

        const allResults = [
            ...topProducts.map(p => ({
                ...mapProductResponse(p, baseUrl),
                similarity: Math.round(p.similarity * 100) / 100,
                searchType: 'ai' as const
            })),
            ...fallbackProducts.map(p => ({
                ...mapProductResponse(p, baseUrl),
                similarity: null,
                searchType: 'text' as const
            }))
        ];

        res.json({
            content: allResults,
            totalElements: allResults.length,
            totalPages: 1,
            number: 0,
            searchMeta: {
                query,
                method: topProducts.length > 0 ? 'vector' : 'text_fallback',
                indexedProducts: productsWithVectors.length,
                elapsed: `${elapsed}ms`
            }
        });
    } catch (error: any) {
        console.error('Vector Search Error:', error);
        res.status(500).json({ error: 'AI Search failed: ' + error.message });
    }
});

// ─── POST /api/products/embed-all (Admin: Generate embeddings cho toàn bộ SP) ─
router.post('/embed-all', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const products = await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            include: { category: true }
        });

        console.log(`📦 Generating embeddings for ${products.length} products...`);
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const product of products) {
            try {
                const text = vectorService.formatProductText(
                    product.name,
                    product.description,
                    product.brand,
                    product.category?.name || null,
                    product.variations
                );

                const vector = await vectorService.generateEmbedding(text);
                const searchText = removeVietnameseTones(`${product.name} ${product.description || ''} ${product.brand || ''} ${product.category?.name || ''} ${product.variations || ''}`);

                await prisma.product.update({
                    where: { id: product.id },
                    data: { 
                        vectorData: JSON.stringify(vector),
                        searchText: searchText
                    }
                });

                success++;
                console.log(`  ✅ [${success}/${products.length}] ${product.name}`);

                // Rate limiting delay (200ms between requests)
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err: any) {
                failed++;
                errors.push(`Product #${product.id} (${product.name}): ${err.message}`);
                console.error(`  ❌ Failed: ${product.name} - ${err.message}`);
            }
        }

        console.log(`📊 Embedding complete: ${success} success, ${failed} failed`);

        res.json({
            message: `Đã tạo vector cho ${success}/${products.length} sản phẩm`,
            success,
            failed,
            total: products.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error: any) {
        console.error('Embed All Error:', error);
        res.status(500).json({ error: 'Failed to generate embeddings: ' + error.message });
    }
});

// ─── GET /api/products/embed-status (Admin: Kiểm tra trạng thái embedding) ─
router.get('/embed-status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const [totalActive, totalEmbedded] = await Promise.all([
            prisma.product.count({ where: { status: 'ACTIVE' } }),
            prisma.product.count({ where: { status: 'ACTIVE', vectorData: { not: null } } })
        ]);

        res.json({
            totalActive,
            totalEmbedded,
            percentage: totalActive > 0 ? Math.round((totalEmbedded / totalActive) * 100) : 0
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GET /api/products?page=0&size=12&search=&categoryId= ────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.query['page'] as string) || 0;
        const size = parseInt(req.query['size'] as string) || 12;
        const search = req.query['search'] as string || '';
        const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined;
        const where: any = { status: 'ACTIVE' };
        if (search) {
            const searchTerms = search.split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                where.AND = searchTerms.map(term => {
                    const unaccentedTerm = removeVietnameseTones(term);
                    return {
                        OR: [
                            { name: { contains: term, mode: 'insensitive' } },
                            { description: { contains: term, mode: 'insensitive' } },
                            { brand: { contains: term, mode: 'insensitive' } },
                            { sku: { contains: term, mode: 'insensitive' } },
                            { searchText: { contains: unaccentedTerm, mode: 'insensitive' } }
                        ]
                    };
                });
            }
        }
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

// ─── GET /api/products/admin/all?page=0&size=500&search=&categoryId= ─
router.get('/admin/all', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.query['page'] as string) || 0;
        const size = parseInt(req.query['size'] as string) || 500;
        const search = req.query['search'] as string || '';
        const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined;
        const where: any = {};
        if (search) {
            const searchTerms = search.split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                where.AND = searchTerms.map(term => {
                    const unaccentedTerm = removeVietnameseTones(term);
                    return {
                        OR: [
                            { name: { contains: term, mode: 'insensitive' } },
                            { description: { contains: term, mode: 'insensitive' } },
                            { brand: { contains: term, mode: 'insensitive' } },
                            { sku: { contains: term, mode: 'insensitive' } },
                            { searchText: { contains: unaccentedTerm, mode: 'insensitive' } }
                        ]
                    };
                });
            }
        }
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

// ─── GET /api/products/:id ───────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id as string);
        const product = await prisma.product.findUnique({ where: { id }, include: { category: true, images: true } });
        if (!product) { res.status(404).json({ error: 'Không tìm thấy sản phẩm' }); return; }
        res.json(mapProductResponse(product, baseUrl));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/products/:id/detail ────────────────────────────────────
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

// ─── GET /api/products/category/:categoryId ──────────────────────────
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

// ─── GET /api/products/:id/recommend (sản phẩm tương tự - Vector hoặc cùng danh mục) ─
router.get('/:id/recommend', async (req: Request, res: Response): Promise<void> => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id as string);
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) { res.json([]); return; }

        // Nếu sản phẩm có vectorData, dùng vector similarity để tìm sản phẩm tương tự
        if (product.vectorData) {
            try {
                const productVector: number[] = JSON.parse(product.vectorData);
                const candidates = await prisma.product.findMany({
                    where: {
                        id: { not: id },
                        status: 'ACTIVE',
                        vectorData: { not: null }
                    },
                    include: { images: true }
                });

                const scored = candidates
                    .map(c => {
                        try {
                            const cVector = JSON.parse(c.vectorData!);
                            return { ...c, similarity: cosineSimilarity(productVector, cVector) };
                        } catch {
                            return null;
                        }
                    })
                    .filter((c): c is NonNullable<typeof c> => c !== null && c.similarity > 0.5)
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, 8);

                if (scored.length >= 3) {
                    res.json(scored.map((p) => mapProductResponse(p, baseUrl)));
                    return;
                }
            } catch {
                // Fall through to category-based recommendation
            }
        }

        // Fallback: sản phẩm cùng danh mục
        const similar = await prisma.product.findMany({
            where: { categoryId: product.categoryId, id: { not: id }, status: 'ACTIVE' },
            take: 8, include: { images: true }, orderBy: { id: 'desc' }
        });
        res.json(similar.map((p) => mapProductResponse(p, baseUrl)));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── POST /api/products (Admin - Tạo sản phẩm + auto-embed) ─────────
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

        // Auto-generate embedding cho sản phẩm mới (non-blocking)
        generateEmbeddingForProduct(product.id).catch(err => {
            console.error(`⚠️ Auto-embed failed for product #${product.id}:`, err.message);
        });

        res.status(201).json(product);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ─── PUT /api/products/:id (Admin - Cập nhật sản phẩm + re-embed) ───
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

        // Re-generate embedding khi sản phẩm được cập nhật (non-blocking)
        generateEmbeddingForProduct(id).catch(err => {
            console.error(`⚠️ Re-embed failed for product #${id}:`, err.message);
        });

        res.json(product);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ─── DELETE /api/products/:id (Admin) ────────────────────────────────
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

// ─── Helper: Generate embedding cho 1 sản phẩm ──────────────────────
async function generateEmbeddingForProduct(productId: number): Promise<void> {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
    });
    if (!product) return;

    const text = vectorService.formatProductText(
        product.name,
        product.description,
        product.brand,
        product.category?.name || null,
        product.variations
    );

    const vector = await vectorService.generateEmbedding(text);
    const searchText = removeVietnameseTones(`${product.name} ${product.description || ''} ${product.brand || ''} ${product.category?.name || ''} ${product.variations || ''}`);

    await prisma.product.update({
        where: { id: productId },
        data: { 
            vectorData: JSON.stringify(vector),
            searchText: searchText
        }
    });

    console.log(`🧠 Auto-embedded product #${productId}: ${product.name}`);
}

export default router;
