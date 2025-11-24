import { Indexer } from "algosdk";

export async function algosdkIndexerRequests() {
  const indexer = new Indexer(
    "a".repeat(64),
    "https://testnet-idx.4160.nodely.dev",
    443
  );

  // ========================================
  // TEST DATA SOURCES:
  // - Using same test data from algod requests (Lora object mothers)
  // ========================================

  const address = "25M5BT2DMMED3V6CWDEYKSNEFGPXX4QBIINCOICLXXRU3UGTSGRMF3MTOE";
  // TODO: Find app with a localstate
  const appId = 718348254; // testnet
  const appIdWithBoxes = 742949200; // xgov testnet
  const assetId = 705457144;
  const txId = "VIXTUMAPT7NR4RB2WVOGMETW4QY43KIDA3HWDWWXS3UEDKGTEECQ";
  const round = 24099447;

  // ============================================
  // NO PARAMETERS NEEDED
  // ============================================

  // GET /health
  await indexer.makeHealthCheck().do();

  // ============================================
  // ACCOUNT ENDPOINTS
  // ============================================

  // GET /v2/accounts
  await indexer.searchAccounts().limit(1).do();

  // GET /v2/accounts/{account-id}
  await indexer.lookupAccountByID(address).do();

  // GET /v2/accounts/{account-id}/transactions
  await indexer.lookupAccountTransactions(address).do();

  // GET /v2/accounts/{account-id}/assets
  await indexer.lookupAccountAssets(address).do();

  // GET /v2/accounts/{account-id}/created-assets
  await indexer.lookupAccountCreatedAssets(address).do();

  // GET /v2/accounts/{account-id}/created-applications
  await indexer.lookupAccountCreatedApplications(address).do();

  // GET /v2/accounts/{account-id}/apps-local-state
  await indexer.lookupAccountAppLocalStates(address).do();

  // ============================================
  // TRANSACTION ENDPOINTS
  // ============================================

  // GET /v2/transactions
  await indexer.searchForTransactions().limit(1).do();

  // GET /v2/transactions/{txid}
  await indexer.lookupTransactionByID(txId).do();

  // ============================================
  // ASSET ENDPOINTS
  // ============================================

  // GET /v2/assets
  await indexer.searchForAssets().limit(1).do();

  // GET /v2/assets/{asset-id}
  await indexer.lookupAssetByID(assetId).do();

  // GET /v2/assets/{asset-id}/balances
  await indexer.lookupAssetBalances(assetId).do();

  // GET /v2/assets/{asset-id}/transactions
  await indexer.lookupAssetTransactions(assetId).do();

  // ============================================
  // APPLICATION ENDPOINTS
  // ============================================

  // GET /v2/applications
  await indexer.searchForApplications().limit(1).do();

  // GET /v2/applications/{application-id}
  await indexer.lookupApplications(appId).do();

  // GET /v2/applications/{application-id}/logs
  await indexer.lookupApplicationLogs(appId).do();

  // GET /v2/applications/{application-id}/box
  const boxName = Buffer.from(
    "cBbHBNV+zUy/Mz5IRhIrBLxr1on5wmidhXEavV+SasC8",
    "base64"
  );
  await indexer.lookupApplicationBoxByIDandName(appIdWithBoxes, boxName).do();

  // GET /v2/applications/{application-id}/boxes
  await indexer.searchForApplicationBoxes(appIdWithBoxes).do();

  // ============================================
  // BLOCK ENDPOINTS
  // ============================================

  // GET /v2/blocks/{round-number}
  await indexer.lookupBlock(round).do();

  // GET /v2/block-headers
  await indexer.searchForBlockHeaders().limit(1).do();
}
