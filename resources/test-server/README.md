# Test Server

MSW + Fastify mock server for multi-language testing.

## Quick Start

```bash
# Local
npm install
npm start

# Docker
docker build -t test-server .
docker run -p 3000:3000 test-server
```

## Handler Architecture

The server uses a 3-layer handler architecture with priority ordering:

### Layer 1: Custom Handlers (Highest Priority)
Custom overrides in `src/handlers/custom/`. These handlers take precedence over all others.

```typescript
// src/handlers/custom/health.ts
import { http, HttpResponse } from 'msw';

export const healthHandlers = [
  http.get('http://mock/health', () => {
    return HttpResponse.json({ status: 'ok' }, { status: 200 });
  }),
];
```

### Layer 2: HAR Recordings (Medium Priority)
HAR files in `recordings/` directory. Add HAR files and uncomment the handler import in `src/handlers.ts`.

### Layer 3: OpenAPI Baseline (Fallback)
Auto-generated from `algod.oas3.json` OpenAPI spec using `@mswjs/source`. Provides schema-compliant default responses.

Server listens on port 3000 (configurable via `PORT` env var).