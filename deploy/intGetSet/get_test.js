const { Web3 } = require('web3');
const fs = require('fs');
const solc = require('solc');
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(os.homedir(), "besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

async function main() {
    const web3 = new Web3(RPC_URL);
    const account = web3.eth.accounts.wallet.add(PRIVATE_KEY);
        // [중요] account가 제대로 생성되었는지 확인 (undefined 방지)
    const myAddress = account.address || account[0].address; 
    console.log(`Using Account: ${myAddress}`);

    // ABI 로드
    const source = fs.readFileSync(
        "/home/node1/besu-network/smartcontract/contract/SimpleStorage.sol",
        "utf8"
    );

    const input = {
        language: "Solidity",
        sources: { "SimpleStorage.sol": { content: source } },
        settings: { outputSelection: { "*": { "*": ["abi"] } } }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const abi = output.contracts["SimpleStorage.sol"]["SimpleStorage"].abi;

    const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
    // 🔍 바로 get으로 검증
    const value = await contract.methods.get().call();
    console.log("Current value:", value);
}

main().catch(console.error);
