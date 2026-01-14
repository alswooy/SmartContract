const { Web3 } = require("web3");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const os = require("os");
const { logTransaction } = require(path.join(os.homedir(),"besu-network/smartcontract/utils/txLogger.js"));

require("dotenv").config({ path: path.join(os.homedir(), "besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LOG_FILE =path.join(
  os.homedir(),
  "besu-network/smartcontract/logs/string-set-log.txt"
);
// 🔥 컨트랙트 주소 자동 로드
const ADDRESS_FILE = path.join(
  os.homedir(),
  "besu-network/smartcontract/deploy/contract-address-string.json"
);

const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
const CONTRACT_ADDRESS = addressData.SimpleStorage;

// 🔥 SimpleStorage ABI (set + get)
const ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_value", "type": "string" }
    ],
    "name": "set",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "get",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
async function main() {
    const web3 = new Web3(RPC_URL);

    // ✅ 계정 생성 (Web3 v4 정석)
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    console.log("Using Account:", account.address);
    console.log("📌 Using Contract:", CONTRACT_ADDRESS);

    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    rl.question("set()에 저장할 문자열을 입력하세요: ", async (value) => {
        try {
            console.log(`📤 Calling set("${value}")...`);

            const receipt = await contract.methods.set(value).send({
                from: account.address,
                gas: 300000,
                gasPrice: 0
            });

            await logTransaction({
              web3,
              receipt,
              from: account.address,
              value, // 🔥 string
              logFile: LOG_FILE,
              label: "🗂️ Set String -",
              contractAddress: CONTRACT_ADDRESS
            });
            const stored = await contract.methods.get().call();
            console.log("📊 Current value:", stored);

        } catch (err) {
            console.error("❌ TX Error:", err);
        } finally {
            rl.close();
        }
    });
}

main().catch(console.error);
