/**
 * Find pending transactions on Algorand testnet
 *
 * This script monitors the pending transaction pool to find valid txids
 * that can be used to test algod.pendingTransactionInformation(txId)
 *
 * Usage:
 *   npx tsx scripts/find-pending-transactions.ts [pollDuration] [pollInterval]
 *
 * Examples:
 *   npx tsx scripts/find-pending-transactions.ts           # Poll for 60 seconds
 *   npx tsx scripts/find-pending-transactions.ts 120       # Poll for 120 seconds
 *   npx tsx scripts/find-pending-transactions.ts 60 500    # Poll for 60s, check every 500ms
 */

import algosdk, { Algodv2 } from "algosdk";

const ALGOD_TOKEN = "a".repeat(64);
const ALGOD_SERVER = "https://testnet-api.4160.nodely.dev";
const ALGOD_PORT = "";

async function findPendingTransactions(
  pollDuration: number = 60,
  pollInterval: number = 1000
) {
  const algod = new Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  console.log(
    `Monitoring pending transaction pool for ${pollDuration} seconds...`
  );
  console.log(`Checking every ${pollInterval}ms\n`);

  const foundTxIds = new Set<string>();
  const validatedTxIds: Array<{
    txId: string;
    sender: string;
    type: string;
  }> = [];

  const startTime = Date.now();
  const endTime = startTime + pollDuration * 1000;

  while (Date.now() < endTime) {
    try {
      // Get all pending transactions
      const pendingTxns = await algod.pendingTransactionsInformation().do();

      if (
        pendingTxns["topTransactions"] &&
        pendingTxns["topTransactions"].length > 0
      ) {
        console.log(
          `Found ${pendingTxns["topTransactions"].length} pending transaction(s)`
        );

        for (const txn of pendingTxns["topTransactions"]) {
          const txId = txn.txn.txn?.txID || txn.txn?.txid;

          if (txId && !foundTxIds.has(txId)) {
            foundTxIds.add(txId);

            // Try to get detailed info about this specific pending transaction
            try {
              const pendingInfo = await algod
                .pendingTransactionInformation(txId)
                .do();

              const sender = txn.txn.txn?.snd
                ? algosdk.encodeAddress(Buffer.from(txn.txn.txn.snd, "base64"))
                : "unknown";
              const type = txn.txn.txn?.type || "unknown";

              console.log(`✓ Valid pending transaction found!`);
              console.log(`  TxID: ${txId}`);
              console.log(`  Sender: ${sender}`);
              console.log(`  Type: ${type}`);
              console.log(
                `  Pool error: ${pendingInfo["pool-error"] || "none"}`
              );
              console.log();

              validatedTxIds.push({
                txId,
                sender,
                type
              });
            } catch (error: any) {
              console.log(
                `✗ TxID ${txId} found in pool but failed individual query: ${error.message}`
              );
            }
          }
        }
      } else {
        process.stdout.write(".");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error: any) {
      console.error(`Error polling pending transactions: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Polling duration: ${pollDuration} seconds`);
  console.log(`Found ${validatedTxIds.length} valid pending transaction(s)\n`);

  if (validatedTxIds.length > 0) {
    console.log(`Code snippet for record.ts:\n`);
    const first = validatedTxIds[0];
    console.log(`// GET /v2/transactions/pending/{txid}`);
    console.log(
      `const txId = "${first.txId}"; // ${first.type} from ${first.sender.slice(
        0,
        10
      )}...`
    );
    console.log(
      `const pending = await algod.pendingTransactionInformation(txId).do();`
    );
  } else {
    console.log(`No pending transactions found during this polling period.`);
    console.log(`Tips to increase chances of finding pending transactions:`);
    console.log(`  1. Increase poll duration (first argument)`);
    console.log(`  2. Run during peak testnet activity`);
    console.log(`  3. Consider submitting your own test transaction`);
  }
}

// Parse command line arguments
const pollDuration = process.argv[2] ? parseInt(process.argv[2]) : 60;
const pollInterval = process.argv[3] ? parseInt(process.argv[3]) : 1000;

findPendingTransactions(pollDuration, pollInterval)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
