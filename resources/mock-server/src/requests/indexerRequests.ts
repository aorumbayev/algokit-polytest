import { Indexer } from "algosdk";

export async function algosdkIndexerRequests() {
  const indexer = new Indexer(
    "a".repeat(64),
    "https://testnet-idx.4160.nodely.dev",
    443
  );
  await indexer.makeHealthCheck().do();
}
