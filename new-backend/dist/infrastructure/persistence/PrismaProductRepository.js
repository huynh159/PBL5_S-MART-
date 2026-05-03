"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaProductRepository = void 0;
const ProductVariant_1 = require("../../domain/entities/ProductVariant");
const Money_1 = require("../../domain/value-objects/Money");
const PrismaClient_1 = require("./PrismaClient");
class PrismaProductRepository {
    async findVariantBySku(sku) {
        // Trong database cũ variations lưu bằng JSON array string 
        // nên ta mô phỏng lấy ra Product có chứa sku đó.
        const row = await PrismaClient_1.prisma.product.findUnique({
            where: { sku: sku }
        });
        if (!row)
            return null;
        // Trả về một ProductVariant Entity
        return new ProductVariant_1.ProductVariant(row.id.toString(), row.sku || sku, "L", "Black", new Money_1.Money(row.price), row.stock);
    }
    async saveVariants(variants) {
        for (const variant of variants) {
            await PrismaClient_1.prisma.product.update({
                where: { sku: variant.sku },
                data: {
                    stock: variant.getQuantity() // Update lại tồn kho thực tế
                }
            });
        }
    }
    // Các hàm phục vụ Query (Đọc dữ liệu để hiển thị)
    async findAllForDisplay() {
        return PrismaClient_1.prisma.product.findMany({
            where: { status: 'ACTIVE' },
            include: { category: true }
        });
    }
    async findByIdForDisplay(id) {
        return PrismaClient_1.prisma.product.findUnique({
            where: { id },
            include: { category: true }
        });
    }
}
exports.PrismaProductRepository = PrismaProductRepository;
//# sourceMappingURL=PrismaProductRepository.js.map