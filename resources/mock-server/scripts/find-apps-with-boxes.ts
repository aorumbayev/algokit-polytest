/**
 * Find applications with boxes on Algorand testnet
 *
 * Usage:
 *   npx tsx scripts/find-apps-with-boxes.ts [batch] [batchSize]
 *
 * Examples:
 *   npx tsx scripts/find-apps-with-boxes.ts           # Search first 50 apps (batch 1)
 *   npx tsx scripts/find-apps-with-boxes.ts 2         # Search next 50 apps (batch 2)
 *   npx tsx scripts/find-apps-with-boxes.ts 3 100     # Search apps 201-300 (batch 3, size 100)
 */

import { Algodv2, Indexer } from "algosdk";

async function findAppsWithBoxes(batch: number = 1, batchSize: number = 50) {
  const algod = new Algodv2(
    "a".repeat(64),
    "https://testnet-api.4160.nodely.dev",
    443
  );

  const indexer = new Indexer(
    "a".repeat(64),
    "https://testnet-idx.4160.nodely.dev",
    443
  );

  const startApp = (batch - 1) * batchSize + 1;
  const endApp = batch * batchSize;

  console.log(`Searching batch ${batch} (apps ${startApp}-${endApp})...\n`);

  // Paginate through applications using next-token
  let appsResponse;
  let nextToken: string | undefined;

  // Fetch batches until we reach the desired batch
  for (let i = 0; i < batch; i++) {
    const searchReq = indexer.searchForApplications().limit(batchSize);

    if (nextToken) {
      searchReq.nextToken(nextToken);
    }

    appsResponse = await searchReq.do();
    nextToken = appsResponse.nextToken;

    // If we've run out of apps, stop
    if (i < batch - 1 && !nextToken) {
      console.log(`No more applications available (stopped at batch ${i + 1})`);
      return;
    }
  }

  const applications = appsResponse?.applications || [];

  if (applications.length === 0) {
    console.log(`No applications found in batch ${batch}\n`);
    return;
  }

  console.log(`Found ${applications.length} applications in this batch\n`);

  const appsWithBoxes = [];

  // Check each application for boxes
  for (const app of applications) {
    const appId = app.id;

    try {
      const boxesResponse = await algod.getApplicationBoxes(appId).do();

      if (boxesResponse.boxes && boxesResponse.boxes.length > 0) {
        const firstBox = boxesResponse.boxes[0];
        if (!firstBox) continue;

        const boxNameBuffer = Buffer.from(firstBox.name as any, "base64");

        console.log(`✓ App ${appId} has ${boxesResponse.boxes.length} box(es)`);
        console.log(`  First box: "${boxNameBuffer.toString("utf8")}"`);

        appsWithBoxes.push({
          appId,
          boxName: boxNameBuffer,
          boxCount: boxesResponse.boxes.length,
        });
      }
    } catch (error: any) {
      // Skip apps without boxes
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Print summary
  console.log(`\n=== Summary ===`);
  console.log(`Checked ${applications.length} apps in batch ${batch}`);
  console.log(`Found ${appsWithBoxes.length} apps with boxes\n`);

  if (appsWithBoxes.length > 0) {
    console.log(`Code snippet for record.ts:\n`);
    const first = appsWithBoxes[0];
    if (first) {
      console.log(`const appId = ${first.appId}; // ${first.boxCount} box(es)`);
      console.log(`const boxName = Buffer.from("${first.boxName.toString("hex")}", "hex");`);
      console.log(`const boxResponse = await algod.getApplicationBoxByName(appId, boxName).do();`);
      console.log(`const boxesResponse = await algod.getApplicationBoxes(appId).do();`);
    }
  } else {
    console.log(`Try next batch: npx tsx scripts/find-apps-with-boxes.ts ${batch + 1}`);
  }
}

// Run the script
const batch = process.argv[2] ? parseInt(process.argv[2]) : 1;
const batchSize = process.argv[3] ? parseInt(process.argv[3]) : 50;

findAppsWithBoxes(batch, batchSize)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });