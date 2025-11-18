import { Polly, type PollyConfig } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import path from "path";

Polly.register(FSPersister);
Polly.register(FetchAdapter);

export type Client = "algod" | "kmd" | "indexer";

export function getPolly(
  client: Client,
  config: {
    mode: "record-new" | "record-overwrite" | "replay";
    recordingsDir?: string;
  }
) {
  const pollyConfig: PollyConfig = {
    adapters: ["fetch"],
    persister: "fs",
    persisterOptions: {
      fs: {
        recordingsDir:
          config.recordingsDir ?? path.resolve(__dirname, "../recordings")
      }
    },
    matchRequestsBy: {
      method: true,
      url: true, // includes query params
      headers: true,
      body: true,
      order: false
    }
  };

  if (config.mode === "record-new") {
    pollyConfig.mode = "replay";
    pollyConfig.recordIfMissing = true;
  } else if (config.mode === "record-overwrite") {
    pollyConfig.mode = "record";
  } else if (config.mode === "replay") {
    pollyConfig.mode = "replay";
    pollyConfig.recordIfMissing = false;
  } else {
    throw new Error(`Unknown mode: ${config.mode}`);
  }

  const polly = new Polly(client, pollyConfig);

  const headersToRemove = [
    "transfer-encoding", // Conflicts with content-length header during replay
    "content-encoding", // HAR stores decompressed body but header indicates compression (e.g. gzip), causing decompression errors
    "content-length" // Let the server calculate the correct content-length for the response
  ];
  polly.server.any().on("beforeReplay", (_req, rec) => {
    rec.response.headers = rec.response.headers.filter(
      (h: any) => !headersToRemove.includes(h.name.toLowerCase())
    );
  });

  // Decode base64-encoded msgpack responses from HAR files
  polly.server.any().on("beforeResponse", (_req, res) => {
    console.log("beforeResponse triggered");
    console.log("Content-Type:", res.headers["content-type"]);
    console.log("Body type:", typeof res.body);
    console.log(
      "Body (first 50 chars):",
      typeof res.body === "string" ? res.body.substring(0, 50) : "NOT A STRING"
    );

    // Base64 decode attempt
    if (
      res.body &&
      typeof res.body === "string" &&
      res.headers["content-type"]?.includes("msgpack")
    ) {
      console.log("Attempting base64 decode...");
      const buffer = Buffer.from(res.body, "base64");
      res.body = new Uint8Array(buffer) as any;
      console.log("Decoded body type:", res.body?.constructor.name);
    }
  });

  return polly;
}

export async function record(
  client: Client,
  makeRequests: () => Promise<void>,
  mode: "record-new" | "record-overwrite" = "record-new",
  recordingsDir?: string
) {
  const polly = getPolly(client, { mode, recordingsDir });
  try {
    await makeRequests();
  } finally {
    await polly.stop();
  }
}

export async function replay<T>(
  client: Client,
  makeRequests: () => Promise<T>,
  recordingsDir?: string
): Promise<T> {
  const polly = getPolly(client, { mode: "replay", recordingsDir });

  try {
    return await makeRequests();
  } finally {
    await polly.stop();
  }
}
