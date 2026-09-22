import type {
  DeploySiteRequest,
  DeploySiteResponse,
  GenerateSiteRequest,
  GenerateSiteResponse,
} from "@where-they-are/contracts";

export type ServerClientOptions = {
  baseUrl: string;
  fetcher?: typeof fetch;
};

export class ServerClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  public constructor(options: ServerClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetcher = options.fetcher ?? fetch;
  }

  public async generateSite(request: GenerateSiteRequest): Promise<GenerateSiteResponse> {
    return this.post<GenerateSiteResponse>("/api/sites/generate", request);
  }

  public async deploySite(request: DeploySiteRequest): Promise<DeploySiteResponse> {
    return this.post<DeploySiteResponse>("/api/deployments", request);
  }

  public previewUrl(previewSlug: string): string {
    return `${this.baseUrl}/api/previews/${encodeURIComponent(previewSlug)}`;
  }

  public async getHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    return this.get<{ status: string; service: string; timestamp: string }>("/api/health");
  }

  public async getPreviewHtml(previewSlug: string): Promise<string> {
    const response = await this.fetcher(this.previewUrl(previewSlug), {
      headers: { accept: "text/html" },
    });

    if (!response.ok) {
      throw new Error(`Preview request failed with status ${response.status}`);
    }

    return response.text();
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Server request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Server request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
