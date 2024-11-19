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