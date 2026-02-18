import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Intentando conectar a Neon...');
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión exitosa:', result);
    
    console.log('\n📊 Verificando tabla jobs...');
    const jobCount = await prisma.job.count();
    console.log(`✅ Tabla jobs existe. Total jobs: ${jobCount}`);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
