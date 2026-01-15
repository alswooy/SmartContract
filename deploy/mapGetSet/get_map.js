const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;

// 🔥 1. 컨트랙트 주소 로드 (Map 버전 파일)
const ADDRESS_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/deploy/contract-address-map.json"
);

// 파일이 없으면 에러 처리
if (!fs.existsSync(ADDRESS_FILE)) {
    console.error("❌ Error: Address file not found at", ADDRESS_FILE);
    process.exit(1);
}

const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
// JSON 구조가 { ContractName:..., Address:..., ... } 형태이므로 Address 필드 사용
const CONTRACT_ADDRESS = addressData.Address; 

// 🔥 2. SimpleMap ABI 로드 (새로 만든 json 파일)
const ABI_PATH = path.join(
  os.homedir(), // 경로가 복잡하면 절대경로로 잡는 것이 안전합니다.
  "Desktop/besu-network/smartcontract/abi/SimpleMap.json"
);

if (!fs.existsSync(ABI_PATH)) {
    console.error("❌ Error: ABI file not found at", ABI_PATH);
    process.exit(1);
}

const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));

async function main() {
    // // 3. 키 입력 받기 (터미널 인자)
    // // node get_map_value.js [KEY]
    // const searchKey = process.argv[2];

    // if (!searchKey) {
    //     console.log("⚠️  조회할 Key를 입력해주세요!");
    //     console.log("   사용법: node get_map_value.js <MyKey>");
    //     process.exit(0);
    // }
rl.question("get()에서 조회할 키를 입력하세요: ", async (searchKey) => {
        try {
            const web3 = new Web3(RPC_URL);
            const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

            console.log("📌 Using Contract Address:", CONTRACT_ADDRESS);
            console.log(`🔎 Querying Key: "${searchKey}"...`);

            // 4. get 함수 호출 (인자로 key 전달)
            const value = await contract.methods.get(searchKey).call();

            if (value === "") {
                console.log("⚠️  Value is empty (Key might not exist or value is empty string).");
            } else {
                console.log("📊 Result Value:", value);
            }

        } catch (error) {
            console.error("❌ Error fetching data:", error);
        }
        rl.close();
    });
}

main();