// Popula o banco com fornecedores e banners de demonstração (dados fictícios).
// Pode rodar várias vezes: atualiza o que já existe em vez de duplicar.
//   npm run db:seed:demo
// Senha dos logins de demonstração: DEMO_PASSWORD (padrão "demo12345").
import { PrismaClient, ProviderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const CATEGORIES = ["Buffet", "Bebidas", "Decoração", "Foto e vídeo", "Música", "Espaços", "Bolos e doces", "Equipamentos", "Iluminação", "Cerimonial"];

type Svc = [name: string, description: string, priceReais: number | null, includes: string[]];
type Demo = { name: string; city: string; cats: string[]; status: ProviderStatus; featured?: boolean; whatsapp: string; phone?: string; about: string; services: Svc[] };

const PROVIDERS: Demo[] = [
  { name: "Ateliê Flor de Sal", city: "Campina Grande", cats: ["Decoração", "Iluminação"], status: "APPROVED", featured: true, whatsapp: "83900000001", phone: "8330000001",
    about: "Decoração autoral para casamentos, aniversários e eventos corporativos, com flores naturais e muito cuidado nos detalhes.",
    services: [
      ["Decoração de casamento", "Flores naturais, painel e mesas para até 150 convidados.", 3500, ["Flores naturais da estação", "Painel e mesa dos noivos", "Montagem e desmontagem"]],
      ["Mesa de bolo", "Montagem com louças, flores e velas.", 600, ["Louças e suportes", "Arranjo de flores", "Velas e iluminação pontual"]],
      ["Arco de flores", "Arco para cerimônia ou fotos.", null, []],
      ["Aluguel de móveis", "Sofás, aparadores e puffs.", 250, ["Entrega e retirada"]],
    ] },
  { name: "Casa Jardim Eventos", city: "Campina Grande", cats: ["Espaços"], status: "APPROVED", featured: true, whatsapp: "83900000002", phone: "8330000002",
    about: "Espaço com jardim, salão climatizado e estacionamento para cerimônias e recepções de até 200 pessoas.",
    services: [
      ["Salão para 200 pessoas", "Salão climatizado com cozinha de apoio.", 4500, ["Mesas e cadeiras", "Ar-condicionado", "Estacionamento"]],
      ["Jardim para cerimônia", "Área aberta com pergolado e cadeiras.", 1800, ["Cadeiras para 120 pessoas", "Pergolado"]],
      ["Day use para ensaios", "Ensaios fotográficos e pequenas reuniões.", 400, []],
    ] },
  { name: "Doce Memória", city: "Campina Grande", cats: ["Bolos e doces"], status: "APPROVED", whatsapp: "83900000003",
    about: "Bolos artísticos e doces finos feitos sob encomenda, com ingredientes selecionados.",
    services: [
      ["Bolo decorado", "Bolo de 2 andares com recheios à escolha.", 480, ["Topo personalizado", "Entrega na região"]],
      ["Docinhos finos (cento)", "Brigadeiros gourmet, cajuzinho, beijinho e mais.", 190, []],
      ["Mesa de doces completa", "Bolo, doces, bem-casados e cupcakes.", 1100, ["Suportes e decoração da mesa"]],
    ] },
  { name: "Lume Foto & Vídeo", city: "Campina Grande", cats: ["Foto e vídeo"], status: "APPROVED", featured: false, whatsapp: "83900000004",
    about: "Cobertura fotográfica e audiovisual de casamentos, aniversários e eventos, com entrega rápida.",
    services: [
      ["Cobertura de casamento", "Cerimônia e festa, com 2 fotógrafos.", 1800, ["Álbum digital", "Galeria online", "Entrega em até 30 dias"]],
      ["Ensaio pré-wedding", "Ensaio externo de até 2 horas.", 600, ["40 fotos tratadas"]],
      ["Vídeo highlight", "Vídeo de 3 a 5 minutos com os melhores momentos.", 900, []],
    ] },
  { name: "Cantinho da Festa Buffet", city: "Campina Grande", cats: ["Buffet", "Bebidas"], status: "APPROVED", whatsapp: "83900000005",
    about: "Buffet completo para festas de 50 a 300 convidados, com cardápios variados e equipe uniformizada.",
    services: [
      ["Buffet completo (por pessoa)", "Entradas, prato principal, sobremesa e bebidas sem álcool.", 95, ["Garçons", "Louças e talheres", "Cozinha no local"]],
      ["Coquetel volante", "Mini-pratos servidos por garçons durante a festa.", 70, []],
      ["Open bar (por pessoa)", "Drinks clássicos e cervejas por até 5 horas.", 55, ["Barman", "Gelo e insumos"]],
    ] },
  { name: "Taberna Drinks", city: "Campina Grande", cats: ["Bebidas"], status: "APPROVED", whatsapp: "83900000006",
    about: "Barman e drinks autorais para casamentos, formaturas e eventos corporativos.",
    services: [
      ["Bar completo", "Estrutura de bar, barmen e carta de drinks.", 2800, ["2 barmen", "Carta de 8 drinks"]],
      ["Carrinho de gin", "Carrinho temático com gin e tônicas aromatizadas.", 1500, []],
    ] },
  { name: "Banda Maré Alta", city: "Lagoa Seca", cats: ["Música"], status: "APPROVED", featured: false, whatsapp: "83900000007",
    about: "Banda ao vivo com repertório de MPB, pop e forró para cerimônias e festas.",
    services: [
      ["Show de 2 horas", "Banda completa com som e iluminação.", 3500, ["Passagem de som", "Repertório combinado"]],
      ["Música para cerimônia", "Voz e violão ou quarteto de cordas.", 1200, []],
    ] },
  { name: "Cerimonial Vera Lúcia", city: "Campina Grande", cats: ["Cerimonial"], status: "APPROVED", whatsapp: "83900000008",
    about: "Assessoria e cerimonial para que você aproveite o seu dia sem preocupação.",
    services: [
      ["Assessoria no dia", "Coordenação da cerimônia e da festa.", 2200, ["Reunião de alinhamento", "Equipe de apoio"]],
      ["Assessoria completa", "Acompanhamento desde o planejamento.", null, []],
    ] },
  { name: "Som & Luz Locações", city: "Queimadas", cats: ["Equipamentos", "Iluminação"], status: "APPROVED", whatsapp: "83900000009",
    about: "Locação de som, iluminação cênica, palcos e telões para eventos de todos os tamanhos.",
    services: [
      ["Som e iluminação básica", "Caixas, mesa e iluminação de pista.", 1400, ["Técnico no evento"]],
      ["Telão LED", "Painel de LED com operação.", 2500, []],
      ["Palco 4x3 m", "Palco modular com escada e saia.", 900, []],
    ] },
  { name: "Mesa Posta Buffet", city: "João Pessoa", cats: ["Buffet", "Bolos e doces"], status: "APPROVED", whatsapp: "83900000010",
    about: "Buffet de comida caseira e mesas de doces para aniversários e confraternizações.",
    services: [
      ["Buffet de aniversário (por pessoa)", "Salgados, prato principal e sobremesa.", 65, []],
      ["Mesa de doces", "Doces variados e bolo do dia.", 800, []],
    ] },
  // Aguardando aprovação (aparecem no painel, não no app)
  { name: "Studio Brisa", city: "Campina Grande", cats: ["Foto e vídeo"], status: "PENDING", whatsapp: "83900000011",
    about: "Estúdio de fotografia para ensaios e eventos.", services: [["Ensaio em estúdio", "Ensaio de até 1 hora.", 350, []]] },
  { name: "Sabor & Arte", city: "Campina Grande", cats: ["Buffet"], status: "PENDING", whatsapp: "83900000012",
    about: "Buffet para eventos de pequeno e médio porte.", services: [["Buffet (por pessoa)", "Cardápio completo.", 80, []]] },
  { name: "Luz Cênica", city: "Campina Grande", cats: ["Iluminação"], status: "PENDING", whatsapp: "83900000013",
    about: "Iluminação decorativa e cênica para casamentos.", services: [["Iluminação decorativa", "Cordões de luz, spots e pin spots.", 1100, []]] },
  { name: "DJ Nando", city: "Campina Grande", cats: ["Música"], status: "PENDING", whatsapp: "83900000014",
    about: "DJ para festas e formaturas.", services: [["DJ por 5 horas", "Equipamento e iluminação de pista inclusos.", 1300, []]] },
];

const BANNERS: { title: string; subtitle: string; color: string; provider?: string; sortOrder: number }[] = [
  { title: "Casamentos que contam histórias", subtitle: "Decoração, foto e buffet em um só lugar", color: "lilac", sortOrder: 0 },
  { title: "Destaque: Ateliê Flor de Sal", subtitle: "Decoração autoral em Campina Grande", color: "peach", provider: "Ateliê Flor de Sal", sortOrder: 1 },
  { title: "Espaços para todos os tamanhos", subtitle: "Conheça a Casa Jardim Eventos", color: "mint", provider: "Casa Jardim Eventos", sortOrder: 2 },
  { title: "Aniversário sem estresse", subtitle: "Bolos, doces e buffet perto de você", color: "sky", sortOrder: 3 },
  { title: "Tem um negócio de eventos?", subtitle: "Cadastre-se e apareça para quem está planejando", color: "lilac", sortOrder: 4 },
];

async function main() {
  const passwordHash = await bcrypt.hash(process.env.DEMO_PASSWORD ?? "demo12345", 10);

  const catId: Record<string, string> = {};
  for (const [i, name] of CATEGORIES.entries()) {
    const slug = slugify(name);
    const c = await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug, sortOrder: i } });
    catId[name] = c.id;
  }

  const providerId: Record<string, string> = {};
  for (const d of PROVIDERS) {
    const email = `${slugify(d.name)}@demo.vitrine.app`;
    const user = await prisma.user.upsert({
      where: { email }, update: { name: d.name, role: "PROVIDER" },
      create: { email, name: d.name, role: "PROVIDER", passwordHash },
    });
    const fields = { name: d.name, description: d.about, city: d.city, phone: d.phone ?? null, whatsapp: d.whatsapp, status: d.status, featured: !!d.featured && d.status === "APPROVED" };
    const p = await prisma.provider.upsert({ where: { userId: user.id }, update: fields, create: { ...fields, userId: user.id } });
    providerId[d.name] = p.id;
    await prisma.providerCategory.deleteMany({ where: { providerId: p.id } });
    await prisma.providerCategory.createMany({ data: d.cats.map((c) => ({ providerId: p.id, categoryId: catId[c] })) });
    await prisma.service.deleteMany({ where: { providerId: p.id } });
    await prisma.service.createMany({
      data: d.services.map(([name, description, price, includes]) => ({ providerId: p.id, name, description, priceFrom: price == null ? null : price * 100, includes })),
    });
  }

  for (const b of BANNERS) {
    const data = { title: b.title, subtitle: b.subtitle, color: b.color, sortOrder: b.sortOrder, active: true, providerId: b.provider ? providerId[b.provider] : null };
    const existing = await prisma.banner.findFirst({ where: { title: b.title } });
    if (existing) await prisma.banner.update({ where: { id: existing.id }, data });
    else await prisma.banner.create({ data });
  }

  console.log(`Demo pronta: ${PROVIDERS.length} fornecedores (${PROVIDERS.filter((p) => p.status === "APPROVED").length} publicados) e ${BANNERS.length} banners.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
