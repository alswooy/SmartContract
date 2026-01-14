const { Web3 } = require('web3');
const fs = require('fs');
const solc = require('solc');
const readline = require("readline");
const path = require("path");
const os = require("os");
const { logTransaction } = require(path.join(os.homedir(),"besu-network/smartcontract/utils/txLogger.js"));
require("dotenv").config({ path: path.join(os.homedir(), "besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const LOG_FILE =path.join(
  os.homedir(),
  "besu-network/smartcontract/logs/int-static-set-log.txt"
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

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
    
    rl.question("set()에 저장할 숫자를 입력하세요: ", async (answer) => {
        const value = BigInt(answer); // uint256 대응

        console.log(`Calling set(${value})...`);

        const receipt = await contract.methods.set(value).send({
            from: myAddress,
            gas: 1000000n,
            gasPrice: 0
        });
        await logTransaction({
            web3,
            receipt,
            from: account.address,
            value: value,       // 🔥 number / bigint OK
            logFile: LOG_FILE,
            label: "🗂️ SET_INT_STATIC",
            contractAddress: CONTRACT_ADDRESS
        });
        console.log("TX Hash:", receipt.transactionHash);

        // 바로 get으로 검증
        const stored = await contract.methods.get().call();
        console.log("Current value:", stored);

        rl.close();
    });
}

main().catch(console.error);
