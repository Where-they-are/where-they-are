import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ZodError } from "zod";

import { DeploymentService } from "./deployment.service.js";

@Controller("deployments")
export class DeploymentController {
  public constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  public async deploy(@Body() body: unknown) {
    try {
      return await this.deploymentService.deploy(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({ message: "Invalid deployment request", issues: error.issues });
      }

      throw error;
    }
  }
}
