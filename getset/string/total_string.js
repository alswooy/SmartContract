const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });

// ================= 설정 =================
const RPC_URL = process.env.RPC_URL;
const ADDRESS_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/deploy/contract-address-string.json"
);
const CHUNK_SIZE = 5000;
// JSON 읽기
const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));

// 실제 컨트랙트 주소
const CONTRACT_ADDRESS = addressData.SimpleStorage;
// ABI는 반드시 event 포함된 JSON 사용
const ABI_PATH = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/abi/SimpleString.json"
);
const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));
// ========================================

// KST 변환 함수
function toKST(blockTimestamp) {
  const ms = Number(blockTimestamp) * 1000;
  const kst = new Date(ms + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace("T", " ").substring(0, 23);
}

async function main() {
  const web3 = new Web3(RPC_URL);
  const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

  const latest = Number(await web3.eth.getBlockNumber());

  console.log("📌 Contract:", CONTRACT_ADDRESS);
  console.log("📦 Latest block:", latest);
  console.log("🔍 Fetching DataUpdated events with chunking...\n");

  let from = 1;
  let allEvents = [];

  while (from <= latest) {
    const to = Math.min(from + CHUNK_SIZE - 1, latest);

    console.log(`⏳ Fetching blocks ${from} → ${to}`);

    const events = await contract.getPastEvents("DataUpdated", {
      fromBlock: from,
      toBlock: to
    });

    allEvents.push(...events);
    from = to + 1;
  }

  console.log(`\n✅ Total events: ${allEvents.length}\n`);

  for (const e of allEvents) {
    const block = await web3.eth.getBlock(e.blockNumber);
    console.log(
      `[${toKST(block.timestamp)}] ` +
      `block=${e.blockNumber} ` +
      `"${e.returnValues.oldValue}" → "${e.returnValues.newValue}"`
    );
  }
}

main().catch(console.error);
