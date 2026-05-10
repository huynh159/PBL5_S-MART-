import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { GeminiVectorService } from './src/infrastructure/external-services/GeminiVectorService';

const prisma = new PrismaClient();
const vectorService = new GeminiVectorService();

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

async function testSearch(query: string) {
    console.log(`\n🔍 Searching for: "${query}"`);
    
    // 1. Convert search query to vector
    const queryVector = await vectorService.generateEmbedding(query);
    
    // 2. Load all products
    const productsWithVectors = await prisma.product.findMany({
        where: { vectorData: { not: null }, status: 'ACTIVE' },
        include: { category: true }
    });
    
    console.log(`Found ${productsWithVectors.length} products with vectors.`);
    
    // 3. Score
    const scoredProducts = productsWithVectors
        .map(p => {
            try {
                const pVector = JSON.parse(p.vectorData!);
                if (!Array.isArray(pVector) || pVector.length === 0) return null;
                const similarity = cosineSimilarity(queryVector, pVector);
                return { id: p.id, name: p.name, similarity };
            } catch {
                return null;
            }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null && p.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
        
    console.log("Top results:");
    scoredProducts.forEach((p, i) => {
        console.log(`  ${i+1}. [ID: ${p.id}] ${p.name} (Similarity: ${Math.round(p.similarity * 100) / 100})`);
    });
}

async function run() {
    await testSearch("giày thể thao");
    await testSearch("áo chelsea");
    await prisma.$disconnect();
}

run();
