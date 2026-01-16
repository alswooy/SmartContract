const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const os = require("os");

require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;

// 컨트랙트 주소 자동 로드
const ADDRESS_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/deploy/contract-address-string.json"
);
const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
const CONTRACT_ADDRESS = addressData.SimpleStorage;

// SimpleStorage ABI (get만 있으면 충분)
const ABI_PATH = path.join(
  __dirname,
  "..", "..", "..", "smartcontract", "abi", "SimpleString.json"
);
const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));

async function main() {
    const web3 = new Web3(RPC_URL);
    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    console.log("📌 Using Contract:", CONTRACT_ADDRESS);

    const value = await contract.methods.get().call();
    console.log("📊 Current value:", value);
}

main().catch(console.error);
