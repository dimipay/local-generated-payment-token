# Implementation Guide

## Client

### 다음 카운터 업데이트 시간 계산

다음 카운터 엡데이트까지 남음 시간은 다음 식으로 계산할 수 있습니다.

$$
L = 30\cdot1000-((T-T_{0})\bmod30\cdot1000)
$$

## Server

토큰 검증은 다음 순서를 따릅니다.

1. base45 인코딩 확인 및 메타데이터 검증
2. 일반 페이로드 파싱
3. 암호화 페이로드 복호화 및 MAC 검증
4. 암호화 페이로드 파싱
5. Nonce 검증
6. Auth Token 및 Device ID 검증

### 메타데이터 검증

토큰이 로컬 생성 결제 토큰인지 빠르게 확인하기 위해선 체크썸으로 [페이로드 포맷 지시자](./1-Payload.md#payload-format-indicator)와 [애플리케이션 식별자](./1-Payload.md#application-identifier)를 Base45로 인코딩한 값을 사용할 수 있습니다.

애플리케이션 식별자가 `0x44 0x40 0xff 0xff`이라면 채크썸은 `6T9SS8FGW`입니다. 두 값은 2n 바이트이기 때문에 항상 Base45 인코딩 값을 미리 알 수 있습니다.

### Nonce 저장

Nonce를 TTL로 저장한다면, 경계값에 안전하기 위해 카운터가 업데이트 되기까지 남은 시간 보다 1~2초 정도 더 길제 저장하는 것이 좋습니다.
