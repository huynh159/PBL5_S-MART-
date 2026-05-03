"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductUseCases = void 0;
class ProductUseCases {
    productRepo;
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async getAllProducts() {
        // Trong DDD, lấy danh sách hiển thị thường không cần Map sang Entity phức tạp 
        // (Áp dụng CQRS cho Query). Trả thẳng dữ liệu từ Repository (DTO).
        return this.productRepo.findAllForDisplay();
    }
    async getProductDetails(id) {
        return this.productRepo.findByIdForDisplay(id);
    }
}
exports.ProductUseCases = ProductUseCases;
//# sourceMappingURL=ProductUseCases.js.map