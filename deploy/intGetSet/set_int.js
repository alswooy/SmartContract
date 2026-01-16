const { Web3 } = require("web3");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const os = require("os");
const { logTransaction } = require(path.join(os.homedir(),"Desktop/besu-network/smartcontract/utils/txLogger.js"));

require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const LOG_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/logs/int-set-log.txt"
);

// 1. 컨트랙트 주소 로드
const ADDRESS_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/deploy/contract-address-int.json"
);

const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
const CONTRACT_ADDRESS = addressData.SimpleStorage; // 배포시 저장된 키 이름 확인

// 2. ABI 파일 로드 (변경됨)
const ABI_PATH = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/abi/SimpleInt.json"
);

if (!fs.existsSync(ABI_PATH)) {
    console.error("❌ ABI 파일을 찾을 수 없습니다:", ABI_PATH);
    process.exit(1);
}

const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function main() {
    const web3 = new Web3(RPC_URL);

    // 계정 설정
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    console.log("Using Account:", account.address);
    console.log("📌 Using Contract:", CONTRACT_ADDRESS);

    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    rl.question("set()에 저장할 정수값을 입력하세요: ", async (input) => {
        try {
            // 입력값 검증 및 BigInt 변환
            if (!input || isNaN(input)) {
                console.error("❌ 유효한 숫자를 입력해주세요.");
                rl.close();
                return;
            }
            
            const value = BigInt(input); // uint256 대응
            console.log(`\n📤 Calling set(${value})...`);

            const receipt = await contract.methods.set(value).send({
                from: account.address,
                gas: 300000,
                gasPrice: 0
            });

            console.log("✅ TX Hash:", receipt.transactionHash);

            // 로그 저장
            await logTransaction({
                web3,
                receipt,
                from: account.address,
                value: value,       // BigInt 저장 가능
                logFile: LOG_FILE,
                label: "SET_INT",
                contractAddress: CONTRACT_ADDRESS
            });

            // 변경된 값 확인
            const stored = await contract.methods.get().call();
            console.log("📊 Current value in Chain:", stored.toString());

        } catch (err) {
            console.error("❌ TX Error:", err);
        } finally {
            rl.close();
        }
    });
}

main().catch(console.error);