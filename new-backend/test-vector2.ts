import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent('Test string');
        console.log("Success with @google/generative-ai text-embedding-004", result.embedding.values.slice(0, 5));
    } catch (e: any) {
        console.error("Error @google/generative-ai text-embedding-004:", e.message);
    }
}

test();
