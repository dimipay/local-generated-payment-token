# Payload

전체 페이로드는 아래의 하위 페이로드로 구성됩니다.

- Metadata Payload

  - Payload Format Indicator (페이로드 포맷 지시자)
  - Application Identifier (애플리케이션 식별자)
  - Version (버전)

- Common Payload  

  - Auth Type (인증 유형)
  - User Identifier (사용자 식별자)
  - Payment Method Identifier (결제 수단 식별자)

- Private Payload/Encrypted Payload

  - Auth Token (인증 토큰)
  - Device Identifier (기기 식별자)
  - Nonce

메타데이터 페이로드를 제외한 모든 페이로드는 [TLV](./TLV.md) 포맷을 사용합니다. 페이로드에서 TLV 블록의 순서는 중요하지 않습니다.

전체 페이로드는 메타데이터 페이로드, 일반 페이로드, 암호화 페이로드 순서로 결합해 완성합니다.

### Payload Length Indicator (PLI)

- TLV tag:  `7`
- TLV length:  `0`

메타데이터 페이로드를 제외한 모든 페이로드의 가장 앞에는 Payload Length Indicator가 반드시 있어야 합니다.
Payload Length Indicator 역시 TLV 블록이며, 페이로드의 바이트 수를 나타냅니다.

결제 서버는 페이로드가 기대되는 순서에서 Payload Length Indicator를 찾을 수 없으면 오류를 반환해야 합니다.

예를 들어 Common Payload가 1바이트의 Auth Type 값, 16바이트의 User Identifier, 1바이트의 Payment Method Identifier를 포함한다면, 총 페이로드의 크기는 21((1+1) + (1+16) + (1+1)) 바이트이므로, 다음과 같이 나타낼 수 있습니다.

```text
  0111   0000  0001 0101   [ Auth Type TLV ] [User Identifier TLV] ..
├ tag ┘└ len ┘└   value  ┤
└  Length Indicator TLV  ┘
```

### Additional Data (AD)

- TLV tag: `8`
- TLV length: var

일반 페이로드와 암호화 페이로드에 LGPT 사양에서 정의되지 않은 커스텀 데이터를 담기 위한 필드입니다.

## Metadata Payload

메타데이터 페이로드는 예외적으로 PLI를 포함한 TLV 포맷을 사용하지 않고, 미리 정의된 페이로드 포맷을 따릅니다. 고정된 순서로 필드를 배치하면 미리 base45 인코딩 값을 계산하여 빠르게 토큰 검사가 가능하기 때문입니다.

### Payload Format Indicator

페이로드 포맷 지시자는 토큰이 LGPT임을 나타냅니다. `0x4c 0x50` 값을 사용합니다.

### Application Identifier

토큰을 생성한 애플리케이션을 나타냅니다. 4바이트 크기이며, 패딩으로 `0xff`를 사용합니다.

페이로드 포맷 지시자와 같은 맥락으로 크기는 2n 바이트입니다.

`0x44 0x50` -> `0x44 0x50 0xff 0xff`

### Version

버전은 LGPT의 사양 버전을 나타내는 1바이트 정보입니다.
버전의 첫 4비트는 major 버전, 다음 4비트는 minor 버전을 나타냅니다.

```text
1) 0001 0000 (0x10) → 1.0v
2) 0011 0101 (0x35) → 3.5v
```

버전은 문서 자체의 버전과 동일합니다. major 버전은 하위 호환되지 않는 수정이 이루어지는 경우에 변경됩니다. minor 버전 업데이트는 같은 major 버전에 대한 하위 호환을 보장하지만, 보안상의 이유로 이전 버전이 deprecated 되는 경우, 이전 버전 토큰의 결제 지원을 중단해야 합니다.

> [!CAUTION]
> 0.x 버전은 하위 호환성을 제공하지 않습니다.

## Common Payload

일반 페이로드는 암호화가 필요 없는 일반 정보를 담습니다.

### Auth Type

- TLV tag: `1`
- TLV length: `0`

인증 유형을 나타내는 1바이트 정보입니다. LGPT 사양은 `0xxx xxxx` 네임스페이스를 예약합니다. 정의된 유형은 다음과 같습니다.

