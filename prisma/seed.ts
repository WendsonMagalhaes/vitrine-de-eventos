import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const names = ["Buffet","Bebidas","Decoração","Foto e vídeo","Música","Espaços","Bolos e doces","Equipamentos","Iluminação","Cerimonial"];
async function main() {
  for (const [i, name] of names.entries()) {
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-");
    await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug, sortOrder: i } });
  }
}
main().finally(() => prisma.$disconnect());
