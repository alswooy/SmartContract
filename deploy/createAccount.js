// createAccount.js
const { Web3 } = require('web3');
const web3 = new Web3();

// 새로운 계정 생성
const account = web3.eth.accounts.create();

console.log("=========================================");
console.log("⚠️  이 정보를 복사해서 따로 저장하세요! ⚠️");
console.log("=========================================");
console.log("Private Key (비밀번호): " + account.privateKey);
console.log("Address (계좌번호):     " + account.address);
console.log("=========================================");