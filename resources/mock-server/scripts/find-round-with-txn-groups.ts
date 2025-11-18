/**
 * Find rounds with transaction groups that have state deltas on Algorand testnet
 *
 * This script searches for blocks where transaction groups caused state changes,
 * which can be used to test getTransactionGroupLedgerStateDeltasForRound.
 *
 * Usage:
 *   npx tsx scripts/find-round-with-txn-groups.ts [startBlock|latest] [numBlocks]
 *
 * Examples:
 *   npx tsx scripts/find-round-with-txn-groups.ts              # Check last 100 blocks
 *   npx tsx scripts/find-round-with-txn-groups.ts latest 200   # Check last 200 blocks from latest
 *   npx tsx scripts/find-round-with-txn-groups.ts 57610500 50  # Check 50 blocks from 57610500
 */

import algosdk from "algosdk";

const ALGOD_TOKEN = "a".repeat(64);
const ALGOD_SERVER = "https://testnet-api.4160.nodely.dev";
const ALGOD_PORT = "";

async function findRoundWithTxnGroups(
  startBlock?: number,
  numBlocksToCheck: number = 100
) {
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  // Get current status to find the latest block
  const status = await algod.status().do();
  const latestRound = Number(status.lastRound);

  const start = startBlock || latestRound;
  const validRounds: Array<{
    round: number;
    deltaCount: number;
    hasDeltas: boolean;
  }> = [];

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
      // Try to get transaction group deltas for this round
      const response = await algod
        .getTransactionGroupLedgerStateDeltasForRound(round)
        .do();

      // Check if there are any deltas
      const deltas = response.deltas || [];
      const hasDeltas = deltas.length > 0;

      if (hasDeltas) {
        console.log(
          `✓ Block ${round} has transaction group deltas (${deltas.length} delta(s))`
        );

        validRounds.push({
          round,
          deltaCount: deltas.length,
          hasDeltas: true
        });

        // Found at least one, but continue to find more examples
        if (validRounds.length >= 5) {
          console.log(
            `\n✓ Found ${validRounds.length} valid rounds, stopping search.`
          );
          break;
        }
      } else {
        process.stdout.write(".");
      }
    } catch (error: any) {
      // If the endpoint returns an error, the round might not have transaction groups
      process.stdout.write(".");
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Checked ${numBlocksToCheck} blocks`);
  console.log(
    `Found ${validRounds.length} round(s) with transaction group deltas\n`
  );

  if (validRounds.length > 0) {
    console.log(`Valid rounds with transaction group deltas:`);
    validRounds.forEach((r) => {
      console.log(`  - Round ${r.round}: ${r.deltaCount} delta(s)`);
    });

    console.log(`\nCode snippet for record.ts:\n`);
    const first = validRounds[0];
    console.log(`// GET /v2/deltas/{round}/txn/group`);
    console.log(`const roundWithTxnGroup = ${first?.round};`);
    console.log(
      `await algod.getTransactionGroupLedgerStateDeltasForRound(roundWithTxnGroup).do();`
    );
  } else {
    console.log(`No transaction group deltas found in the searched blocks.`);
    console.log(
      `\nNote: Transaction group deltas only exist for blocks with grouped transactions that cause state changes.`
    );
    console.log(`Try searching more recent blocks or a larger range.`);
  }

  return validRounds;
}

// Run the script
const startBlock =
  process.argv[2] && process.argv[2] !== "latest"
    ? parseInt(process.argv[2])
    : undefined;
const numBlocks = process.argv[3] ? parseInt(process.argv[3]) : 100;

findRoundWithTxnGroups(startBlock, numBlocks)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
