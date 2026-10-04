import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const [email, password, name = "Administrador"] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error("Uso: npm run admin:create -- email senha [nome]  (senha com 8+ caracteres)");
    process.exit(1);
  }
  const e = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email: e }, update: { role: "ADMIN", passwordHash },
    create: { email: e, name, role: "ADMIN", passwordHash },
  });
  console.log("Administrador pronto:", e);
}
main().finally(() => prisma.$disconnect());
