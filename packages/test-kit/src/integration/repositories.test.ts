import {
	addBusinessMember,
	createBusinessWithOwner,
	createSite,
	db,
	findBusinessForMember,
	findSiteForBusiness,
	requireBusinessMember,
	requireBusinessRole,
	TenantAccessError,
} from "@where-they-are/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let ownerId = "";
let staffId = "";
let businessId = "";
let siteId = "";

const databaseEnabled = Boolean(process.env.DATABASE_URL);

describe.runIf(databaseEnabled)("PostgreSQL tenant repositories", () => {
	beforeAll(async () => {
		const ownerResult = await createBusinessWithOwner({
			businessName: `Integration Business ${suffix}`,
			businessSlug: `integration-${suffix}`,
			category: "barber",
			location: "Harare",
			ownerDisplayName: "Integration Owner",
			ownerEmail: `owner-${suffix}@example.test`,
		});

		ownerId = ownerResult.owner.id;
		businessId = ownerResult.business.id;

		const staff = await db.user.create({
			data: {
				displayName: "Integration Staff",
				email: `staff-${suffix}@example.test`,
			},
		});
		staffId = staff.id;
		await addBusinessMember({ businessId, role: "STAFF", userId: staffId });

		const site = await createSite({
			businessId,
			name: "Integration Site",
			slug: `integration-site-${suffix}`,
		});
		siteId = site.id;
	});

	afterAll(async () => {
		if (businessId) {
			await db.business.delete({ where: { id: businessId } });
		}
		if (staffId) {
			await db.user.delete({ where: { id: staffId } }).catch(() => undefined);
		}
		await db.$disconnect();
	});

	it("returns active memberships for the correct tenant", async () => {
		const owner = await requireBusinessMember(businessId, ownerId);
		const staff = await requireBusinessMember(businessId, staffId);

		expect(owner.role).toBe("OWNER");
		expect(staff.role).toBe("STAFF");
		expect((await findBusinessForMember(businessId, ownerId))?.id).toBe(
			businessId
		);
	});

	it("enforces role restrictions", async () => {
		await expect(
			requireBusinessRole(businessId, staffId, ["OWNER"])
		).rejects.toBeInstanceOf(TenantAccessError);
		await expect(
			requireBusinessRole(businessId, ownerId, ["OWNER"])
		).resolves.toBeDefined();
	});

	it("scopes site lookup by business", async () => {
		expect((await findSiteForBusiness(businessId, siteId))?.id).toBe(siteId);
		expect(await findSiteForBusiness("different-business", siteId)).toBeNull();
	});
});
