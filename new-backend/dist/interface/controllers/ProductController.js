"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
class ProductController {
    productUseCases;
    constructor(productUseCases) {
        this.productUseCases = productUseCases;
    }
    async getAll(req, res) {
        try {
            const products = await this.productUseCases.getAllProducts();
            res.status(200).json(products);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const product = await this.productUseCases.getProductDetails(id);
            if (!product) {
                res.status(404).json({ error: "Không tìm thấy sản phẩm" });
                return;
            }
            res.status(200).json(product);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=ProductController.js.map