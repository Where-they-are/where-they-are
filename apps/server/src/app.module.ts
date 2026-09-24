import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module.js";
import { BillingModule } from "./billing/billing.module.js";
import { BusinessesModule } from "./businesses/businesses.module.js";
import { ContactModule } from "./contact/contact.module.js";
import { DeploymentModule } from "./deployment/deployment.module.js";
import { DomainsModule } from "./domains/domains.module.js";
import { FeedbackModule } from "./feedback/feedback.module.js";
import { GeneratorModule } from "./generator/generator.module.js";
import { HealthController } from "./health/health.controller.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { PublicationModule } from "./publication/publication.module.js";
import { SitesModule } from "./sites/sites.module.js";

@Module({
	controllers: [HealthController],
	imports: [
		AuthModule,
		BillingModule,
		BusinessesModule,
		ContactModule,
		DeploymentModule,
		DomainsModule,
		FeedbackModule,
		GeneratorModule,
		PaymentsModule,
		PublicationModule,
		SitesModule,
	],
})
export class AppModule {}
