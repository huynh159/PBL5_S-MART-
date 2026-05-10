import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function test() {
    try {
        const result = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: 'Test string',
        });
        console.log("Success with text-embedding-004", result.embeddings?.[0]?.values?.slice(0, 5));
    } catch (e: any) {
        console.error("Error text-embedding-004:", e.message);
    }
}

test();
