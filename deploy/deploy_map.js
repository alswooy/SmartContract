// deploy_map.js
const { Web3 } = require('web3');
const fs = require('fs');
const solc = require('solc');
const path = require("path");
const os = require("os");

// txLogger 위치가 동일하다고 가정합니다.
const { logTransaction } = require(path.join(os.homedir(),"Desktop/besu-network/smartcontract/utils/txLogger.js"));

// ================= [설정 영역] ================
require("dotenv").config({ path: path.join(os.homedir(), "Desktop/besu-network/smartcontract/.env") });

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// 1. 컨트랙트 파일명을 SimpleStringMap.sol로 변경 (이전 답변의 코드를 이 파일명으로 저장해주세요)
const CONTRACT_PATH = path.join(
    os.homedir(),
    "Desktop/besu-network/smartcontract/contract/SimpleMap.sol"
);

// 로그 및 주소 파일명도 구분하기 위해 변경
const LOG_FILE = path.join(
    os.homedir(),
    "Desktop/besu-network/smartcontract/logs/map-set-log.txt"
);
const ADDRESS_FILE = path.join(
    os.homedir(),
    "Desktop/besu-network/smartcontract/deploy/contract-address-map.json"
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
        
        // 파일이 실제로 존재하는지 체크
        if (!fs.existsSync(CONTRACT_PATH)) {
            throw new Error(`파일을 찾을 수 없습니다: ${CONTRACT_PATH}`);
        }

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
        // Solidity 코드 안의 class 이름(SimpleStringMap)을 자동으로 찾습니다.
        const contractName = Object.keys(compiledContracts)[0]; 
        console.log("Detected Contract:", contractName);

        const abi = compiledContracts[contractName].abi;
        const bytecode = "0x" + compiledContracts[contractName].evm.bytecode.object;

        /* ------------------------------------------------------------------ */
        /* 5. 배포 */
        /* ------------------------------------------------------------------ */
        const contract = new web3.eth.Contract(abi);

        console.log("⛽ Estimating Gas for deployment...");
        const estimatedGas = await contract.deploy({
            data: bytecode
        }).estimateGas({ from: myAddress });

        console.log("⛽ Estimated Gas:", estimatedGas.toString());

        const deployed = await contract.deploy({
            data: bytecode
        }).send({
            from: myAddress,
            // 가스 한도를 조금 여유있게 잡습니다.
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
                    ContractName: contractName,
                    Address: deployedAddress,
                    updatedAt: new Date().toISOString()
                },
                null,
                2
            )
        );
        console.log("📁 Contract address saved to:", ADDRESS_FILE);

        /* ------------------------------------------------------------------ */
        /* 6. 테스트 (set / get) - Mapping 방식 */
        /* ------------------------------------------------------------------ */
        
        // 테스트할 키(x)와 값(y) 설정
        const testKey = "tta";
        const testValue = "blockchain";

        console.log(`📤 Calling set("${testKey}", "${testValue}")`);
        
        // [변경됨] 인자가 2개 들어갑니다 (Key, Value)
        const receipt = await deployed.methods.set(testKey, testValue).send({
            from: myAddress,
            gas: 1000000,
            gasPrice: 0
        });

        console.log(`📥 Calling get("${testKey}")`);
        
        // [변경됨] get 호출 시 조회하고 싶은 Key를 넣어야 합니다.
        const returnedValue = await deployed.methods.get(testKey).call();
        
        console.log(`🔎 Result: Key [${testKey}] => Value [${returnedValue}]`);

        // 로그 저장
        await logTransaction({
            web3,
            receipt,
            from: myAddress,
            value: `Key: ${testKey}, Val: ${returnedValue}`,   // 로그에 키와 값을 같이 기록
            logFile: LOG_FILE,
            label: "⭐ Map Contract Set/Get Test ⭐ - ",
            contractAddress: receipt.to
        });

        console.log("✅ Test Completed Successfully");

    } catch (err) {
        console.error("❌ ERROR:", err);
    }
}

main();