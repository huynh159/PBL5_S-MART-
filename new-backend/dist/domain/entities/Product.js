"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
class Product {
    title;
    description;
    categoryId;
    id;
    vectorData = [];
    variants = [];
    constructor(title, description, categoryId) {
        this.title = title;
        this.description = description;
        this.categoryId = categoryId;
        this.id = crypto.randomUUID();
        this.updateVectorInternal();
    }
    getVariants() {
        return Object.freeze([...this.variants]);
    }
    addVariant(variant) {
        if (variant.productId !== this.id) {
            throw new Error("Variant này không thuộc về Product này");
        }
        this.variants.push(variant);
    }
    updateDescription(newDesc) {
        this.description = newDesc;
        this.updateVectorInternal(); // Invariant: luôn nhất quán khi mô tả đổi
    }
    updateImage(imageUrl) {
        // Logic update image
        this.updateVectorInternal(); // Invariant: luôn nhất quán khi ảnh đổi
    }
    updateVectorInternal() {
        // Mock logic sinh vector data
        // Thực tế sẽ gọi sang AI Service (OpenAI/Gemini embeddings)
        this.vectorData = [Math.random(), Math.random(), Math.random()];
    }
    getVectorData() {
        return this.vectorData;
    }
}
exports.Product = Product;
//# sourceMappingURL=Product.js.map