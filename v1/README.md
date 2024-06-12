# Local Generated Pay Code

Version: 0.1 (1)

## 1. Abstract

1. 통신이 없는 환경에서 결제 승인을 낼 수 있는 코드를 발급한다.
2. 결제는 키오스크에서 진행하며 키오스크는 인터넷 연결이 되어있다.
3. 코드는 포스와 아무 통신 없이 만들어져야 한다.
4. 한 번 사용된 코드는 다시 결제에 사용할 수 없다.
5. 코드는 만들 떄마다 완전히 새로운 값을 가져야 한다.
6. 생성된 코드는 30초 이내로 만료되어야 한다.
7. 결제코드 생성 알고리즘은 모두가 알고있다고 가정한다.
8. 결제 코드를 통해 카드 ID 등을 알아낼 수 없어야 하고, 이를 유도하여 결제 코드를 생산할 수 없어야 한다.

## 2. Normative References

- [모바일 지금수단 표준-QR코드](archive/모바일%20직불서비스%20표준%20-%20QR코드.pdf)(2018/12) - 로컬 생성 결제 코드는 해당 표준을 기반으로 작성된다.
- [KS X ISO/IEC 18004](https://standard.go.kr/streamdocs/view/sd;streamdocsId=72059307369834348) - 정보 기술 - 자동인식 및 데이터 획득 기술 - 기호 사양 - QR 코드

## QR code

QR 코드는 다음 형식으로 생성합니다.

- 최종 바이너리 결제 코드를 Base64로 인코딩한다.
- Error Correction Level: L
- Maximum version: 13
- Byte 모드로 인코딩 한다.

<details>
    <summary><b>QR 코드는 어디까지 커질 수 있을까?</b></summary>
    QR코드가 너무 커지면 안되기 때문에 QR코드의 정렬 패턴이 6개가 넘지않는 QR 코드를 만들기를 권장한다. 버전 13이 정렬 패턴이 6개인 마지막 버전이다.
    <br />
    만약 base64 인코딩 길이가 너무 길어지면 어떡할까? 이땐 binary값을 사용하여 길이를 줄여볼 수 있다. 현재 명세로 만들어지는 코드는 2,200 bits이다.
</details>

<br />
 
<details>
    <summary><b>왜 Error Correction Level을 L로 할까?</b></summary>
    ECC level은 QR코드 손상에 대처하기 위해 존재한다. 인쇄된 코드나 QR에 이미지를 삽입할 때 유용한다. 하지만 스크린에 QR을 보여주는 경우, ECC level을 높이는 것은 사치이다. 그리고 당연히 레벨이 높을수록 저장할 수 있는 정보의 양은 줄어든다. 따라서 L을 선택하는것은 합리적이다.
</details>

## Payload

결제 코드의 페이로드는 다음 부분으로 구성된다.

- Prefix (접두사)
- Algorithm version (알고리즘 버전)
- User UUID (사용자 UUID)
- Encrypted authentication 

```text
Base64([Prefix][Algorithm version][user uuid]Encrypt([device uuid][MID][HMAC][Nonce]))
       [2 byte][     1 byte      ][ 16 byte ][                 256 byte              ]

base64(275 byte) → 368 chars → remove padding → 367 chars in QR
```

QR 코드에서 Byte mode는 문자열 하나당 8 bits를 사용하므로 총 “2,936 bits”이다. ([QR code actual binary capacity](../QR%20code%20actual%20binary%20capacity.md) 참고.)

Error Correction Level을 L로 설정하면 QR코드 버전은 12가 된다.


### 1. Prefix

디미페이 결제 코드임을 나타내는 접두사.  hex값 `44 50`(DP)를 사용한다.

### 2. Algorithm version

`00000 000(2)` (uint8)

알고리즘 버전은 첫 5 bit를 major 버전, 다음 3 bit를 minor 버전으로 나타낸다.

따라서 major 버전은 32, minor버전은 8까지 표현가능하다.

00001 000 (0x8) → 1.0v

00011 001 (0x19) → 3.1v

#### implementation

- extract major version: `v >> 3` ex) `0x6D >> 3 = 13`
- extract minor version: `v & 7` ex) `0x6D & 7 = 5`

