# 🧩 Besu SmartContract Get / Set Example

이 프로젝트는 **Hyperledger Besu 프라이빗 네트워크**에서  
스마트컨트랙트를 **배포(deploy)** 하고,  
**get / set 트랜잭션을 개별 스크립트로 실행**하는 예제입니다.

- `.env` 파일을 통해 민감 정보 분리
- deploy 실행 시 컨트랙트 주소 자동 저장
- get / set을 독립적으로 실행 가능
- set은 **콘솔 입력 방식**으로 동작
- logger를 통한 로그 관리

---

## 📁 프로젝트 구조
```
smartcontract/
├─ abi/
│ ├─ SimpleInt.json
│ ├─ SimpleString.json
│ └─ SimpleMap.json
├─ contract/
│ ├─ SimpleInt.sol
│ ├─ SimpleString.sol
│ └─ SimpleMap.sol
├─ deploy/
│ ├─ deploy_int.js
│ ├─ deploy_string.js
│ ├─ deploy_map.js
│ ├─ contract-address-int.json
│ ├─ contract-address-string.json
│ └─ contract-address-map.json
├─ getSet/
│ ├─int/
│ ├─├─get_int.js
│ └─└─set_int.js
│ ├─string/
│ ├─├─get_string.js
│ └─└─set_string.js
│ ├─map/
│ ├─├─get_map.js
│ └─└─set_map.js
├─ logs/
│ └─ *.log
├─ utils/
│ └─ txLogger.js
├─ .env
└─ README.md
```
---

## ⚙️ 사전 준비

### 1️⃣ Node.js 설치
```bash
node -v
권장: Node.js 20 이상
```
2️⃣ 의존성 설치
```
npm install
```
🔐 환경 변수 설정 (.env)
  .env 파일은 절대 Git에 커밋하지 않습니다.

📄 .env 예시
env
코드 복사
```
RPC_URL=http://주소:8545
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```
  - RPC_URL : Besu RPC 엔드포인트

  - PRIVATE_KEY : createAccount.js에서 나온 트랜잭션 서명에 사용할 EOA 개인키

🚀 스마트컨트랙트 배포
🔹 Int 타입 컨트랙트 배포
```
node deploy/deploy_int.js
```
🔹 String 타입 컨트랙트 배포
```
node deploy/deploy_string.js
```
🔹 Map 타입 컨트랙트 배포
```
node deploy/deploy_Map.js
```
📄 배포 결과
```
배포가 완료되면 자동으로 컨트랙트 주소 파일이 생성됩니다.
```
json
```
{
  "SimpleStorage": "0xAbc123...",
  "updatedAt": "2026-01-15T03:11:22.000Z"
}
```
파일 위치 예:
```
deploy/contract-address-int.json
deploy/contract-address-string.json
deploy/contract-address-map.json
```
 이후 get / set 스크립트는 이 파일을 자동으로 읽어 컨트랙트 주소를 사용합니다.

📥 값 조회 (get)
```
# 🔹 int 값 조회
node getSet/int/get_int.js
# 🔹 string 값 조회
node getSet/string/get_string.js
# 🔹 map 값 조회
node getSet/map/get_map.js
```
get은 eth_call 기반으로 실행되며
가스 소모 없이 현재 상태만 조회합니다.

📤 값 저장 (set)
```
# 🔹 int 값 저장
node getSet/int/set_int.js
# 🔹 string 값 저장
node getSet/string/set_string.js
# 🔹 map 값 저장
node getSet/map/set_map.js
```
실행 시 콘솔에서 값을 직접 입력합니다.

set()에 저장할 값을 입력하세요: Test

입력한 값은 트랜잭션으로 전송됩니다.

블록에 포함되며 이벤트 및 로그가 생성됩니다.

🧾 로그 기록
```
set 트랜잭션 실행 시

블록 번호 / 트랜잭션 해시 / 시간(KST) / 값이 로그로 저장됩니다.
```
로그 위치:
```
logs/*.log
```
🔄 실행 흐름 요약
.env 설정

```
deploy_*.js 실행
       ↓
컨트랙트 주소 JSON 생성
       ↓
get_*.js / set_*.js 개별 실행
       ↓
결과 및 로그 확인
```
⚠️ 주의 사항
```
PRIVATE_KEY는 테스트 계정만 사용하세요.

메인넷에서는 하드웨어 월렛 또는 키스토어 사용을 권장합니다.

ABI는 반드시 /abi 디렉토리의 JSON 파일을 사용해야 합니다.
```

✅ 특징 요약
```
ABI / Address 분리 구조

get / set 완전 분리 실행

이벤트 기반 로그 수집

Besu / EVM 호환 구조
```
📌 참고
```
Hyperledger Besu

JSON-RPC (eth_call, eth_sendRawTransaction)

Web3.js v4
```
📬 문의
```
이 프로젝트는 학습 및 테스트 목적의 예제입니다.
구조 확장, 이벤트 인덱싱, DB 연동 등으로 확장 가능합니다.
```
