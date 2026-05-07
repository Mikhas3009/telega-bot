export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface HttpClient {
  request(req: HttpRequest): Promise<HttpResponse>;
}

export class FakeHttpClient implements HttpClient {
  public readonly requests: HttpRequest[] = [];
  private queue: HttpResponse[] = [];

  enqueue(response: HttpResponse): void {
    this.queue.push(response);
  }

  request(req: HttpRequest): Promise<HttpResponse> {
    this.requests.push(req);
    const next = this.queue.shift();
    if (!next) return Promise.reject(new Error('FakeHttpClient: no enqueued response for request'));
    return Promise.resolve(next);
  }

  reset(): void {
    this.requests.length = 0;
    this.queue = [];
  }
}
