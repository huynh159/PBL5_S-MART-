export function getRequiredEnv(name: string, developmentFallback?: string): string {
    const value = process.env[name]?.trim();
    if (value) return value;

    if (process.env.NODE_ENV !== 'production' && developmentFallback) {
        return developmentFallback;
    }

    throw new Error(`Missing required environment variable: ${name}`);
}
