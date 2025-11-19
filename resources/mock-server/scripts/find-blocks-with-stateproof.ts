/**
 * Find blocks with valid state proofs on Algorand testnet
 *
 * Usage:
 *   npx tsx scripts/find-blocks-with-stateproof.ts [startBlock|latest] [numBlocks]
 *
 * Examples:
 *   npx tsx scripts/find-blocks-with-stateproof.ts              # Check last 100 blocks
 *   npx tsx scripts/find-blocks-with-stateproof.ts latest 200   # Check last 200 blocks from latest
 *   npx tsx scripts/find-blocks-with-stateproof.ts 57610500 50  # Check 50 blocks from 57610500
 */

import algosdk from "algosdk";

const ALGOD_TOKEN =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ALGOD_SERVER = "https://mainnet-api.4160.nodely.dev";
const ALGOD_PORT = "";

async function findBlocksWithStateProof(
  startBlock?: number,
  numBlocksToCheck: number = 100
) {
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  // Get current status to find the latest block
  const status = await algod.status().do();
  const latestRound = Number(status.lastRound);

  const start = startBlock || latestRound;
  const blocksWithProof: number[] = [];

  console.log(`Latest round: ${latestRound}`);
  console.log(
    `Checking blocks from ${start} backwards for ${numBlocksToCheck} blocks...\n`
  );

  for (
    let round = start;
    round > start - numBlocksToCheck && round > 0;
    round--
  ) {
    try {
      // Try to get state proof for this round
      const response = await fetch(`${ALGOD_SERVER}/v2/stateproofs/${round}`, {
        headers: {
          "X-Algo-API-Token": ALGOD_TOKEN
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Block ${round} has a state proof`);
        blocksWithProof.push(round);
      } else {
        const error = await response.json();
        console.log(`✗ Block ${round}: ${error.message || "No state proof"}`);
      }
    } catch (error) {
      console.log(`✗ Block ${round}: Error - ${error}`);
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Checked ${numBlocksToCheck} blocks`);
  console.log(`Found ${blocksWithProof.length} blocks with state proofs:`);
  console.log(blocksWithProof);

  return blocksWithProof;
}

// Run the script
const startBlock =
  process.argv[2] && process.argv[2] !== "latest"
    ? parseInt(process.argv[2])
    : undefined;
const numBlocks = process.argv[3] ? parseInt(process.argv[3]) : 100;

findBlocksWithStateProof(startBlock, numBlocks)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
