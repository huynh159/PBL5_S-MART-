import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { Money } from '../../domain/value-objects/Money';
import { prisma } from './PrismaClient';

export class PrismaProductRepository implements ProductRepository {
    public async findVariantBySku(sku: string): Promise<ProductVariant | null> {
        // Trong database cũ variations lưu bằng JSON array string 
        // nên ta mô phỏng lấy ra Product có chứa sku đó.
        const row = await prisma.product.findUnique({
            where: { sku: sku }
        });

        if (!row) return null;

        // Trả về một ProductVariant Entity
        return new ProductVariant(
            row.id.toString(),
            row.sku || sku,
            "L", 
            "Black",
            new Money(row.price),
            row.stock
        );
    }

    public async saveVariants(variants: ProductVariant[]): Promise<void> {
        for (const variant of variants) {
            await prisma.product.update({
                where: { sku: variant.sku },
                data: {
                    stock: variant.getQuantity() // Update lại tồn kho thực tế
                }
            });
        }
    }

    // Các hàm phục vụ Query (Đọc dữ liệu để hiển thị)
    public async findAllForDisplay(): Promise<any[]> {
        return prisma.product.findMany({
            where: { status: 'ACTIVE' },
            include: { category: true }
        });
    }

    public async findByIdForDisplay(id: number): Promise<any> {
        return prisma.product.findUnique({
            where: { id },
            include: { category: true }
        });
    }
}
