import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

// Global BigInt serialization fix for JSON.stringify (used by Next.js API/Server Actions)
if (!(BigInt.prototype as any).toJSON) {
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };
}

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
