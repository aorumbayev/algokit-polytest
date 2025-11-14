FROM oven/bun:1

COPY . . 
RUN bun install --frozen-lock-file

ENTRYPOINT ["bun", "bin/server.ts"]
