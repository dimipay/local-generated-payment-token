# Local Generated Pay Token

Version: 1.0.0

## Tabel of Contents

1. [Payload](./1-Payload.md)
2. [Encryption](./2-Encryption.md)
3. [QR Code Encoding](./3-QR%20Code%20Encoding.md)
4. [Timing](./4-Timing.md)
5. [Implementation Guide](./5-Implementation%20Guide.md)
6. [Example](./6-Example.md)

### Miscellaneous
- [Common](./Common.md)
- [TLV](./TLV.md)

## Introduction

Local Generated Pay Token(로컬 생성 결제 토큰)은 사용자 기기에서 결제 서버나 결제 단말기와의 통신없이 안전한 결제 토큰을 만들기위해 만들어 졌습니다.

로컬 토큰의 주된 목표는 인터넷 사용이 원할하지 않은 환경이라도 빠르고 일정한 결제 속도를 제공하는 것입니다.

## Requirements

로컬 생성 결제 토큰은 다음 요건을 만족하는 것을 목표로 합니다.

- 토큰의 모든 요소는 암호화 되거나 진위를 보장할 수 있어야 합니다.
  - AEAD 알고리즘 XChaCha20-Poly1305를 사용합니다.

- 무상태(stateless) 이어야 합니다.

- 일정 시간이 지나면 토큰 스스로 만료되어야 합니다.
  - 카운터와 HKDF로 암호화 키가 30초 마다 업데이트되어 루트 키를 알고있어도 바로 토큰 복호화가 불가능 하지만,
    충분한 시간이 있으면 복구가 가능하므로 개선 되어야 합니다.

## License

    Copyright The local generate payment token Authors.
    
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
        http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
