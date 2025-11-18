/**
 * Find transaction group IDs with state deltas on Algorand testnet
 *
 * This script searches for transaction groups and validates that their
 * state deltas can be retrieved using getLedgerStateDeltaForTransactionGroup.
 *
 * Usage:
 *   npx tsx scripts/find-transaction-group-id.ts [startBlock|latest] [numBlocks]
 *
 * Examples:
 *   npx tsx scripts/find-transaction-group-id.ts              # Check last 100 blocks
 *   npx tsx scripts/find-transaction-group-id.ts latest 200   # Check last 200 blocks from latest
 *   npx tsx scripts/find-transaction-group-id.ts 57610500 50  # Check 50 blocks from 57610500
 */

import algosdk from "algosdk";

const ALGOD_TOKEN = "a".repeat(64);
const ALGOD_SERVER = "https://testnet-api.4160.nodely.dev";
const ALGOD_PORT = "";

async function findTransactionGroupId(
  startBlock?: number,
  numBlocksToCheck: number = 100
) {
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  // Get current status to find the latest block
  const status = await algod.status().do();
  const latestRound = Number(status.lastRound);

  const start = startBlock || latestRound;
  const validGroupIds = new Set<string>();
  const groupIdDetails: Array<{
    groupId: string;
    round: number;
    txCount: number;
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
      // Get the full block to access transactions
      const blockResponse = await algod.block(round).do();
      const block = blockResponse.block;

      // Check if block has transactions (payset is the array of signed transactions)
      if (!block || !block.payset || block.payset.length === 0) {
        process.stdout.write(".");
        continue;
      }

      // Look for transactions with group IDs
      for (const signedTxnInBlock of block.payset) {
        // Check if transaction has a group ID
        const groupId = signedTxnInBlock.signedTxn.signedTxn.txn.group;

        if (!groupId) {
          continue;
        }

        // Convert group ID to base64 string for the API
        const groupIdB64 =
          typeof groupId === "string"
            ? groupId
            : Buffer.from(groupId).toString("base64");

        if (!validGroupIds.has(groupIdB64)) {
          try {
            // Validate by calling the actual endpoint
            const deltaResponse = await algod
              .getLedgerStateDeltaForTransactionGroup(groupIdB64)
              .do();

            console.log(`\n✓ Block ${round} has valid transaction group`);
            console.log(`  Group ID (base64): ${groupIdB64}`);
            console.log(
              `  Delta exists: ${
                deltaResponse && Object.keys(deltaResponse).length > 0
                  ? "yes"
                  : "no"
              }`
            );

            validGroupIds.add(groupIdB64);
            groupIdDetails.push({
              groupId: groupIdB64,
              round,
              txCount: block.payset.filter((signedTxn) => {
                const grp = signedTxn.signedTxn.signedTxn.txn.group;
                return (
                  grp &&
                  (typeof grp === "string"
                    ? grp
                    : Buffer.from(grp).toString("base64")) === groupIdB64
                );
              }).length
            });

            // Found enough examples
            if (validGroupIds.size >= 3) {
              console.log(
                `\n✓ Found ${validGroupIds.size} valid group IDs, stopping search.`
              );
              break;
            }
          } catch (error: any) {
            // Group might not have state deltas or endpoint might not support it
            process.stdout.write("x");
          }
        }
      }

      if (validGroupIds.size >= 3) {
        break;
      }
    } catch (error: any) {
      process.stdout.write("!");
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Checked up to ${numBlocksToCheck} blocks`);
  console.log(`Found ${validGroupIds.size} valid transaction group ID(s)\n`);

  if (groupIdDetails.length > 0) {
    console.log(`Valid transaction groups:`);
    groupIdDetails.forEach((g) => {
      console.log(
        `  - Group ID: ${g.groupId.substring(0, 20)}... (Round ${g.round}, ${
          g.txCount
        } txns)`
      );
    });

    console.log(`\nCode snippet for record.ts:\n`);
    const first = groupIdDetails[0]!;
    console.log(`// GET /v2/deltas/txn/group/{id}`);
    console.log(`const groupId = "${first.groupId}";`);
    console.log(
      `await algod.getLedgerStateDeltaForTransactionGroup(groupId).do();`
    );
  } else {
    console.log(`No valid transaction group IDs found in the searched blocks.`);
    console.log(
      `\nNote: Transaction groups with state deltas are relatively rare.`
    );
    console.log(`Try searching more blocks or a different range.`);
  }

  return groupIdDetails;
}

// Run the script
const startBlock =
  process.argv[2] && process.argv[2] !== "latest"
    ? parseInt(process.argv[2])
    : undefined;
const numBlocks = process.argv[3] ? parseInt(process.argv[3]) : 100;

findTransactionGroupId(startBlock, numBlocks)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
