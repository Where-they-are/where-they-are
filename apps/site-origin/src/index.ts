import { createServer } from "node:http";

import { ServerClient } from "@where-they-are/server-client";

import { siteOriginConfig } from "./config.js";

const serverClient = new ServerClient({ baseUrl: siteOriginConfig.serverBaseUrl });

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const previewPrefix = "/preview/";

  if (requestUrl.pathname.startsWith(previewPrefix)) {
    const previewSlug = decodeURIComponent(requestUrl.pathname.slice(previewPrefix.length));

    try {
      const html = await serverClient.getPreviewHtml(previewSlug);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex, nofollow",
      });
      response.end(html);
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Preview not found");
    }

    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end("<main><h1>Where They Are site origin</h1></main>");
});

server.listen(siteOriginConfig.port, () => {
  console.info(`Tenant site origin listening on port ${siteOriginConfig.port}`);
});
