const coolifyBaseUrl = process.env.COOLIFY_API_URL;
const coolifyToken = process.env.COOLIFY_API_TOKEN;
const resourceUuid = process.env.COOLIFY_SITE_RESOURCE_UUID;
const writeMode = process.argv.includes("--write");
const coolifyChecksEnabled = process.env.COOLIFY_CHECKS_ENABLED === "true";

const run = async (): Promise<void> => {
  if (!coolifyChecksEnabled) {
    console.info(JSON.stringify({
      status: "skipped",
      reason: "Coolify checks are disabled. Set COOLIFY_CHECKS_ENABLED=true to opt in.",
    }, null, 2));
    return;
  }

  if (!coolifyBaseUrl || !coolifyToken) {
    throw new Error("COOLIFY_API_URL and COOLIFY_API_TOKEN are required");
  }

  const healthResponse = await fetch(new URL("/api/v1/health", coolifyBaseUrl), {
    headers: { Authorization: `Bearer ${coolifyToken}`, accept: "application/json" },
  });
  if (!healthResponse.ok) {
    throw new Error(`Coolify health check failed with ${healthResponse.status}`);
  }

  const result: Record<string, unknown> = {
    status: "health-passed",
    coolifyBaseUrl,
    writeMode,
  };

  if (writeMode) {
    if (!resourceUuid) {
      throw new Error("COOLIFY_SITE_RESOURCE_UUID is required with --write");
    }

    const deploymentResponse = await fetch(
      `${new URL("/api/v1/deploy", coolifyBaseUrl)}?uuid=${encodeURIComponent(resourceUuid)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${coolifyToken}`, accept: "application/json" },
      },
    );
    const deploymentBody = await deploymentResponse.text();
    if (!deploymentResponse.ok) {
      throw new Error(`Coolify deployment smoke failed with ${deploymentResponse.status}: ${deploymentBody}`);
    }

    result.deployment = JSON.parse(deploymentBody) as unknown;
  }

  console.info(JSON.stringify(result, null, 2));
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
