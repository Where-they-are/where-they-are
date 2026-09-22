import { db } from "../src/client.js";

const seed = async (): Promise<void> => {
  const owner = await db.user.upsert({
    where: { email: "owner@example.test" },
    update: { displayName: "Demo Owner" },
    create: {
      email: "owner@example.test",
      displayName: "Demo Owner",
      memberships: {
        create: {
          role: "OWNER",
          status: "ACTIVE",
          business: {
            create: {
              name: "Demo Business",
              slug: "demo-business",
              category: "service",
            },
          },
        },
      },
    },
    include: { memberships: { include: { business: true } } },
  });

  console.info(`Seeded ${owner.email} with ${owner.memberships.length} business membership(s)`);
};

void seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
