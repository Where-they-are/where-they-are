const workerPort = Number(process.env.JOBS_WORKER_PORT ?? 3102);

const startWorker = (): void => {
  console.info(`Jobs worker ready on port ${workerPort}`);
  console.info("Generation, deployment, reminder, and cleanup queues can be registered here.");
};

startWorker();
