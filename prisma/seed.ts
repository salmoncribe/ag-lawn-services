import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("lawn123", 12);

  const billy = await prisma.user.upsert({
    where: { username: "billy" },
    update: { passwordHash },
    create: {
      username: "billy",
      passwordHash
    }
  });

  const josh = await prisma.user.upsert({
    where: { username: "josh" },
    update: { passwordHash },
    create: {
      username: "josh",
      passwordHash
    }
  });

  await prisma.booking.deleteMany();
  await prisma.subscription.deleteMany();

  await prisma.booking.createMany({
    data: [
      {
        userId: billy.id,
        serviceType: "premium-mow",
        addons: ["edging-upgrade"],
        date: addDays(new Date(), 1),
        address: "5407 98th St, Lubbock, TX",
        notes: "Corner lot with a wide side gate.",
        status: "CONFIRMED",
        stripeSessionId: "cs_test_seed_billy_1",
        totalPrice: 70
      },
      {
        userId: billy.id,
        serviceType: "fertilize",
        addons: [],
        date: subDays(new Date(), 18),
        address: "5407 98th St, Lubbock, TX",
        notes: "Backyard only treatment note.",
        status: "COMPLETED",
        stripeSessionId: "cs_test_seed_billy_2",
        totalPrice: 55
      },
      {
        userId: josh.id,
        serviceType: "mow-fertilize-bundle",
        addons: ["leaf-cleanup"],
        date: addDays(new Date(), 2),
        address: "3011 112th St, Lubbock, TX",
        notes: "Please text before arrival.",
        status: "CONFIRMED",
        stripeSessionId: "cs_test_seed_josh_1",
        totalPrice: 105
      },
      {
        userId: josh.id,
        serviceType: "aeration",
        addons: [],
        date: subDays(new Date(), 34),
        address: "3011 112th St, Lubbock, TX",
        notes: "Front yard has sprinkler heads marked.",
        status: "COMPLETED",
        stripeSessionId: "cs_test_seed_josh_2",
        totalPrice: 95
      }
    ]
  });

  await prisma.subscription.createMany({
    data: [
      {
        userId: billy.id,
        planName: "Monthly Full Care",
        price: 135,
        nextBillingDate: addDays(new Date(), 12),
        active: true
      },
      {
        userId: josh.id,
        planName: "Bi-Weekly Mowing",
        price: 40,
        nextBillingDate: addDays(new Date(), 6),
        active: true
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
