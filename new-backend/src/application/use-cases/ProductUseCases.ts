import { PrismaProductRepository } from '../../infrastructure/persistence/PrismaProductRepository';

export class ProductUseCases {
    constructor(private readonly productRepo: PrismaProductRepository) {}

    public async getAllProducts(): Promise<any[]> {
        // Trong DDD, lấy danh sách hiển thị thường không cần Map sang Entity phức tạp 
        // (Áp dụng CQRS cho Query). Trả thẳng dữ liệu từ Repository (DTO).
        return this.productRepo.findAllForDisplay();
    }

    public async getProductDetails(id: number): Promise<any> {
        return this.productRepo.findByIdForDisplay(id);
    }
}
