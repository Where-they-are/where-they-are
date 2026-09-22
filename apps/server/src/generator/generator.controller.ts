import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ZodError } from "zod";

import { GeneratorService } from "./generator.service.js";

@Controller("sites")
export class GeneratorController {
  public constructor(private readonly generatorService: GeneratorService) {}

  @Post("generate")
  public async generate(@Body() body: unknown) {
    try {
      return await this.generatorService.generate(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({ message: "Invalid site generation request", issues: error.issues });
      }

      throw error;
    }
  }
}
