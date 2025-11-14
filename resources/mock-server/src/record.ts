import { Algodv2, Indexer } from "algosdk";
import { record } from ".";
import { KmdClient } from "algosdk/client/kmd";

async function algosdkAlgodRequests() {
  // TestNet configuration (using AlgoNode public API)
  const algod = new Algodv2(
    "a".repeat(64),
    "https://testnet-api.4160.nodely.dev",
    443
  );

  // ========================================
  // TEST DATA SOURCES:
  // - Rounds from utils-py test_block.py and test_ledger_state_delta.py
  // - Other params from Lora object mothers
  // ========================================

  // From utils-py: Verified TestNet blocks with state proof transactions
  // For simplicity, we use only the first round here
  const round = 24099447;
  // Use to test multiple rounds, loop through the rounds
  // const round2 = 24099347;

  // From Lora: TestNet object mothers
  const address = "25M5BT2DMMED3V6CWDEYKSNEFGPXX4QBIINCOICLXXRU3UGTSGRMF3MTOE";
  const appId = 718348254; // testnet
  const assetId = 705457144;
  const txId = "VIXTUMAPT7NR4RB2WVOGMETW4QY43KIDA3HWDWWXS3UEDKGTEECQ";

  // ============================================
  // NO PARAMETERS NEEDED
  // ============================================

  // GET /v2/status
  await algod.status().do();

  // GET /health
  await algod.healthCheck().do();

  // GET /ready
  await algod.ready().do();

  // GET /genesis
  const genesis = await algod.genesis().do();

  // GET /versions
  const versionsDetails = await algod.versionsCheck().do();

  // ============================================
  // ROUND-BASED ENDPOINTS (using utils-py rounds)
  // ============================================

  // GET /v2/status/wait-for-block-after/{round}
  const statusAfterBlock = await algod.statusAfterBlock(round).do();

  // GET /v2/blocks/{round}
  const block = await algod.block(round).do();

  // GET /v2/blocks/{round}/hash
  const blockHash = await algod.getBlockHash(round).do();

  // GET /v2/blocks/{round}/lightheader/proof
  const lightBlockHeaderProof = await algod
    .getLightBlockHeaderProof(round)
    .do();

  // GET /v2/blocks/{round}/txids
  const txids = await algod.getBlockTxids(round).do();

  // GET /v2/deltas/{round}
  const delta = await algod.getLedgerStateDelta(round).do();

  // GET /v2/deltas/{round}/txn/group
  // TODO: Find valid round
  // const deltas = await algod
  //   .getTransactionGroupLedgerStateDeltasForRound(round2)
  //   .do();

  // GET /v2/stateproofs/{round}
  // TODO: find a valid value. Will likely have to be done with localnet
  // const stateProof = await algod.getStateProof(round).do();

  // GET /v2/blocks/{round}/transactions/{txid}/proof
  // TODO: find valid values
  // const proof = await algod.getTransactionProof(round, txId).do();

  // ============================================
  // ADDRESS-BASED ENDPOINTS (using Lora address)
  // ============================================

  // GET /v2/accounts/{address}
  const accountInfo = await algod.accountInformation(address).do();

  // GET /v2/accounts/{address}/applications/{application-id}
  const accountAppInfo = await algod
    .accountApplicationInformation(address, appId)
    .do();

  // GET /v2/accounts/{address}/assets/{asset-id}
  const accountAssetInfo = await algod
    .accountAssetInformation(address, assetId)
    .do();

  // GET /v2/accounts/{address}/transactions/pending
  const pendingTxnsByAddr = await algod
    .pendingTransactionByAddress(address)
    .do();

  // ============================================
  // APPLICATION ENDPOINTS (using Lora appId)
  // ============================================

  // GET /v2/applications/{application-id}
  const app = await algod.getApplicationByID(appId).do();

  // GET /v2/applications/{application-id}/box
  // TODO: find valid values. need localnet?
  // const boxName = Buffer.from("foo");
  // const boxResponse = await algod.getApplicationBoxByName(appId, boxName).do();

  // GET /v2/applications/{application-id}/boxes
  // TODO: find valid values. need localnet?
  // const boxesResponse = await algod.getApplicationBoxes(appId).do();

  // ============================================
  // ASSET ENDPOINTS (using Lora assetId)
  // ============================================

  // GET /v2/assets/{asset-id}
  const asset = await algod.getAssetByID(assetId).do();

  // ============================================
  // TRANSACTION ENDPOINTS (using Lora txId)
  // ============================================

  // GET /v2/transactions/params
  // Python assertions: genesisId is non-empty, minFee > 0
  const suggestedParams = await algod.getTransactionParams().do();

  // GET /v2/transactions/pending
  const pendingTxns = await algod.pendingTransactionsInformation().do();

  // GET /v2/transactions/pending/{txid}
  // TODO: find valid values
  // const pending = await algod.pendingTransactionInformation(txId).do();

  // ============================================
  // OTHER ENDPOINTS
  // ============================================

  // GET /v2/ledger/supply
  const supplyDetails = await algod.supply().do();

  // GET /v2/ledger/sync
  const currentSyncRound = await algod.getSyncRound().do();

  // ============================================
  // SKIPPED ENDPOINTS
  // ============================================

  // GET /v2/deltas/txn/group/{id}
  // SKIP: No group IDs available in Lora object mothers
  // To implement, find a real testnet group ID and use:
  // const groupId = "REAL_TESTNET_GROUP_ID";
  // const deltaForGroup = await algod.getLedgerStateDeltaForTransactionGroup(groupId).do();

  // GET /v2/devmode/blocks/offset
  // SKIP: DevMode only, not available on TestNet
  // const currentOffset = await algod.getBlockOffsetTimestamp().do();
}

async function algosdkKmdRequests() {
  const kmd = new KmdClient("a".repeat(64), "http://localhost", 4002);
  await kmd.listWallets();
}

async function algosdkIndexerRequests() {
  const indexer = new Indexer(
    "a".repeat(64),
    "https://testnet-idx.4160.nodely.dev",
    443
  );
  await indexer.makeHealthCheck().do();
}

export async function recordAlgosdkRequests(
  client: "algod" | "kmd" | "indexer",
  mode: "record-new" | "record-overwrite" = "record-new",
  recordingsDir?: string
) {
  let makeRequests;

  if (client === "algod") {
    makeRequests = algosdkAlgodRequests;
  } else if (client === "kmd") {
    makeRequests = algosdkKmdRequests;
  } else if (client === "indexer") {
    makeRequests = algosdkIndexerRequests;
  } else {
    throw new Error(`Unknown client: ${client}`);
  }

  await record(client, makeRequests, mode, recordingsDir);
}
