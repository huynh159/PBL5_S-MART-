import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
    earlyAccess: true,
    studio: {
        url: process.env.DATABASE_URL
    },
    migrate: {
        url: process.env.DATABASE_URL
    },
    introspection: {
        url: process.env.DATABASE_URL
    }
});
