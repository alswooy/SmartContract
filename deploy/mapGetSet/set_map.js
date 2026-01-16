const { Web3 } = require("web3");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const os = require("os");
const { logTransaction } = require(path.join(os.homedir(),"Desktop/besu-network/smartcontract/utils/txLogger.js"));

require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// 로그 파일 경로 변경 (Map 전용 로그)
const LOG_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/logs/map-set-log.txt"
);

// 1. 컨트랙트 주소 로드 (Map 버전)
const ADDRESS_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/deploy/contract-address-map.json"
);

// 파일 존재 확인
if (!fs.existsSync(ADDRESS_FILE)) {
    console.error("❌ Error: Address file not found at", ADDRESS_FILE);
    process.exit(1);
}

const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
// SimpleMap 배포 시 JSON 키가 "Address"로 저장되도록 했으므로 이를 사용
const CONTRACT_ADDRESS = addressData.Address; 

// 2. SimpleMap ABI 로드
const ABI_PATH = path.join(
  os.homedir(), // 절대 경로 사용 권장
  "Desktop/besu-network/smartcontract/abi/SimpleMap.json"
);

if (!fs.existsSync(ABI_PATH)) {
    console.error("❌ Error: ABI file not found at", ABI_PATH);
    process.exit(1);
}

const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function main() {
    const web3 = new Web3(RPC_URL);

    // 계정 생성
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    console.log("Using Account:", account.address);
    console.log("📌 Using Map Contract:", CONTRACT_ADDRESS);

    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    // [1단계] 키(Key) 입력 받기
    rl.question("🔑 저장할 Key(x)를 입력하세요: ", (keyInput) => {
        
        // [2단계] 값(Value) 입력 받기
        rl.question(`📝 '${keyInput}'에 저장할 Value(y)를 입력하세요: `, async (valInput) => {
            try {
                console.log(`\n📤 Calling set("${keyInput}", "${valInput}")...`);

                // [3단계] 트랜잭션 전송 (인자 2개)
                const receipt = await contract.methods.set(keyInput, valInput).send({
                    from: account.address,
                    gas: 500000, // 연산량이 늘어났으므로 가스 한도를 넉넉히 설정
                    gasPrice: 0
                });

                // 이벤트 파싱 (SimpleMap의 DataUpdated 이벤트 구조에 맞춤)
                // event DataUpdated(string key, string oldValue, string newValue);
                const event = receipt.events.DataUpdated;
                
                const updatedKey = event.returnValues.key;
                const oldValue = event.returnValues.oldValue;
                const newValue = event.returnValues.newValue;
                
                console.log("\n✅ Transaction Successful!");
                console.log("🔑 Key       :", updatedKey);
                console.log("🕘 이전 값   :", oldValue);
                console.log("🆕 새로운 값 :", newValue);

                // 로그 파일 저장
                await logTransaction({
                    web3,
                    receipt,
                    from: account.address,
                    value: `Key: ${updatedKey}, Val: ${newValue}`, // 로그에 키와 값을 함께 기록
                    logFile: LOG_FILE,
                    label: "🗂️ Map Set -",
                    contractAddress: CONTRACT_ADDRESS
                });

                // 저장된 값 확인 (get 호출)
                console.log(`\n🔎 Verifying get("${updatedKey}")...`);
                const stored = await contract.methods.get(updatedKey).call();
                console.log("📊 Current value in Chain:", stored);

            } catch (err) {
                console.error("❌ TX Error:", err);
            } finally {
                rl.close();
            }
        });
    });
}

main().catch(console.error);