#### 버저닝 규칙

1. major 버전이 같고  minor버전이 다른경우, 결제 코드는 호환가능하다 → 앱 업데이트가 필요없음.

2. major 버전이 다른경우, 결제는 불가능하며, 앱 업데이트가 필요할 수도 있다.

3. major 버전이 32를 넘어가면 prefix를 변경하고 버전은 0.0v부터 다시 카운팅한다.

### 3. User UUID, Device UUID & MID

UUID에서 `-`를 제거하여 사용한다. `-`를 미리 제거하여 저장해두어도 괜찮다.

ex) `c5d1a458-cb07-41e9-8545-9a5564ea0074` → `c5d1a458cb0741e985459a5564ea0074`

### 4. HMAC

[HMAC](https://en.wikipedia.org/wiki/HMAC)은 결제 토큰의 만료일을 나타내는 역할을 한다.

#### 1) Counter 계산

$$
C=\left\lfloor {\frac {T-T_{0}}{T_{X}}}\right\rfloor
$$

- T: 현재 Unix 시각 (클라이언트가 생성)
- T0: 결제수단 등록 시각 (서버에서 받은 값)
- Tx: 카운터 업데이트 주기 (서버에서 받은 값)

> [!NOTE]  
> Unix 시각은 반드시 64-bit 숫자를 사용해야한다.

#### 2) 해시 함수

해시함수는 SHA-256을 사용한다.

#### 3) HMAC 계산

3rd party 패키지를 이용하는것을 권장한다. 직접 구현을 원한다면 [wik](https://en.wikipedia.org/wiki/HMAC) 잠고.

HMAC(K, C)

- K는 OTP Secret

### 5. Nonce

한 번 결제에 사용된 코드를 다시 사용할 수 없없게 하기 위해 nonce값을 사용한다.

uuid v4에서 `-`를 제거한 값을 사용한다.

서버는 nonce를 Tx 동안만 기억하기 때문에 Tx가 지난 뒤, 이전에 사용한 nonce값을 사용하는것이 이론상 가능하지만, 절대 권장하지않는다.

### 6. Encrypted Payment Code

암호화는 OAEP RSA를 사용한다.

- Key Size: 2048 bits
- Hash Algorithm: SHA-256
- Padding: RSA PKCS1 OAEP PADDING

## Implimentation Notes

### 1. Sign up

사용자 등록시 새로운 RAS 키 쌍을 만든다. 키 길이는 2048 bit.

### 2. Onboarding

사용자가 로그인후 새로운 device uuid와 함께 온보딩진행하면 서버는 사용자의 public key와 user uuid를 클라이언트에게 전달한다. 이때 클라이언트는 public key를 사용자 기기에 안전하게 저장한다.

### 3. 결제 수단 등록

1. 카드 정보 입력 후 서버는 빌링키를 발급하고 클라이언트에게 다음 값을 전달한다.
    - payment method id (MID): 카드마다 발급되는 고유 번호 (UUID)
    - OTP Secret (K): HMAC에 사용되는 secret key
    - payment method registered time(T0): 결제 수단이 등록된 시간 (Unix time)
    - OTP Interval(Tx): 카운터 갱신 주기 (default=30)

클라이언트는 인터넷 없이 결제가 가능해야하기 때문에 이 값들을 로컬에 안전하게 저장환다.

1-2. Legacy Register

이전에 등록된 카드의 Payment Method Registered Time은 오프라인결제 이용을 동의한 시각으로 한다.

#### Payment Method Id

모든 Payment Method Id는 중복되지 않는 값을 고유의 값을 가지고 있다. 같은 카드를 등록하더라도 Payment Method Id는 다른 값이 된다.

## Time Sync

(작성 보류)

## Edge cases

### Time Window

시간을 기반으로 카운터를 계산하는 방법은 첫 인증 코드를 만들었을때 만료 시간이 얼마 남지 않을 수도 있을 가능성이 존재한다는 것이다. 또한 인증자와 서버의 시계의 오차 때문에 인증이 실패할 수도 있다.

- S1: 인증자와 서버의 시계는 정확하지만, 네트워크 지연으로 인해 서버가 다음 사이클을 사용하는 경우

- S2: 인증자의 시계가 약간 빠르거나 느린 경우

이를 해결하기 위한 일반적인 방법은 현재 시각의 ±n 개의 사이클을 허용할 수 있고, 이를 Time window 라고한다.

TOTP를 사용할때 Time window는 작을수록 무차별 대입에 안전하다. 하지만 우리는 6자리 TOTP를 사용하는것이 아니기 때문에 Time window를 넉넉하게 설정해도 괜찮다. 그렇다 하더라도 너무 많은 오차를 허용하는것은 너무 많은 연산을 필요로한다.

따라서 보안보단 연산에 대한 부하를 줄이기 위해 Time window는 1로 설정한다. 즉, ±30초에대한 오차를 허용한다.

Time window가 1이라도 항상 연산을 할 필요는 없다. 연산은 오직 사이클 시작 및 종류 시각과 가까워 졌을때만 수행한다.

## 예제

### 1. 사전 정보

새로운 사용자가 등록되면 서버는 2048 bits RSA 키를 생성한다.

- Public key (PKCS1)

```text
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA6zZTB42ogxuC7TJYpYQdMvZ1sew+7T+qCThPgf09/a/ZhgtVOPg9
x1+x1hi1W7Znf4aekRpeUlNnhGDvhOlu7MUGa2ZaiuEemUWFvElsv+/DV8KfooU3
6Vol8p2VTkREiS5a1KcC3hDslnEaKGzJp2kigDKqHuilO1gmKEMrHUFBecxmegfn
+O2Z7AtNyMO3tGXcRdlcQuA/nYtcUYXTh/ek3z7j3Fxp42hB9+8vbzNMq4XlZBfZ
cosBtIJU0hnnzL9QLC1gnvNg1y7si81ssJDrBhZRDRv8hPnXUaaT4sbijg54FeIs
dphmnyCIz8AHmJr0M3sCqVyJe1b5MBUJFwIDAQAB
-----END RSA PUBLIC KEY-----
```

- Private key (PKCS8)

```text
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDrNlMHjaiDG4Lt
MlilhB0y9nWx7D7tP6oJOE+B/T39r9mGC1U4+D3HX7HWGLVbtmd/hp6RGl5SU2eE
YO+E6W7sxQZrZlqK4R6ZRYW8SWy/78NXwp+ihTfpWiXynZVORESJLlrUpwLeEOyW
cRoobMmnaSKAMqoe6KU7WCYoQysdQUF5zGZ6B+f47ZnsC03Iw7e0ZdxF2VxC4D+d
i1xRhdOH96TfPuPcXGnjaEH37y9vM0yrheVkF9lyiwG0glTSGefMv1AsLWCe82DX
LuyLzWywkOsGFlENG/yE+ddRppPixuKODngV4ix2mGafIIjPwAeYmvQzewKpXIl7
VvkwFQkXAgMBAAECggEAcmXFAzb0HvQJ/RhQAgxb8TXqb0MyJcyhhAN1tAi5lkFp
P+cSJ3ehAG97/F+fEUCJXP5Z78PN3SeAgONuiwvHrfNzmFe7MLGl4rDsBvQFJuLT
dMMNRguZ8m4sZ7AZ9muAk+HOPoAOBnhfwRm4ObITb89T/trlX8wR1OeeA1YLyZlN
LejaQDse+5xV+9Gj7ib0AKNuP9CTrPlFq66D0T7whbv5fg7uh/9XsNCsdaFGmcSY
ZuLpUVwMh+Goro+voV9NYKoY1PMEsWmzwHGOm75wI4On/QztTkoVZH3Sm7NyeLUP
t/BasqSN4K3XpmM9Xlhi0xFW7SJGhOL3Q/8aD4Sc+QKBgQD3PmE/n0A/yWQYTDCg
F5+G3bnVGhH86MDmOlm7MyhE1KOELW+l8aVKeBxfQwWLZJsufxuKtGaR9YSx6wcV
zz/mrGAsc5YG4Y2OZyG+n/xYUjj5WRgtV7drFhoTMcz9oW/LcviOk+B6udv/rps7
MHeqvQmfTn0aiwda4IYzWVxPaQKBgQDzityju1BDVRHdR1WErDkXbRk1h+bHm8fG
zQsjb4SGK26CZcGA1funbFqJbhz0ySPTDQ/doCsupcNN6v5xcch+ZN1NZ3dcJVSH
ZOveSlrot7xak9fABRYWO7tWpJHsrERs927lYjlVE3NExpTEC8QeZKC/hVjbskwS
tzZCJCwEfwKBgQDRLp3ozjv1u9ZMGGoriNEXshDAE8aUS/io0UWJ9MZlNeMCuc50
f/ZxAx4+Gt5eCUiiFjifKfJ+G1OhlE/yS96ss7rK4SBVwg+aI/eQ6Jr/vtElZhPm
iQhOOezlwITHMgb8AtH5D3QlYYqY0InVkjQs6LNzbVy7UFVwtfXVDA3lwQKBgBzS
dkI6TMlrK+4QHyLQbwFCvBUFvF4rJX11jrfm3rwyL6Xm/PuOV3X88MoK6gpeM4sq
pJIJ/pJKs85o3Sv3105+CWK7t/iDwnkzjGaGTjP0aqodjQ8AixiegRFD8LEdwgtT
TSCAe2CCKMYe6kQ5UEB4kD2aPmXht/cPD7DMLxlpAoGAY2LN5zP8pHwawPj7TSUJ
mWGF38VNcapYv/ezZfoXwIONsg6uDxcG2yS1RZ6IrkiCZq62HBpDtrfqfUda7Y82
rhRc/XCRmH/iyBZyRYe2MMC44rS9pIynF1cH+FeWJ02B0aNdrpVYTQATZV4uY+aS
/FasmHotKqyW7IuXMRLvnvE=
-----END PRIVATE KEY-----
```

- device uuid

```text
de08c6af-9da1-4720-b7da-2e8ff962510f
```

- user uuid

```text
f2b21e91-6d31-4724-a4fb-bef956440fce
```

### 2. 결제수단

결수 수단이 동록되면 클라이언트는 다음 값을 서버로부터 받는다.

- payment method id (MID): `9fb961c8-187f-4b46-8f30-c76021cf3ed8`
- OTP Secret (K):  `GoQnxXeW+fjlzo7JSTVcwcDFxME=`
- payment method registered time(T0): `1705896544745`
- OTP Interval(Tx): `30`

클라이언트는 해당 값들을 기기에 안전하게 저장한다.

### 3. QR 데이터 생성

#### 1) Prefix

hex값 `44 50`을 사용한다.

#### 2) Algorithm version

예시로 1.5 버전을 사용한다고하면, `00001 101`, hex 값으론 `13`을 사용한다.

#### 3) User UUID

user uuid에서 `-`를 뺸 값을 추가한다.

```text
00000000: 44 50 00 F2 B2 1E 91 6D 31 47 24 A4 FB BE F9 56  DP.....m1G$....V
00000010: 44 0F CE                                         D..
```

#### 4) HMAC 생성

먼저 카운터를 계산한다. (T = `1705897217563`)

Math.floor((1705897217563 - 1705896544745) / 30) = `22427`

SHA-256 알고리즘을 적용하면 다음과같다.

```text
6e48fb06ddbe1e66cff7675f1010db12137b5175cf9eecba9200b15a856548d9
```

#### 5) Nonce 생성

uuid v4로 nonce값을 생성한다.

```text
bd3f28b163014ca4af8a802c482306f3
```

#### 6) 암호화

준비된 값을 연결한다.

[device uuid] [MID] [HMAC] [Nonce]

```text
de08c6af9da14720b7da2e8ff962510f9fb961c8187f4b468f30c76021cf3ed86e48fb06ddbe1e66cff7675f1010db12137b5175cf9eecba9200b15a856548d9bd3f28b163014ca4af8a802c482306f3
```

OAEP RSA 암호화.

```text
7437f1517aa5c3ef30eea0a01002b114fce039c0c2b0e917fffff1aca09a3a35cf628f1405d0bd2661305a257223e25dce78ce108852822e2e78dce3b5f3d5f07c6294b8d4d0c5114eb246bfe0d03082227836353c7c3408dd92dd5df26221f19b5a0a7c0a74873c69dfc1e601aa69ffa4dbcbb1ecd626d31631331d92d873661caa8b1f708be9c6d0651bc841513f89937c48f04ac0968c75bb3a30392618971fe3b2d379278557a45d5eb2752ddd7f9c3245219d7c7f0efadf0337e05c18c31fbbacd3263d2429e5700550b92bce1e0d3ecc1291725ae1bd83ee7f60419b1202da325eb55cf014cb0cb4aa35dd8b2fb5f1e9374972e64290f3e50d3e743ad2
```

전체 코드는 다음과 같다.

```text
00000000: 44 50 13 F2 B2 1E 91 6D 31 47 24 A4 FB BE F9 56  DP.....m1G$....V
00000010: 44 0F CE 74 37 F1 51 7A A5 C3 EF 30 EE A0 A0 10  D..t7.Qz...0....
00000020: 02 B1 14 FC E0 39 C0 C2 B0 E9 17 FF FF F1 AC A0  .....9..........
00000030: 9A 3A 35 CF 62 8F 14 05 D0 BD 26 61 30 5A 25 72  .:5.b.....&a0Z%r
00000040: 23 E2 5D CE 78 CE 10 88 52 82 2E 2E 78 DC E3 B5  #.].x...R...x...
00000050: F3 D5 F0 7C 62 94 B8 D4 D0 C5 11 4E B2 46 BF E0  ...|b......N.F..
00000060: D0 30 82 22 78 36 35 3C 7C 34 08 DD 92 DD 5D F2  .0."x65<|4....].
00000070: 62 21 F1 9B 5A 0A 7C 0A 74 87 3C 69 DF C1 E6 01  b!..Z.|.t.<i....
00000080: AA 69 FF A4 DB CB B1 EC D6 26 D3 16 31 33 1D 92  .i.......&..13..
00000090: D8 73 66 1C AA 8B 1F 70 8B E9 C6 D0 65 1B C8 41  .sf....p....e..A
000000a0: 51 3F 89 93 7C 48 F0 4A C0 96 8C 75 BB 3A 30 39  Q?..|H.J...u.:09
000000b0: 26 18 97 1F E3 B2 D3 79 27 85 57 A4 5D 5E B2 75  &......y'.W.]^.u
000000c0: 2D DD 7F 9C 32 45 21 9D 7C 7F 0E FA DF 03 37 E0  -...2E!.|.....7.
000000d0: 5C 18 C3 1F BB AC D3 26 3D 24 29 E5 70 05 50 B9  \......&=$).p.P.
000000e0: 2B CE 1E 0D 3E CC 12 91 72 5A E1 BD 83 EE 7F 60  +...>...rZ.....`
000000f0: 41 9B 12 02 DA 32 5E B5 5C F0 14 CB 0C B4 AA 35  A....2^.\......5
00000100: DD 8B 2F B5 F1 E9 37 49 72 E6 42 90 F3 E5 0D 3E  ../...7Ir.B....>
00000110: 74 3A D2                                         t:.
```

#### 7) Base64 인코딩

```text
RFAT8rIekW0xRySk+775VkQPznQ38VF6pcPvMO6goBACsRT84DnAwrDpF///8aygmjo1z2KPFAXQvSZhMFolciPiXc54zhCIUoIuLnjc47Xz1fB8YpS41NDFEU6yRr/g0DCCIng2NTx8NAjdkt1d8mIh8ZtaCnwKdIc8ad/B5gGqaf+k28ux7NYm0xYxMx2S2HNmHKqLH3CL6cbQZRvIQVE/iZN8SPBKwJaMdbs6MDkmGJcf47LTeSeFV6RdXrJ1Ld1/nDJFIZ18fw763wM34FwYwx+7rNMmPSQp5XAFULkrzh4NPswSkXJa4b2D7n9gQZsSAtoyXrVc8BTLDLSqNd2LL7Xx6TdJcuZCkPPlDT50OtI=
```

문자열 길이가 368이라는 것을 확인할 수 있다.

#### 8) QR 코드 생성

Error Correction Level을 L로 하고, byte모드로 QR코드를 생성한다.

![result.png](static/result.png)
