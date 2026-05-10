import { GoogleGenAI } from '@google/genai';

export class GeminiVectorService {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            console.warn('⚠️  GEMINI_API_KEY is not set. Vector search will not work.');
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * Converts a given text to a 768-dimensional embedding vector
     * using Google's gemini-embedding-001 model.
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const result = await this.ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: text,
            });
            return result.embeddings?.[0]?.values || [];
        } catch (error: any) {
            console.error('Error generating embedding:', error.message);
            throw new Error('Failed to generate embedding vector: ' + error.message);
        }
    }

    /**
     * Batch generate embeddings for multiple texts.
     * Processes sequentially with a small delay to avoid rate limiting.
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        for (let i = 0; i < texts.length; i++) {
            const embedding = await this.generateEmbedding(texts[i]);
            embeddings.push(embedding);
            // Small delay between requests to avoid rate limiting (Gemini free tier)
            if (i < texts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        return embeddings;
    }

    /**
     * Helper formatting function to combine product info for better embedding meaning.
     * Creates a rich text representation that captures product semantics.
     */
    formatProductText(
        name: string,
        description: string | null,
        brand: string | null,
        categoryName: string | null,
        variationsJson?: string | null
    ): string {
        const parts: string[] = [];
        parts.push(`Sản phẩm: ${name}`);
        if (brand) parts.push(`Thương hiệu: ${brand}`);
        if (categoryName) parts.push(`Danh mục: ${categoryName}`);
        
        if (variationsJson) {
            try {
                const vars = JSON.parse(variationsJson);
                if (Array.isArray(vars) && vars.length > 0) {
                    const colors = [...new Set(vars.map((v: any) => v.color).filter(Boolean))];
                    const sizes = [...new Set(vars.map((v: any) => v.size).filter(Boolean))];
                    if (colors.length > 0) parts.push(`Màu sắc: ${colors.join(', ')}`);
                    if (sizes.length > 0) parts.push(`Kích thước: ${sizes.join(', ')}`);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
        
        if (description) parts.push(`Mô tả: ${description}`);
        return parts.join('. ').trim();
    }
}
