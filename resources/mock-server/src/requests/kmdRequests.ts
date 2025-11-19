import { KmdClient } from "algosdk/client/kmd";

export async function algosdkKmdRequests() {
  const kmd = new KmdClient("a".repeat(64), "http://localhost", 4002);
  await kmd.listWallets();
}
