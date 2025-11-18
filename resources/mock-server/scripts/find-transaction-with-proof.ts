/**
 * Find transactions with valid proofs on Algorand testnet
 *
 * This script searches for blocks with transactions and validates that
 * transaction proofs can be retrieved for them.
 *
 * Usage:
 *   npx tsx scripts/find-transaction-with-proof.ts [startBlock|latest] [numBlocks]
 *
 * Examples:
 *   npx tsx scripts/find-transaction-with-proof.ts              # Check last 100 blocks
 *   npx tsx scripts/find-transaction-with-proof.ts latest 200   # Check last 200 blocks from latest
 *   npx tsx scripts/find-transaction-with-proof.ts 57610500 50  # Check 50 blocks from 57610500
 */

import algosdk from "algosdk";

const ALGOD_TOKEN = "a".repeat(64);
const ALGOD_SERVER = "https://testnet-api.4160.nodely.dev";
const ALGOD_PORT = "";

async function findTransactionWithProof(
  startBlock?: number,
  numBlocksToCheck: number = 100
) {
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  // Get current status to find the latest block
  const status = await algod.status().do();
  const latestRound = Number(status.lastRound);

  const start = startBlock || latestRound;
  const validProofs: Array<{ round: number; txid: string }> = [];

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
      // Get transaction IDs in this block
      const txidsResponse = await algod.getBlockTxids(round).do();
      const txids = txidsResponse.blocktxids || [];

      if (txids.length === 0) {
        process.stdout.write(".");
        continue;
      }

      console.log(`\n✓ Block ${round} has ${txids.length} transaction(s)`);

      // Try to get proof for the first transaction
      const firstTxid = txids[0];

      try {
        const proof = await algod.getTransactionProof(round, firstTxid).do();

        console.log(`  ✓ Transaction proof available for ${firstTxid}`);
        console.log(`    Proof type: ${proof.proof?.type || "unknown"}`);
        console.log(
          `    Has stibhash: ${proof.proof?.stibhash ? "yes" : "no"}`
        );

        validProofs.push({
          round,
          txid: firstTxid
        });

        // Found at least one, but continue to find more examples
        if (validProofs.length >= 3) {
          console.log(
            `\n✓ Found ${validProofs.length} valid proofs, stopping search.`
          );
          break;
        }
      } catch (error: any) {
        console.log(
          `  ✗ Proof not available for ${firstTxid}: ${error.message}`
        );
      }
    } catch (error: any) {
      console.log(`\n✗ Block ${round}: Error - ${error.message}`);
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Checked ${numBlocksToCheck} blocks`);
  console.log(`Found ${validProofs.length} transaction(s) with proofs\n`);

  if (validProofs.length > 0) {
    console.log(`Valid transaction proofs found:`);
    validProofs.forEach((p) => {
      console.log(`  - Round ${p.round}, TxID: ${p.txid}`);
    });

    console.log(`\nCode snippet for record.ts:\n`);
    const first = validProofs[0];
    console.log(`const round = ${first.round};`);
    console.log(`const txId = "${first.txid}";`);
    console.log(
      `const proof = await algod.getTransactionProof(round, txId).do();`
    );
  } else {
    console.log(`No transaction proofs found in the searched blocks.`);
    console.log(
      `\nNote: Transaction proofs might not be available for all blocks.`
    );
    console.log(`Try searching more recent blocks or a larger range.`);
  }

  return validProofs;
}

// Run the script
const startBlock =
  process.argv[2] && process.argv[2] !== "latest"
    ? parseInt(process.argv[2])
    : undefined;
const numBlocks = process.argv[3] ? parseInt(process.argv[3]) : 100;

findTransactionWithProof(startBlock, numBlocks)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
