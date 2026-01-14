const fs = require("fs");
const path = require("path");

/**
 * 블록 timestamp → KST (ms 포함)
 */
function toKSTFromBlockTs(blockTimestamp) {
    const date = new Date(Number(blockTimestamp) * 1000);
    const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().replace("T", " ").substring(0, 23);
}

/**
 * 공통 TX 로그 기록 함수
 */
function logTransaction({
    web3,
    receipt,
    from,
    value,              // string | number | bigint
    logFile,
    label = "TX",       // "DEPLOY" | "SET_STRING" | "SET_INT" 등
    contractAddress
}) {
    // 로그 디렉토리 보장
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    return (async () => {
        const block = await web3.eth.getBlock(receipt.blockNumber);
        const blockTimeKST = toKSTFromBlockTs(block.timestamp);

        const logLine =
            `[${blockTimeKST}] ` +
            `${label} ` +
            `contractAddress=${contractAddress || receipt.to} ` +
            `txHash=${receipt.transactionHash} ` +
            `block=${receipt.blockNumber} ` +
            `from=${from} ` +
            `value=${value}\n`;

        fs.appendFileSync(logFile, logLine);
        console.log("📄 Logged:", logLine.trim());
    })();
}

module.exports = {
    logTransaction,
};
