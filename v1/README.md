# Local Generated Pay Token

Document Version: 0.3.0

## Tabel of Contents

1. Introduction
2. Normative References
3. Abbreviations
4. Local Generated Pay Token
    1. Payment System Model
    2. Encryption Key
    3. Authentication
    4. Payload
    5. QR Code Encoding
    
A. Annex A - Example

## 1. Introduction

Local Generated Pay Token(로컬 생성 결제 토큰)은 사용자 기기가 결제 서버와 통신없이 만들 수 있는 CPM QR 형식의 결제 토큰을 뜻합니다.
이 사양의 가장 큰 목표는 밖에서 인터넷 사용이 원할하지 않은 사용자의 빠른 결제 경험을 제공하는 것입니다. 추가로 애플리케이션의 오프라인 모드 지원 및 일관된 토큰 발급 속도를 보장할 수 있습니다.

이 사양은 EMV QRCPS과 다른 EMV 가이드라인을 참고하여 만들어졌지만, 가장 큰 차이점은 토큰 인가(authorize)가 오프라인에서 이루어진다는 것입니다.

> EMV QR Code payment transactions are online authorised.

## 2. Normative References

- [모바일 지금수단 표준-QR코드](archive/모바일%20직불서비스%20표준%20-%20QR코드.pdf)(2018/12)
- [KS X ISO/IEC 18004](https://standard.go.kr/streamdocs/view/sd;streamdocsId=72059307369834348) - 자동인식 및 데이터 획득 기술 - 기호 사양 - QR 코드

## 3. Abbreviations

- CD: Client Device
- LGPT: Local Generated Pay  Token
- PM: Payment Method
- PSM: Payment System Model
- PS: Payment System
- PT: Payment Terminal

## 4. Local Generated Pay Token

### 4.1. Payment System Model

Payment System Model(결제 시스템 모델)은 LGPT가 사용되는 환경과 참여 주체를 포함합니다. 포함되는 주체는 다음과 같습니다.

- Payment Server (결제 서버)
- Payment Terminal (결제 단말기)
- Client (사용자/클라이언트)
- Client Device(사용자 기기/클라이언트 디바이스)
- Payment Method (결제 수단)

#### 4.1.1. Payment Server

결제 서버는 사용자의 카드 정보 저장이나 결제 승인을 수행 등을 담당하는 서버를 일컫습니다.
EMV의 Acquirer와 유사한 성격을 가집니다.

#### 4.1.2. Payment Terminal

결제 단말기는 CD에서 제시되는 QR 코드를 읽고 PS와 통신하여 결제 승인을 요청하는 주체입니다.
PT는 다음 최소 요구사항을 만족해야합니다.

- QR 코드를 읽을 수 있는 외부 리더기 혹은 카메라가 있다.
- 안전한 인터넷이 상시 연결되어있다.

#### 4.1.3. Client

결제에 참여하는 사람으로 결제 수단을 등록하고 결제 비밀번호를 설정 및 변경 하는 등의 작업을 할 수 있습니다.

#### 4.1.4. Client Device

사용자와 상호작용하며 결제 토큰을 생성하는 주체입니다. 사용자가 여러 기기에서 동시에 로그인을 하도록 허락하거나 단일 기기 로그인만 허락하는것은 자유입니다. 하지만 결제는 반드시 사용자가 알고있는 기기에서만 진행되어야합니다.

#### 4.1.5. Payment Method

결제 수단은 실물 카드, 포인트 머니, 상품권 등 PS가 처리할 수 있는 결제 모든 현태의 지급 수단을 뜻합니다.각 결제 수단은 고유 식별자(ID)가 주어저야 합니다. 식별자는 PS에서 전역적일 수도 있지만, 사용자 수준에서만 식별할 수 있어도 괜찮습니다. 토큰의 길이를 줄이기 위해 식별자를 등록 시퀀스로 정하는 것도 좋은 선택입니다.

|  Global Identifier ||  User-level Identifier ||
| :------: | :------: | :--------: | :--------: |
|  Client  |   PM ID  |   Client   |    PM ID   |
| dc71a00b | 33429c1e |  dc71a00b  |      2     |
| dc71a00b | 4b7b81dd |  dc71a00b  |      3     |
| e86b6327 | 320fae03 |  e86b6327  |      2     |

### 4.2. Encryption

LGPT는 애플리케이션에 저장된 데이터를 PT를 거쳐 PS까지 전달하기위해 대칭키(symmetric key) 암호를 사용합니다.

#### 4.2.1 Encryption Algorithm

권장하는 알고리즘은 다음과 같습니다.

- AES-CCM
- AES-GCM

#### 4.2.2. Key Exchange

CD는 PS로 부터 암호키를 받기위해 안전한 전송 프로토콜을 사용해야합니다.
복잡성을 줄이고 싶다면 HTTPS만 사용해도 괜찮지만, 필요하다면 별도의 키 교환 프로토콜을 사용합니다.

### 4.3. Authentication

인증은 결제 토큰을 생성하는 주체가 실제 결제 수단 소유자가 맞는지 확인하는 과정입니다.
온라인 인증 시스템은 보통 PIN 인증과 로컬 인증을 동시에 제공합니다. 하지만 오프라인 인증에선 PIN 인증을 제공하기에 어려움이 있습니다. PIN 일치 여부를 바로 평가할 수 없기 때문입니다.

#### 4.3.2. Local Auth and Auth Token

로컬 인증애 성공하면 사용자 기기에 저장된 Auth Token을 불러옵니다. Auth token은 HMAC secret으로 사용됩니다.

### 4.4. Payload

토큰 페이로드는 다음으로 구성됩니다.

- Metadata
    - Payload Format Indicator (페이로드 포멧 지시자)
    - Application Identifier (애플리케이션 식별자)
    - Version (버전)
- Auth Type (인증 유형)
- User Identifier (사용자 식별자)
- Encrypted payload
    - Device Identifier (기기 식별자)
    - Payment Method Identifier (결제 수단 식별자)
    - HMAC
    - Nonce

#### 4.4.1. Payload Format Indicator

페이로드 포멧 지시자는 토큰이 LGPT임을 나타내냅니다. `0x4c 0x50` 값을 사용합니다.

#### 4.4.2. Application Identifier

토큰이 만들어진 애플리케이션을 나타냅니다. 4바이트를 사용하며, 남은 자리는 `0xff`로 채웁니다.

`0x44 0x50` -> `0x44 0x50 0xff 0xff`

#### 4.4.3. Version

버전은 LGPT의 사양 버전을 나타내는 1바이트 정보입니다.
버전의 첫 4비트는 major 버전, 다음 4비트는 minor 버전을 나타냅니다.

`0000 0000`

```text
1) 0001 0000 (0x10) → 1.0v
2) 0011 0101 (0x35) → 3.5v
```

버전은 문서 자체의 버전과 동일합니다. major 버전은 코어 스펙 변경, minor 버전은 보안 수정 등의 변경, 그리고 patch 버전은 문서 수준의 수정이 발생했을 때 업데이트됩니다. 버전 호환성은 서버 구현에 따라 달라지며, 서버는 최신 major만 지원하는것이 좋습니다.

#### 4.4.4. Auth Type

인증 유형을 1바이트 정보입니다. 사양에서 정의하는 유형은 `0xxx xxxx` 형식을 따릅니다. 사용자 정의 유형은 `1xxx xxxx` 형식을 사용합니다. 미리 정의된 인증 유형은 다음과 같습니다.

1. `0000 0001(0x01)` - Bypass
2. `0001 0000(0x10)` - Local Auth
3. `0001 0001(0x11)` - Pattern Auth (sub type of local auth)
4. `0001 1000(0x18)` - Bio Auth (sub type of local auth)
5. `0001 1001(0x19)` - Fingerprint Auth (sub type of bio auth)
6. `0001 1010(0x1a)` - Face Auth (sub type of bio auth)
7. `0001 1011(0x1b)` - Iris Auth (sub type of bio auth)

사용자 지정 유형은 `1000 0001(0x81)`과 같이 정의할 수 있습니다.

#### 4.4.5. User Identifier

사용자 식별자는 구현에따라 다릅니다. 하지만 사용자 식별자를 시퀀스로 번호로 사용하는것은 권장하지 않습니다. 다른 임의의 사용자 식별자를 쉽게 알 수 있다면 위조 감지를 발생하여 다른 사용자의 결제를 불가능하게 만드는 공격이 가능해집니다.

#### 4.4.6. HMAC

토큰 유효 시간 인증하기위해 HMAC을 사용합니다. HMAC 파라미터에는 K(secret key)와 m(인증할 메시지)이 있습니다. K는 Auth token이고, m은 카운터(C)입니다. 카운터는 다음 공식으로 계산됩니다.

$$
C=\left\lfloor {\frac {T-T_{0}}{T_{X}}}\right\rfloor
$$

여기서 T는 현재 Unix 시각, T0는 PM이 PS에 등록된 Unix 시각, Tx는 카운터 업데이트 주기입니다.

> [!NOTE]  
> Unix 시각은 반드시 64-bit 숫자를 사용해야합니다.

HAMC에 사용되는 해시함수는 SHA2 또는 SHA3를 사용하기를 권장합니다.

#### 4.4.7. Time Window

카운터를 계산법의 특성상 카운터를 계산했을 당시 카운터의 유효시간이 얼마 남지 않을 수도 있을 가능성이 존재합니다. 이를 해결하기 위한 일반적인 방법은 현재 시각을 기준으로 ±n 개의 HMAC값을 허용하는 것입니다. 이를 Time window라고합니다.

HMAC 값을 무작위 대입으로 맞추는것은 거의 불가능하기때문에 Time window를 넉넉하게 설정해도 괜찮습니다. 하지만 굳이 많이 허용할 필요는 없습니다. 일반적으로 Tx는 30초에서 1분을 사용하므로 time window 값을 1로 설정해도 충분합니다.

HMAC 비교에 실패했다고 무조건 Time window를 고려하지 않아도 됩니다. 연산은 Time window 가능성이 있을때, 즉 HMAC 사이클 종료 시간이 가까워 졌을때만 수행하는것이 보안상 좋습니다.

#### 4.4.8. Nonce

Nonce는 암호화 통신(cryptographic communication)에서 암호가 한 번만 사용되는것을 보장하기위해 사용되는 무작위 숫자입니다. 여기서 사용되는 Nonce는 리플레이 공격(replay attack)을 막는 역할이 있습니다.

PS는 모든 Nonce를 기억할 필요가 없습니다. HMAC의 업데이트 주기 동안만 Nonce를 기억하면 됩니다. 리플레이 공격이 시도되면 HMAC 검증이 실패하기 때문입니다.

## 4.5. QR Code Encoding

먼저 계산된 결제 토큰을 이진화하고, B64로 인코딩합니다. 그리고 다음 파라미터를 사용하여 QR코드를 생성합니다.

> [!NOTE]
> B64는 Base64와 같지만 패딩(`=`)을 제거합니다.

- 모드(Mode): 확장 채널 해석 모드(ECI)와 바이트 모드
- 에러 정정 레벨(Error correction level): L, M, Q, H
- 버전(Symbol Version): 가능한 가장 작은 버전 사용

### 4.5.1. Error Correction Level

QR코드는 사용자 기기의 스크린을 통헤 나타납니다. 그리고 기기는 QR의 흑백을 뚜렷하게 구별하기위해 화면 밝기를 최대로 올릴것입니다. 그래서 일반적인 상황에선 에러 정정 레벨을 L또는 M으로 사용해도 문제가 없을 것입니다. 하지만 항상 밝기가 최대로 올라간다고 보장할 순 없습니다. 이런 예외 상황에서만 에러 정정 레벨을 Q또는 H로 사용하도록 설계할 수 있습니다. 이 부분은 실제 사용하는 QR 리더기로 테스트해보며 조절해야합니다.

### 4.5.2. Maximum Version

QR Code의 버전은 40까지 있지만, 당연히 버전 40짜리 QR을 나태내진 않을것입니다. 그러면 버전은 어디까지 허용하는것이 바람직 할까요? 이 문서에선 버전 13을 최대 버전으로 권장합니다. 이유는 정렬 패턴의 개수입니다. 버전 13까진 QR의 정렬 패턴 개수가 6개이지만 버전 14부턴 패턴의 개수가 13개가 됩니다.

현재 사양으론 버전 13을 넘어가긴 어렵습니다. 하지만 페이로드가 너무 커진다면 [QR code actual binary capacity](../QR%20code%20actual%20binary%20capacity.md)를 참고해주세요. 버전 10 부터 13까지 바이트 모드를 사용했을때 실제로 저장가능한 데이터 용량을 정해두었습니다.-------------------------------------------------

## Annex A - Example (need update for 0.3.0)

### 1. Payload Format Indicator

hex값 `4c 50`을 페이로드 포멧 지시자로 사용합니다.

```text
00000000: 44 50                                            DP
```

### 2. Version

버전을 1.2라고 하면 사용되는 값은 `0001 0010`, hex값 `12`을 사용합니다.

```text
00000000: 44 50 12                                         DP.
```

### 3. Auth Type

로컬 인증 중 얼굴 인식으로 인증을 진행했다고 하면 Auth Type은 `0x18`입니다.

```text
00000000: 44 50 12 18                                      DP..
```

### 4. User Identifier

사용자 식별자는 `320fae03-9d72-4c19-816d-2c2d1d5b7ca2`라고 하겠습니다.
바이너리로 처리하기위해 `-`를 제거한 값을 사용합니다.

```text
00000000: 44 50 12 18 32 0F AE 03 9D 72 4C 19 81 6D 2C 2D  DP..2....rL..m,-
00000010: 1D 5B 7C A2                                      .[|.
```

### 4. Encrypted Payload

#### 4.1. Device Identifier

기기 식별자는 `265bed1a-9b4a-47fc-8765-b421d67a1458`라고 하겠습니다. 사용자 식별자와 같이 `-`를 제거합니다.

```text
00000000: 26 5B ED 1A 9B 4A 47 FC 87 65 B4 21 D6 7A 14 58  &[...JG..e.!.z.X
```

#### 4.2. Payment Method Identifier

결제 수단 사용자 수준에서 시퀀스 숫자로 구분되는 시스템이라고 가정해보겠습니다. 사용자가 두 번째 결제 수단을 선택했다고하면 `0x01` 값을 사용할 수 있습니다.

```text
00000000: 26 5B ED 1A 9B 4A 47 FC 87 65 B4 21 D6 7A 14 58  &[...JG..e.!.z.X
00000010: 01                                               .
```

#### 4.3. HMAC

HMAC을 계산합니다. 사용할 파라미터값은 다음과 같습니다.

- Hash Algorithm: `SHA256`
- payment method registered time(T0): `1705896544745`
- OTP Interval(Tx): `30`
- Current time(T): `1721089757738`
- Auth Token: `9243787e-0099-4a57-9cd2-a8d786e1f04e`

C(카운터)를 계산합니다.

$$
C=\left\lfloor {\frac {T-T_{0}}{T_{X}}}\right\rfloor=\left\lfloor {\frac {1721089757738-1705896544745}{30}}\right\rfloor=506440433
$$

C를 이용해 HMAC을 계산하면 `db37b1754358e775a61d132a6da85e31320a4816a91a13810244c81367339d2d`입니다.

#### 4.4. Nonce

Nonce 값으로 16바이트 랜덤 값을 사용하겠습니다.

`e708879e4e5d28b72462e77e58a3db9c`

### 5. Encrypt

암호하 페이로드는 다음과 같습니다.

```text
00000000: 26 5B ED 1A 9B 4A 47 FC 87 65 B4 21 D6 7A 14 58  &[...JG..e.!.z.X
00000010: 01 DB 37 B1 75 43 58 E7 75 A6 1D 13 2A 6D A8 5E  ..7.uCX.u...*m.^
00000020: 31 32 0A 48 16 A9 1A 13 81 02 44 C8 13 67 33 9D  12.H......D..g3.
00000030: 2D E7 08 87 9E 4E 5D 28 B7 24 62 E7 7E 58 A3 DB  -....N](.$b.~X..
00000040: 9C                                               .
```

암호화 알고리즘으로 AES-192-GCM을 사용하겠습니다. 사용되는 파라미터는 다음과 같습니다.

- iv: `2cabcdc0825308f3881996f9`
- key: `5d1d30bb984b4327671dd503912d92e5`

암호화 결과는 다음과 같습니다.

- auth tag: `5c87e02c32591c50254204fd938cd023`
- encrypted data: `d91c0b86cbf1a938f11574e3def288502aa1c5bd9696a79b9cae23281271a4614c9d783c332730faa11ca3ba324c02ef3a0fb91aab0511613e54692e17312c5b2f`

최종 결과는 iv 길이, iv, auth tag, encrypted data를 합친 값으로 산출합니다.

```text
00000000: 0C 2C AB CD C0 82 53 08 F3 88 19 96 F9 5C 87 E0  .,....S......\..
00000010: 2C 32 59 1C 50 25 42 04 FD 93 8C D0 23 D9 1C 0B  ,2Y.P%B.....#...
00000020: 86 CB F1 A9 38 F1 15 74 E3 DE F2 88 50 2A A1 C5  ....8..t....P*..
00000030: BD 96 96 A7 9B 9C AE 23 28 12 71 A4 61 4C 9D 78  .......#(.q.aL.x
00000040: 3C 33 27 30 FA A1 1C A3 BA 32 4C 02 EF 3A 0F B9  <3'0.....2L..:..
00000050: 1A AB 05 11 61 3E 54 69 2E 17 31 2C 5B 2F        ....a>Ti..1,[/
```

### 6. Final data

최종 토큰은 다음과 같습니다.

```text
00000000: 44 50 12 18 32 0F AE 03 9D 72 4C 19 81 6D 2C 2D  DP..2....rL..m,-
00000010: 1D 5B 7C A2 0C 2C AB CD C0 82 53 08 F3 88 19 96  .[|..,....S.....
00000020: F9 5C 87 E0 2C 32 59 1C 50 25 42 04 FD 93 8C D0  .\..,2Y.P%B.....
00000030: 23 D9 1C 0B 86 CB F1 A9 38 F1 15 74 E3 DE F2 88  #.......8..t....
00000040: 50 2A A1 C5 BD 96 96 A7 9B 9C AE 23 28 12 71 A4  P*.........#(.q.
00000050: 61 4C 9D 78 3C 33 27 30 FA A1 1C A3 BA 32 4C 02  aL.x<3'0.....2L.
00000060: EF 3A 0F B9 1A AB 05 11 61 3E 54 69 2E 17 31 2C  .:......a>Ti..1,
00000070: 5B 2F                                            [/
```

B64 인코딩 결과는 다음과 같습니다.

```text
RFASGDIPrgOdckwZgW0sLR1bfKIMLKvNwIJTCPOIGZb5XIfgLDJZHFAlQgT9k4zQI9kcC4bL8ak48RV0497yiFAqocW9lpanm5yuIygScaRhTJ14PDMnMPqhHKO6MkwC7zoPuRqrBRFhPlRpLhcxLFsv
```

### 7. QR Code

QR 코드를 생성하기위해 다음 파라미터를 사용합니다.

- Mode: byte
- Error Correction Level: L

![result](./static/result.png)