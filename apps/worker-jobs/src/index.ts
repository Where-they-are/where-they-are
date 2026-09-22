import { checkServerHealth } from "./server.js";

const workerPort = Number(process.env.JOBS_WORKER_PORT ?? 3102);

const startWorker = async (): Promise<void> => {
  console.info(`Jobs worker ready on port ${workerPort}`);
  console.info("Generation, deployment, reminder, and cleanup queues can be registered here.");

  try {
    const health = await checkServerHealth();
    console.info(`Connected to ${health.service} at ${health.timestamp}`);
  } catch (error) {
    console.warn("Central server is not reachable yet; jobs will retry when queues run.", error);
  }
};

void startWorker();
