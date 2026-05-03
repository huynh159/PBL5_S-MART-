import { ProductVariant } from '../entities/ProductVariant';

export interface ProductRepository {
    findVariantBySku(sku: string): Promise<ProductVariant | null>;
    saveVariants(variants: ProductVariant[]): Promise<void>;
}
