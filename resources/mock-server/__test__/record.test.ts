import { describe, it, expect, afterEach } from "vitest";
import { record } from "../src/index";
import { Algodv2 } from "algosdk";
import fs from "fs";
import path from "path";

const TEST_RECORDINGS_DIR = path.resolve(__dirname, "../recordings-test");

describe("Recording Tests", () => {
  afterEach(async () => {
    // Clean up test recordings directory completely
    if (fs.existsSync(TEST_RECORDINGS_DIR)) {
      fs.rmSync(TEST_RECORDINGS_DIR, { recursive: true, force: true });
    }
  });

  it("should record in record-new mode", async () => {
    // Create test recordings directory
    fs.mkdirSync(TEST_RECORDINGS_DIR, { recursive: true });

    // Create recording with record-new using TestNet
    await record(
      "algod",
      async () => {
        const algod = new Algodv2(
          "a".repeat(64),
          "https://testnet-api.4160.nodely.dev",
          443
        );
        await algod.status().do();
      },
      "record-new",
      TEST_RECORDINGS_DIR
    );

    // Verify HAR file was created
    const harFiles = fs.readdirSync(TEST_RECORDINGS_DIR, { recursive: true });
    const harFileName = harFiles.find((f) =>
      f.toString().endsWith("recording.har")
    );
    expect(harFileName).toBeDefined();

    const harPath = path.join(TEST_RECORDINGS_DIR, harFileName!.toString());
    expect(fs.existsSync(harPath)).toBe(true);

    // Verify HAR file has entries
    const content = fs.readFileSync(harPath, "utf-8");
    const har = JSON.parse(content);
    expect(har.log.entries.length).toBeGreaterThan(0);
  });
});
