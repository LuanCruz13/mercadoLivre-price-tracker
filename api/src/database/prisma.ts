import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

// Cria o pool de conexão nativo do PostgreSQL
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Injeta o adaptador diretamente no Prisma Client
export const prisma = new PrismaClient({
    adapter,
    log: ["query", "error"],
});