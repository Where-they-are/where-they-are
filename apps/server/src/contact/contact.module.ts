import { Module } from "@nestjs/common";

import { ContactController } from "./contact.controller.js";
import { ContactService } from "./contact.service.js";
import { PublicContactController } from "./public-contact.controller.js";

@Module({
	controllers: [ContactController, PublicContactController],
	providers: [ContactService],
})
export class ContactModule {}
