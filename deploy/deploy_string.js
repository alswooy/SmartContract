// deploy_string.js
const { Web3 } = require('web3');
const fs = require('fs');
const solc = require('solc');
const path = require("path");
const os = require("os");
const { logTransaction } = require(path.join(os.homedir(),"Desktop/besu-network/smartcontract/utils/txLogger.js"));

// ================= [설정 영역] ================
require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_PATH = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/contract/SimpleString.sol"
);
const LOG_FILE =path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/logs/string-set-log.txt"
);
const ADDRESS_FILE = path.join(
  os.homedir(),
  "Desktop/besu-network/smartcontract/deploy/contract-address-string.json"
);

async function main() {
    try {
        /* ------------------------------------------------------------------ */
        /* 1. Web3 연결 */
        /* ------------------------------------------------------------------ */
        const web3 = new Web3(RPC_URL);
        console.log("✅ Connected to Besu");

        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);
        const myAddress = account.address;

        console.log("Using Account:", myAddress);

        /* ------------------------------------------------------------------ */
        /* 2. Solidity 파일 로드 */
        /* ------------------------------------------------------------------ */
        const contractFileName = path.basename(CONTRACT_PATH);
        const sourceCode = fs.readFileSync(CONTRACT_PATH, 'utf8');

        /* ------------------------------------------------------------------ */
        /* 3. 컴파일 */
        /* ------------------------------------------------------------------ */
        const input = {
            language: "Solidity",
            sources: {
                [contractFileName]: { content: sourceCode }
            },
            settings: {
                outputSelection: {
                    "*": {
                        "*": ["abi", "evm.bytecode"]
                    }
                }
            }
        };

        console.log("🔧 Compiling contract...");
        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        if (output.errors) {
            for (const err of output.errors) {
                if (err.severity === "error") {
                    console.error("❌ Solidity Error:", err.formattedMessage);
                    throw new Error("Compilation failed");
                } else {
                    console.warn("⚠️ Solidity Warning:", err.formattedMessage);
                }
            }
        }

        /* ------------------------------------------------------------------ */
        /* 4. 컨트랙트 이름 자동 추출 */
        /* ------------------------------------------------------------------ */
        const compiledContracts = output.contracts[contractFileName];
        const contractName = Object.keys(compiledContracts)[0]; // ⭐ 핵심
        console.log("Detected Contract:", contractName);

        const abi = compiledContracts[contractName].abi;
        const bytecode = "0x" + compiledContracts[contractName].evm.bytecode.object;

        /* ------------------------------------------------------------------ */
        /* 5. 배포 */
        /* ------------------------------------------------------------------ */
        const contract = new web3.eth.Contract(abi);

        const estimatedGas = await contract.deploy({
            data: bytecode
        }).estimateGas({ from: myAddress });

        console.log("⛽ Estimated Gas:", estimatedGas.toString());

        const deployed = await contract.deploy({
            data: bytecode
        }).send({
            from: myAddress,
            gas: BigInt(estimatedGas) + 100000n,
            gasPrice: 0
        });
        const deployedAddress = deployed.options.address;
        console.log("🎉 Contract deployed at:", deployedAddress);
        /* 🔥 주소 파일 저장 */
        fs.writeFileSync(
            ADDRESS_FILE,
            JSON.stringify(
                {
                    SimpleStorage: deployedAddress,
                    updatedAt: new Date().toISOString()
                },
                null,
                2
            )
        );

        console.log("📁 Contract address saved to:", ADDRESS_FILE);
        /* ------------------------------------------------------------------ */
        /* 6. 테스트 (set / get) */
        /* ------------------------------------------------------------------ */

        console.log("📤 Calling set(hello TTA!)");
        const receipt =await deployed.methods.set("hello TTA!").send({
            from: myAddress,
            gas: 1000000,
            gasPrice: 0
        });
        console.log("📥 Calling get()");
        const value = await deployed.methods.get().call();
        await logTransaction({
            web3,
            receipt,
            from: myAddress,
            value: value,   // 🔥 string
            logFile: LOG_FILE,
            label: "⭐ New Contract String Deployed ⭐ - ",
            contractAddress: receipt.to
        });
        
        console.log("🎉 Contract deployed at:", deployedAddress);

        
    } catch (err) {
        console.error("❌ ERROR:", err);
    }
}

main();
