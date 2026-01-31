import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // Explicitly pass the URL from process.env to satisfy PrismaClientOptions requirements
    // and fallback to empty object if undefined (though it should be defined)
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
