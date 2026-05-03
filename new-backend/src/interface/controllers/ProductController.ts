import { Request, Response } from 'express';
import { ProductUseCases } from '../../application/use-cases/ProductUseCases';

export class ProductController {
    constructor(private readonly productUseCases: ProductUseCases) {}

    public async getAll(req: Request, res: Response): Promise<void> {
        try {
            const products = await this.productUseCases.getAllProducts();
            res.status(200).json(products);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    public async getById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string);
            const product = await this.productUseCases.getProductDetails(id);
            if (!product) {
                res.status(404).json({ error: "Không tìm thấy sản phẩm" });
                return;
            }
            res.status(200).json(product);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
