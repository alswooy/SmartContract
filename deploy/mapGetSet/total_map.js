const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });

// ================= [설정 영역] =================
const RPC_URL = process.env.RPC_URL;

// 1. 주소 파일 경로 변경 (Map 버전)
const ADDRESS_FILE = path.join(
    os.homedir(),
    "Desktop/besu-network/smartcontract/deploy/contract-address-map.json"
);

// 2. ABI 파일 경로 변경 (Map 버전)
const ABI_PATH = path.join(
    os.homedir(),
    "Desktop/besu-network/smartcontract/abi/SimpleMap.json"
);

const CHUNK_SIZE = 5000;

// 파일 존재 여부 체크 (안전 장치)
if (!fs.existsSync(ADDRESS_FILE) || !fs.existsSync(ABI_PATH)) {
    console.error("❌ Error: Address or ABI file not found.");
    process.exit(1);
}

// 3. JSON 읽기 및 주소 추출
const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
const CONTRACT_ADDRESS = addressData.Address; 

const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));
// ===============================================

// KST 변환 함수
function toKST(blockTimestamp) {
  const ms = Number(blockTimestamp) * 1000;
  const kst = new Date(ms + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace("T", " ").substring(0, 19); 
}

async function main() {
    const web3 = new Web3(RPC_URL);
    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    const latest = Number(await web3.eth.getBlockNumber());

    console.log("📌 Target Contract:", CONTRACT_ADDRESS);
    console.log("📦 Latest Block:", latest);
    console.log("🔍 Fetching 'DataUpdated' events for MAP...\n");

    let from = 1;
    let allEvents = [];

    // 청크 단위로 끊어서 가져오기
    while (from <= latest) {
        const to = Math.min(from + CHUNK_SIZE - 1, latest);
        
        try {
            const events = await contract.getPastEvents("DataUpdated", {
                fromBlock: from,
                toBlock: to
            });
            allEvents.push(...events);
        } catch (e) {
            console.error(`\n❌ Error fetching blocks ${from}-${to}:`, e.message);
        }

        from = to + 1;
    }

    console.log(`\n\n✅ Total events found: ${allEvents.length}\n`);

    // 테이블 헤더 수정 (Tx Hash 추가로 인해 구분선을 길게 늘렸습니다)
    console.log("------------------------------------------------------------------------------------------------------------------------------------");
    console.log("|     Time (KST)      | Block |                              Tx Hash                               |      Key      |    Value Change   |");
    console.log("------------------------------------------------------------------------------------------------------------------------------------");

    for (const e of allEvents) {
        const block = await web3.eth.getBlock(e.blockNumber);
        const time = toKST(block.timestamp);
        
        // 4. Map 이벤트 필드 가져오기
        const key = e.returnValues.key;
        const oldVal = e.returnValues.oldValue;
        const newVal = e.returnValues.newValue;
        
        // 5. 트랜잭션 해시 가져오기
        const txHash = e.transactionHash;

        // 보기 좋게 출력 (Tx Hash 포함)
        console.log(
            `| ${time} | ${e.blockNumber.toString().padEnd(5)} | ${txHash} | ${key.padEnd(13)} | "${oldVal}" → "${newVal}"`
        );
    }
    console.log("------------------------------------------------------------------------------------------------------------------------------------");
}

main().catch(console.error);