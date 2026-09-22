const workerPort = Number(process.env.WHATSAPP_WORKER_PORT ?? 3101);

const startWorker = (): void => {
  console.info(`WhatsApp worker ready on port ${workerPort}`);
  console.info("Messaging provider boundary is ready for whatsapp-web.js integration.");
};

startWorker();
