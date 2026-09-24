import { db } from "../src/client.js";

const seed = async (): Promise<void> => {
	const owner = await db.user.upsert({
		create: {
			displayName: "Demo Owner",
			email: "owner@example.test",
			memberships: {
				create: {
					business: {
						create: {
							category: "service",
							name: "Demo Business",
							slug: "demo-business",
						},
					},
					role: "OWNER",
					status: "ACTIVE",
				},
			},
		},
		include: { memberships: { include: { business: true } } },
		update: { displayName: "Demo Owner" },
		where: { email: "owner@example.test" },
	});

	console.info(
		`Seeded ${owner.email} with ${owner.memberships.length} business membership(s)`
	);
};

void seed()
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
