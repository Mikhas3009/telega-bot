import { buildAsyncApiDocument } from '@app/contracts';
import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('asyncapi')
export class AsyncApiController {
  @Get('json')
  @Header('Content-Type', 'application/json')
  json() {
    return buildAsyncApiDocument({
      title: 'Event-Driven Microservices',
      version: '1.0.0',
      description: 'AsyncAPI 3.0 spec generated from @app/contracts EventRegistry.',
    });
  }

  @Get()
  @Header('Content-Type', 'text/html')
  html(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>AsyncAPI · Event-Driven Microservices</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@asyncapi/react-component@2/styles/default.min.css" />
  </head>
  <body>
    <div id="asyncapi"></div>
    <script src="https://cdn.jsdelivr.net/npm/@asyncapi/react-component@2/browser/standalone/index.js"></script>
    <script>
      fetch('/asyncapi/json').then((r) => r.json()).then((schema) => {
        AsyncApiStandalone.render({
          schema,
          config: { show: { sidebar: true, info: true, channels: true } },
        }, document.getElementById('asyncapi'));
      });
    </script>
  </body>
</html>`;
  }
}
