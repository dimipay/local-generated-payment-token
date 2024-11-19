# Payload

전체 페이로드는 아래의 하위 페이로드로 구성됩니다.

- Metadata Payload

  - Payload Format Indicator (페이로드 포멧 지시자)
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

메타데이터 페이로드를 제외한 모든 페이로드는 [TLV](./TLV.md) 포멧을 사용합니다. 페이로드에서 TLV 블록의 순서는 중요하지 않습니다.

전체 페이로드는 메타데이터 페이로드, 일반 페이로드, 프라이빗 페이로드 순서로 결합시켜 완성합니다.

### Payload Length Indicator (PLI)

메타데이터 페이로드를 제외한 모든 페이로드의 가장 앞에는 Payload Length Indicator가 반드시 있어야 합니다.
Payload Length Indicator 역시 TLV 블록이며, 페이로드의 바이트수를 나타냅니다.

결제 서버는 패이로드가 기대되는 순서에서 Payload Length Indicator를 찾을 수 없으면 오류를 반환해야 합니다.

예를들어 Common Payload가 1 바이트의 Auth Type 값, 16 바이트의 User Identifier, 1 바이트의 Payment Method Identifier를 포함한다면, 총 페이로드의 크기는 21((1+1) + (1+16) + (1+1)) 바이트 이므로, 다음과 같이 나타낼 수 있습니다.

```text
  0111   0000  0001 0101   [ Auth Type TLV ] [User Identifier TLV] ..
├ tag ┘└ len ┘└   value  ┤
└  Length Indicator TLV  ┘
```

## Metadata Payload

메타데이터 페이로드는 예외적으로 PLI를 포함한 TLV 포멧을 사용하지 않고, 미리 정의된 페이로드 포멧을 따릅니다. 고정된 순서로 필드를 배치하면 미리 base45 인코딩 값을 계산하여 빠르게 토큰 검사가 가능하기 때문입니다.

### Payload Format Indicator

페이로드 포멧 지시자는 토큰이 LGPT임을 나타내냅니다. `0x4c 0x50` 값을 사용합니다.

### Application Identifier

토큰을 생성한 애플리케이션을 나타냅니다. 4바이트 크기이며, 패딩으로 `0xff`를 사용합니다.

페이로드 포멧 지시자와 같은 맥락으로 크키는 2n 바이트입니다.

`0x44 0x50` -> `0x44 0x50 0xff 0xff`

### Version

버전은 LGPT의 사양 버전을 나타내는 1바이트 정보입니다.
버전의 첫 4비트는 major 버전, 다음 4비트는 minor 버전을 나타냅니다.

```text
1) 0001 0000 (0x10) → 1.0v
2) 0011 0101 (0x35) → 3.5v
```

버전은 문서 자체의 버전과 동일합니다. major 버전은 하위 호환 되지 않는 수정이 이루어지는 경우에 변경됩니다. minor 버전 업데이트는 같은 major 버전에 대한 하위 호환을 보장하지만, 보안상의 이유로 이전 버전이 deprecated되는 경우, 이전 버전 토큰의 결제 지원을 중단해야합니다.

> [!CAUTION]
> 0.x 버전은 하위 호환성을 제공하지 않습니다.

## Common Payload

일반 페이로드는 암호화가 필요없는 일반 정보를 담습니다.

### Auth Type

인증 유형을 나타내는 1바이트 정보입니다. LGPT 사양은 `0xxx xxxx` 네임스페이스를 예약합니다. 정의된 유형은 다음과 같습니다.

1. `0000 0001(0x01)` - Bypass (인증을 거치지 않음.)
2. `0001 0000(0x10)` - Local Auth
    1. `0001 0001(0x11)` - Pattern Auth (sub type of local auth)
    2. `0001 1000(0x18)` - Bio Auth (sub type of local auth)
        1. `0001 1001(0x19)` - Fingerprint Auth (sub type of bio auth)
        2. `0001 1010(0x1a)` - Face Auth (sub type of bio auth)
        3. `0001 1011(0x1b)` - Iris Auth (sub type of bio auth)

사용자 정의 유형은 `1xxx xxxx` 형식을 사용합니다. `1000 0001(0x81)`과 같이 정의할 수 있습니다.

### User Identifier

사용자 식별자는 전역적으로 유일한(globally unique) 값을 사용해야 합니다. GUID(UUIDv4)를 사용하는게 일반적입니다.

> [!NOTE]
> UUID는 [Common#UUID](./Common.md#uuid)를 참고하여 처리 해주새요.
> 
### Payment Method Identifier

결제 수단은 실물 카드, 포인트 머니, 상품권 등 PS가 처리할 수 있는 결제 모든 현태의 지급 수단을 뜻합니다. 각 결제 수단은 고유 식별자(ID)가 주어저야 합니다. 식별자는 결제 시스템 전역에서 유일할 수도 있지만, 사용자 수준에서만 식별할 수 있어도 괜찮습니다. 토큰의 길이를 줄이기 위해 식별자를 등록 시퀀스로 정하는 것도 좋은 선택입니다. 

| Global Identifier |          | User-level Identifier |     |
| ----------------- | -------- | --------------------- | --- |
| Client            | PMI      | Client                | PMI |
| dc71a00b          | 33429c1e | dc71a00b              | 2   |
| dc71a00b          | 4b7b81dd | dc71a00b              | 3   |
| e86b6327          | 320fae03 | e86b6327              | 2   |

## Private Payload / Encrypted Payload

암호화 페이로드는 [Encryption](./Encryption.md) 섹션에서 설명된 지시에따라 암호화를 진행합니다.

### Auth Token

인증 토큰은 [인증 유형](#auth-type)의 인증을 위해 전달되는 토큰입니다. 인증 토큰의 구현은 애플리케이션마다 다를 수 있습니다.

### Device Identifier

사용자 식별자와 연결된 기기 식별자는 다른 기기에서 로그인 또는 원격으로 기기를 로그아웃한 경우, 결제를 진행하지 않도록 하기 위해 사용됩니다.


### Nonce

Nonce는 암호화 통신(cryptographic communication)에서 암호가 한 번만 사용되는것을 보장하기위해 사용되는 무작위 숫자입니다. 여기서 사용되는 Nonce는 리플레이 공격(replay attack)을 막는 역할이 있습니다.

OS의 CSPRNG를 사용하여 생성한 16 바이트 랜덤 값을 사용합니다.