| auth type         | name             | description            |
| ----------------- | ---------------- | ---------------------- |
| `0000 0001(0x01)` | Bypass           | 인증을 거치지 않음     |
| `0001 0000(0x10)` | Local Auth       |                        |
| `0001 0001(0x11)` | Pattern Auth     | Local auth의 하위 유형 |
| `0001 1000(0x18)` | Bio Auth         | Local auth의 하위 유형 |
| `0001 1001(0x19)` | Fingerprint Auth | bio auth의 하위 유형   |
| `0001 1010(0x1a)` | Face Auth        | bio auth의 하위 유형   |
| `0001 1011(0x1b)` | Iris Auth        | bio auth의 하위 유형   |
| `0010 0000(0x20)` | Online Auth      | 온라인 인증            |
| `0010 0001(0x21)` | Online Pin  Auth | 온라인 핀 인증         |

사용자 정의 유형은 `1xxx xxxx` 형식을 사용합니다. `1000 0001(0x81)`과 같이 정의할 수 있습니다.

### User Identifier

- TLV tag: `3`
- TLV length: var

사용자 식별자는 전역적으로 유일하지 않아도 괜찮습니다.

> [!NOTE]
> UUID는 [Common#UUID](./Common.md#uuid)를 참고하여 처리해 주새요.

### Payment Method Identifier (PMI)

- TLV tag: `5`
- TLV length: var

결제 수단은 실물 카드, 포인트 머니, 상품권 등 PS가 처리할 수 있는 결제 모든 형태의 지급 수단을 뜻합니다. 각 결제 수단은 고유 식별자(ID)가 주어져야 합니다. 식별자는 결제 시스템 전역에서 유일할 수도 있지만, 사용자 수준에서만 식별할 수 있어도 괜찮습니다. 토큰의 길이를 줄이기 위해 식별자를 등록 시퀀스로 정하는 것도 좋은 선택입니다. 

| Global Identifier |          | User-level Identifier |     |
| ----------------- | -------- | --------------------- | --- |
| Client            | PMI      | Client                | PMI |
| dc71a00b          | 33429c1e | dc71a00b              | 2   |
| dc71a00b          | 4b7b81dd | dc71a00b              | 3   |
| e86b6327          | 320fae03 | e86b6327              | 2   |

## Private Payload / Encrypted Payload

암호화 페이로드의 암호화는 [Encryption](./Encryption.md)에서 자세히 다룹니다.

### Auth Token

- TLV tag: `2`
- TLV length: var

인증 토큰은 [인증 유형](#auth-type)의 인증을 위해 전달되는 토큰입니다. 인증 토큰의 구현은 애플리케이션마다 다를 수 있습니다.

### Device Identifier

- TLV tag: `4`
- TLV length: var

사용자 식별자와 연결된 기기 식별자는 다른 기기에서 로그인 또는 원격으로 기기를 로그아웃한 경우, 결제를 진행하지 않도록 하기 위해 사용됩니다.

여러 종류의 Auth type과 Auth Token을 사용하면 새로운 기기에 로그인되었을 때 모든 Auth Token 값을 바꾸지 못핧 수도 있습니다.
Device Identifier로 기기 자체를 식별할 수 있으면 승인 과정을 단순화할 수 있고, 결제를 자세히 추적할 수 있습니다.

### Nonce

- TLV tag: `6`
- TLV length: `4`

Nonce는 암호화 통신(cryptographic communication)에서 암호가 한 번만 사용되는 것을 보장하기 위해 사용되는 무작위 숫자입니다. 

Nonce는 [UUIDv7](https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-7) 값을 이용합니다.

> [!NOTE]
> UUID는 [Common#UUID](./Common.md#uuid)를 참고하여 처리해 주새요.

Nonce는 리플레이 공격(replay attack)을 방지하고, 카운터가 업데이트되기 전 결제에 사용되지 않고 버려진 토큰을 무효화 합니다. 다음 시나리오를 참고해 주세요.

- 버려진 토큰

1. A가 첫 번째 토큰을 발급한다.
2. B가 A의 첫 번째 토큰(QR)의 사진을 찍는다.
3. A가 카운터가 업데이트되기 전 새로운 토큰을 발급한다. (앱 재실행 또는 수동 재발급 등)
4. A의 첫 번째 토큰은 "버려진 토큰"이다.
5. A가 두 번째 토큰으로 결제한다.
6. B가 A의 첫 번째 토큰으로 결제한다. --> 부정 거래!

- 리플레이 공격

1.  A가 토큰을 발급한다.
2.  B가 A의 토큰(QR)의 사진을 찍는다.
3.  A가 결제를 한다.
4.  B가 A의 토큰으로 결제한다. --> 부정 거래!
