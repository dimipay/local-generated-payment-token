## 1.0.0

- 1.0.0 배포

### 0.4.7

- Timing 문서 추가
- 문서 맞춤법 수정

### 0.4.6

- 사용자 식별자의 전역적 유일성 삭제

### 0.4.5

- 카운터 계산 오류 수정
- Implementation Guide 추가

### 0.4.4

- `Online Auth` auth type 추가

### 0.4.3

- ad에 raw_private_payload값 삭제

### 0.4.2

- XChaCha20-Poly1305 ad 값 추가
- Additional Data Tag 추가
- UUIDv7을 Nonce로 사용
- README Requirements 추가

### 0.4.1

- Payment Method Idenfitier를 Common payload로 이동
- Payload Length Indicator TLV 도입

## 0.4.0

- deprecate 0.3
- TLV 포멧 도입: [TLV.md](./TLV.md)
- HMAC 계산에서 논리 오류로 인한 HMAC 폐지
- XChaCha20-Poly1305 도입
- 문서 분리 및 개선
- 카운터 업데이트 주기(tx)를 30초로 고정

### 0.3.7

- 카운터 문자열 변환 추가
- 예제 업데이트

### 0.3.3

- Payload를 Metadat, Common, Private 색션으로 구분

## 0.3.0

- Payload에서 Metadata 섹션을 구분
- Payload Format Indicator, Application Identifier 추가
