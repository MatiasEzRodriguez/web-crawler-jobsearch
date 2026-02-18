import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showSampleJobs() {
  try {
    console.log('📊 Mostrando primeros 5 jobs guardados en Neon:\n');
    const jobs = await prisma.job.findMany({
      take: 5,
      orderBy: { foundAt: 'desc' }
    });
    
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title}`);
      console.log(`   Empresa: ${job.company}`);
      console.log(`   URL: ${job.url.substring(0, 60)}...`);
      console.log(`   Fecha publicada: ${job.postedDate.toLocaleDateString('es-AR')}`);
      console.log();
    });
    
    console.log(`✅ Total de jobs en la base de datos: ${await prisma.job.count()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showSampleJobs();
