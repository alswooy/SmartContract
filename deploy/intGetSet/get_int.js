const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const os = require("os");

require("dotenv").config({ path: path.join(os.homedir(), "besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;

// 🔥 주소 자동 로드


const ADDRESS_FILE = path.join(
  os.homedir(),
  "besu-network/smartcontract/deploy/contract-address-int.json"
);

const addressData = JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
const CONTRACT_ADDRESS = addressData.SimpleStorage;

// 🔥 SimpleStorage (int) ABI - get
const ABI = [
  {
    "inputs": [],
    "name": "get",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
    const web3 = new Web3(RPC_URL);
    const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

    console.log("📌 Using Contract:", CONTRACT_ADDRESS);

    const value = await contract.methods.get().call();
    console.log("📊 Current value:", value.toString());
}

main().catch(console.error);
