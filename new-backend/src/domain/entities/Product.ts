import { ProductVariant } from './ProductVariant';

export class Product {
    public readonly id: string;
    private vectorData: number[] = [];
    private variants: ProductVariant[] = [];

    constructor(
        public title: string,
        private description: string,
        public categoryId: string
    ) {
        this.id = crypto.randomUUID();
        this.updateVectorInternal();
    }

    public getVariants(): readonly ProductVariant[] {
        return Object.freeze([...this.variants]);
    }

    public addVariant(variant: ProductVariant): void {
        if (variant.productId !== this.id) {
            throw new Error("Variant này không thuộc về Product này");
        }
        this.variants.push(variant);
    }

    public updateDescription(newDesc: string): void {
        this.description = newDesc;
        this.updateVectorInternal(); // Invariant: luôn nhất quán khi mô tả đổi
    }

    public updateImage(imageUrl: string): void {
        // Logic update image
        this.updateVectorInternal(); // Invariant: luôn nhất quán khi ảnh đổi
    }

    private updateVectorInternal(): void {
        // Mock logic sinh vector data
        // Thực tế sẽ gọi sang AI Service (OpenAI/Gemini embeddings)
        this.vectorData = [Math.random(), Math.random(), Math.random()];
    }

    public getVectorData(): readonly number[] {
        return this.vectorData;
    }
}
