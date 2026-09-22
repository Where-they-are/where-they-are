import { createServer } from "node:http";

const port = Number(process.env.SITE_ORIGIN_PORT ?? 3103);

const server = createServer((request, response) => {
  const host = request.headers.host ?? "unknown-tenant";
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(`<main><h1>Tenant site origin</h1><p>Host: ${host}</p></main>`);
});

server.listen(port, () => {
  console.info(`Tenant site origin listening on port ${port}`);
});
