import { record } from ".";
import {
  algosdkAlgodRequests,
  algosdkAlgodRequests1,
  algosdkAlgodRequestsWithMainnet,
  algosdkAlgodRequestsApiCalls,
  algosdkAlgodRequestsTest
} from "./requests/algodRequests";
import { algosdkKmdRequests } from "./requests/kmdRequests";
import { algosdkIndexerRequests } from "./requests/indexerRequests";

export async function recordAlgosdkRequests(
  client: "algod" | "kmd" | "indexer",
  mode: "record-new" | "record-overwrite" = "record-new",
  recordingsDir?: string
) {
  let makeRequests;

  if (client === "algod") {
    makeRequests = async () => {
      await algosdkAlgodRequests();
      // await algosdkAlgodRequests1();
      await algosdkAlgodRequestsWithMainnet();
      await algosdkAlgodRequestsApiCalls();
    };
  } else if (client === "kmd") {
    makeRequests = algosdkKmdRequests;
  } else if (client === "indexer") {
    makeRequests = algosdkIndexerRequests;
  } else {
    throw new Error(`Unknown client: ${client}`);
  }

  await record(client, makeRequests, mode, recordingsDir);
}
