const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const os = require("os");

require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;

// 1. 컨트랙트 주소 로드
const ADDRESS_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/deploy/contract-address-int.json"
);

const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
const CONTRACT_ADDRESS = addressData.SimpleStorage; // 혹은 addressData.Address (저장된 키 확인 필요)

// 2. ABI 파일 로드 (변경됨)
const ABI_PATH = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/abi/SimpleInt.json"
);

// 파일이 존재하는지 체크
if (!fs.existsSync(ABI_PATH)) {
    console.error("❌ ABI 파일을 찾을 수 없습니다:", ABI_PATH);
    process.exit(1);
}

const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));

async function main() {
    const web3 = new Web3(RPC_URL);
    // 로드한 ABI와 주소로 컨트랙트 객체 생성
    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    console.log("📌 Using Contract:", CONTRACT_ADDRESS);

    // get 호출
    const value = await contract.methods.get().call();
    console.log("📊 Current value:", value.toString());
}

main().catch(console.error);