import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        const year = 2026;
        const range = 'year';
        const now = new Date();
        const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        console.log('Testing stats query...');
        
        const topProductsRaw = await prisma.$queryRaw`
            SELECT p.id, p.name, p."image_url" as "imageUrl", COALESCE(SUM(oi.quantity), 0)::int as "totalSold",
                   COALESCE(SUM(oi.quantity * oi.price), 0)::float as "totalRevenue"
            FROM products p
            JOIN order_items oi ON oi.product_id = p.id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status = 'DELIVERED' AND o.created_at >= ${startDate} AND o.created_at <= ${endDate}
            GROUP BY p.id, p.name, p."image_url"
            ORDER BY "totalSold" DESC
            LIMIT 5
        `;
        
        console.log('Top Products:', topProductsRaw);

        const topCustomersRaw = await prisma.$queryRaw`
                SELECT u.id, u.email, COUNT(o.id)::int as "orderCount", COALESCE(SUM(o.total), 0)::float as "totalSpent"
                FROM users u
                JOIN orders o ON o.user_id = u.id
                WHERE o.status = 'DELIVERED'
                GROUP BY u.id, u.email
                ORDER BY "totalSpent" DESC
                LIMIT 5
        `;
        console.log('Top Customers:', topCustomersRaw);

    } catch (e) {
        console.error('FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
