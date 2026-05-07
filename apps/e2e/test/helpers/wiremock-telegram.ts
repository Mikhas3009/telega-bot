import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { type AddressInfo } from 'node:net';

export interface RecordedTelegramCall {
  method: string;
  path: string;
  body: unknown;
}

export interface FakeTelegram {
  url: string;
  calls: RecordedTelegramCall[];
  stop(): Promise<void>;
  enqueueSendMessageResponse(opts: { status: number; body: unknown }): void;
}

export const startFakeTelegram = (): Promise<FakeTelegram> =>
  new Promise((resolve) => {
    const calls: RecordedTelegramCall[] = [];
    const sendMessageQueue: { status: number; body: unknown }[] = [];

    const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let body: unknown = raw;
        if (raw.length > 0) {
          try {
            body = JSON.parse(raw) as unknown;
          } catch {
            body = raw;
          }
        }
        const path = req.url ?? '';
        const method = req.method ?? 'GET';
        calls.push({ method, path, body });

        if (path.endsWith('/getMe')) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, result: { id: 1, is_bot: true, username: 'fake' } }));
          return;
        }

        if (path.endsWith('/sendMessage')) {
          const override = sendMessageQueue.shift();
          const r = override ?? { status: 200, body: { ok: true, result: { message_id: 1 } } };
          res.statusCode = r.status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(r.body));
          return;
        }

        res.statusCode = 404;
        res.end();
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${String(addr.port)}`,
        calls,
        stop: () =>
          new Promise<void>((stopResolve) =>
            server.close(() => {
              stopResolve();
            }),
          ),
        enqueueSendMessageResponse: (opts) => {
          sendMessageQueue.push(opts);
        },
      });
    });
  });
