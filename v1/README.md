# Local Generated Pay Code

## Goal / Preconditions

1. 통신이 없는 환경에서 결제 승인을 낼 수 있는 코드를 발급한다.
2. 결제는 키오스크에서 진행하며 키오스크는 인터넷 연결이 되어있다.
3. 코드는 포스와 아무 통신 없이 만들어져야 한다.
4. 한 번 사용된 코드는 다시 결제에 사용할 수 없다.
5. 코드는 만들 떄마다 완전히 새로운 값을 가져야 한다.
6. 생성된 코드는 30초 이내로 만료되어야 한다.
7. 결제코드 생성 알고리즘은 모두가 알고있다고 가정한다.
8. 결제 코드를 통해 카드 ID 등을 알아낼 수 없어야 하고, 이를 유도하여 결제 코드를 생산할 수 없어야 한다.
9. QR코드는 다음 조건으로 생성된다.
    - Error Correction Level: L
    - Maximum version: 13
    - base64 인코딩 결과를 사용한다.
    - Byte 모드로 인코딩 한다.

## Specification

결제 코드는 다음 세 부분으로 구성된다.

```text
Base64([Prefix][Algorithm version][user uuid]Encrypt([device uuid][MID][HMAC][Nonce]))
       [2 byte][     1 byte      ][ 16 byte ][                 256 byte              ]

base64(275 byte) → 368 chars → remove padding → 367 chars in QR
```

QR 코드에서 Byte mode는 문자열 하나당 8 bits를 사용하므로 총 “2,936 bits”이다. ([QR code actual binary capacity](../QR%20code%20actual%20binary%20capacity.md) 참고.)

Error Correction Level을 L로 설정하면 QR코드 버전은 12가 된다.

<details>
    <summary><b>QR 코드는 어디까지 커질 수 있을까?</b></summary>
    QR코드가 너무 커지면 안되기 때문에 QR코드의 alignment가 6개가 넘지않는 QR 코드를 만들기를 권장한다. 버전 13이 alightment가 6개인 마지막 버전이다.
    <br />
    만약 base64 인코딩 길이가 너무 길어지면 어떡할까? 이땐 binary값을 사용하여 길이를 줄여볼 수 있다. 현재 명세로 만들어지는 코드는 2,200 bits이다.
</details>

<br />
 
<details>
    <summary><b>왜 Error Correction Level을 L로 할까?</b></summary>
    ECC level은 QR코드 손상에 대처하기 위해 존재한다. 인쇄된 코드나 QR에 이미지를 삽입할 때 유용한다. 하지만 스크린에 QR을 보여주는 경우, ECC level을 높이는 것은 사치이다. 그리고 당연히 레벨이 높을수록 저장할 수 있는 정보의 양은 줄어든다. 따라서 L을 선택하는것은 합리적이다.
</details>

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

UUID에서 `-`를 제거하여 사용한다.  `-`를 제거하여 저장해두어도 괜찮다.

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

## 예제

사용자 등록부터 결제 코드 생성까지의 예제이다.

### 1.  Sign up

새로운 사용자가 등록되면 서버는 2048 bits RSA 키를 생성한다.

- Public key

```text
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA48g6HZ8XOslUNeBI3q/7emQ8EjpxmqALN75gcJAuEwPKR1Px2eiE+cv4gSs+yXkWdL0cxgs5Av+6qPj8pCK2ogBfABAdLBulHEoeHL6EJOOvXiXVlN+SX6FqgaaSWUsSEgn9CcrRKtFu+4YGLfgsXSONkVjHflwW4JFW+20NnyB03dvNM9p8+1wYVkLnWfcq69ibT854CvgffmqFDX84GXx1lcymPI5rKG1ES8Qd/o92GLde5H1EGPXP+hvYX5o71BuFxVY4lGQFGqPMYI8ChgAdoznt9jsL5HU68VJ0AUrUEHTXbvu3u8XJQyt+IgocT/uK450pQOW6j8iBGXlNUwIDAQAB
```

- Private key

```text
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDjyDodnxc6yVQ14Ejer/t6ZDwSOnGaoAs3vmBwkC4TA8pHU/HZ6IT5y/iBKz7JeRZ0vRzGCzkC/7qo+PykIraiAF8AEB0sG6UcSh4cvoQk469eJdWU35JfoWqBppJZSxISCf0JytEq0W77hgYt+CxdI42RWMd+XBbgkVb7bQ2fIHTd280z2nz7XBhWQudZ9yrr2JtPzngK+B9+aoUNfzgZfHWVzKY8jmsobURLxB3+j3YYt17kfUQY9c/6G9hfmjvUG4XFVjiUZAUao8xgjwKGAB2jOe32OwvkdTrxUnQBStQQdNdu+7e7xclDK34iChxP+4rjnSlA5bqPyIEZeU1TAgMBAAECggEAAwu6CIwIYdHasr8QBQzyCOiZi7OFB13yfclUPXfAFfhWq8N/QrxYODA2X3Z2PXgas8Q/mT+sgHzDld+BHqoUKnBk1M8NBM+jJ+YEfGU+cRvWTCT8s86VhM/XaRUSyeeLaKWs4NpPF7Ul4xkfW11Wgob81/UJnd1EtQtceroyP27Hi2tdcMkcOPDVX5ZFOdkp2/T4ER+9WNqFRrHBits90p09INc1GIRrM1QDjB0RkNWPDU++ar0JRbUy8/cAN2686GOI4l4goFqxqcXaok8Y//gBNRRRXPzFMr544CIOcal6cZsBmhwczwjRRHvadJmz/rFFRuR4cnYi1fzieLwjEQKBgQD4GEQco8wovM76lJRfO1xx1uInpjPmBUe0j7R0sqme4Wcdq1R5OErB/szaQinSdXmbS9veFN2w/1T3DKz62yIFaGGMWUsXuW8NKlhkrEbxO4Ql2rbTM56yFe2R8Nln7gsG1ZFVUZZOqVLuFkZ48s3yVrTAQ7YR8V0rrS+8vwaZiwKBgQDrCkTESTNUU6pVn+YwDrc99tOVno88D6j6sXPgdkKO15D88ayuBawIRmMao6pbumsXZ9dlNdUgwj4DVdVAUwQjlx+/zecA+F4565EauuJRP0jkSJomjQPnb2SeZ+fKCh5e+gCpB/WlsatX00YfDRt3d2XEDYYaclIiwyD1WM9EWQKBgB9vc7HtT0EaK1+009f9PYlvINjFRm4u3RcT3lmrCbMH/HjV7K4vY8mQ74P4PjRcjjwPMJzDKBP1Rl7HTGO8wGLPBw0xg0JOTLPuWaTn71VBpUzmmaPJNqJ6BNApJGL21o7XIMMew1zUN53TVLqeiVnbgquZ6Mf9PUD7gMD5s2xhAoGAQbaOQV7B5hq6LdRV1CvZGY7v2w4It98c/HIulpwZwbwNQlsDT2gwj+O2A5WspJa7KEEVHKvvWYhVNDOEOsa7CoRPER4tLr1CAumUmSeU7OhHpeOSjaKxa7xeIlekm302vpEhLCEYkenZoOVl3nqYqk8MecLaMnyx8BwkE9RvpokCgYEAtd+t9mxP3gmAW1HsAFv218YTgWraQNENDztZ0XmgfgVwCYRFOpDdBpiNO/bD/uWO3KHpd3zF3qT9/mzLEE/zxhU9ZFB+yz40LIJcnpZTUA7ZNL4Yq0iECl1jjMlqsy5AlcuZVq6I9kTT4kNIg9DjDPROv8kzwAaSNjEv0HZYpVY=
```

### 2. 온보딩

클라이언트는 온보딩에서 새로운 device id(uuid)를 함께 보내고, 온보딩에 성공하면 서버는 public key와 user uuid를 전달한다.

- device uuid

```text
de08c6af-9da1-4720-b7da-2e8ff962510f
```

- user uuid

```text
f2b21e91-6d31-4724-a4fb-bef956440fce
```

### 3. 결제수단 등록

카드정보 입력 후 서버는 다음 값을 클라이언트에게 전달한다.

- payment method id (MID): `9fb961c8-187f-4b46-8f30-c76021cf3ed8`
- OTP Secret (K):  `GoQnxXeW+fjlzo7JSTVcwcDFxME=`
- payment method registered time(T0): `1705896544745`
- OTP Interval(Tx): `30`

클라이언트는 해당 값들을 안전하게 저장한다.

### 4. Generate Payment Code

#### 1) Prefix

hex값 `44 50`을 사용한다.

#### 2) Algorithm version

hex값 `00`을 사용한다. (0.0v)

```text
00000000: 44 50 00                                         DP.
```

#### 3) User UUID

user uuid에서 `-`를 뺸 값을 추가한다.

```text
00000000: 44 50 00 F2 B2 1E 91 6D 31 47 24 A4 FB BE F9 56  DP.....m1G$....V
00000010: 44 0F CE                                         D..
```

#### 4) HMAC 생성

먼저 카운터를 계산한다. (T = `1705897217563`)

Math.floor((1705897217563 - 1705896544745) / 30) = `22427`

SHA-256 알고리즘을 사용하면 다음과같다.

```text
6e48fb06ddbe1e66cff7675f1010db12137b5175cf9eecba9200b15a856548d9
```

#### 5) Nonce 생성

uuid v4로 nonce값을 생성한다. nonce 역시 uuid의 `-`를 제거한다.

```text
bd3f28b163014ca4af8a802c482306f3
```

#### 6) 암호화

문자열을 연결한다.

[device uuid] [MID] [HMAC] [Nonce]

```text
de08c6af9da14720b7da2e8ff962510f9fb961c8187f4b468f30c76021cf3ed86e48fb06ddbe1e66cff7675f1010db12137b5175cf9eecba9200b15a856548d9bd3f28b163014ca4af8a802c482306f3
```

OAEP RSA 암호화.

```text
696a630f6cb840894c0d77cb83d9c790822f39e45b99f983d243d18a8e7512941a8a01258ababa6ab507928d0754526e864239bee20494f8a0cdde78946a0422b3ebce8f2d8d135298583390fc6e7273a0fca6dc8fc43d597fcdc4eb80dc9e33d378a381a1f5b11fd6cc09551edec2e0f10d20bc740872a75f9b045b1478823b7b02eb1b7ed997f818fe6e909b9c27e340af9745637d845123dd12b10d0b08bf3015bf49353807466f5ed66d5651f984270e48d16e00b3d2fbb1642ebb1e7d664d934b15e6d11d09ab735b9b830cbe5c4b8b3e91eb32fc718484609c83c1db23d8a60c6202edf729ac566e7291032890033107fc6809f68911458c09789e9047
```

전체 코드는 다음과 같다.

```text
00000000: 44 50 00 F2 B2 1E 91 6D 31 47 24 A4 FB BE F9 56  DP.....m1G$....V
00000010: 44 0F CE 69 6A 63 0F 6C B8 40 89 4C 0D 77 CB 83  D..ijc.l.@.L.w..
00000020: D9 C7 90 82 2F 39 E4 5B 99 F9 83 D2 43 D1 8A 8E  ..../9.[....C...
00000030: 75 12 94 1A 8A 01 25 8A BA BA 6A B5 07 92 8D 07  u.....%...j.....
00000040: 54 52 6E 86 42 39 BE E2 04 94 F8 A0 CD DE 78 94  TRn.B9........x.
00000050: 6A 04 22 B3 EB CE 8F 2D 8D 13 52 98 58 33 90 FC  j."....-..R.X3..
00000060: 6E 72 73 A0 FC A6 DC 8F C4 3D 59 7F CD C4 EB 80  nrs......=Y.....
00000070: DC 9E 33 D3 78 A3 81 A1 F5 B1 1F D6 CC 09 55 1E  ..3.x.........U.
00000080: DE C2 E0 F1 0D 20 BC 74 08 72 A7 5F 9B 04 5B 14  ..... .t.r._..[.
00000090: 78 82 3B 7B 02 EB 1B 7E D9 97 F8 18 FE 6E 90 9B  x.;{...~.....n..
000000a0: 9C 27 E3 40 AF 97 45 63 7D 84 51 23 DD 12 B1 0D  .'.@..Ec}.Q#....
000000b0: 0B 08 BF 30 15 BF 49 35 38 07 46 6F 5E D6 6D 56  ...0..I58.Fo^.mV
000000c0: 51 F9 84 27 0E 48 D1 6E 00 B3 D2 FB B1 64 2E BB  Q..'.H.n.....d..
000000d0: 1E 7D 66 4D 93 4B 15 E6 D1 1D 09 AB 73 5B 9B 83  .}fM.K......s[..
000000e0: 0C BE 5C 4B 8B 3E 91 EB 32 FC 71 84 84 60 9C 83  ..\K.>..2.q..`..
000000f0: C1 DB 23 D8 A6 0C 62 02 ED F7 29 AC 56 6E 72 91  ..#...b...).Vnr.
00000100: 03 28 90 03 31 07 FC 68 09 F6 89 11 45 8C 09 78  .(..1..h....E..x
00000110: 9E 90 47                                         ..G
```

#### 7) Base64 인코딩

```text
RFAA8rIekW0xRySk+775VkQPzmlqYw9suECJTA13y4PZx5CCLznkW5n5g9JD0YqOdRKUGooBJYq6umq1B5KNB1RSboZCOb7iBJT4oM3eeJRqBCKz686PLY0TUphYM5D8bnJzoPym3I/EPVl/zcTrgNyeM9N4o4Gh9bEf1swJVR7ewuDxDSC8dAhyp1+bBFsUeII7ewLrG37Zl/gY/m6Qm5wn40Cvl0VjfYRRI90SsQ0LCL8wFb9JNTgHRm9e1m1WUfmEJw5I0W4As9L7sWQuux59Zk2TSxXm0R0Jq3Nbm4MMvlxLiz6R6zL8cYSEYJyDwdsj2KYMYgLt9ymsVm5ykQMokAMxB/xoCfaJEUWMCXiekEc=
```

문자열 길이가 368이라는 것을 확인할 수 있다.

#### 8) QR 코드 생성

Error Correction Level을 L로 하고, byte모드로 QR코드를 생성한다.

![result.png](static/result.png)

## refs

- References

  - Dynamic Security Code Card: [https://www.securetechalliance.org/wp-content/uploads/Dynamic-Security-Code-Card-WP-Final-July-2020.pdf](https://www.securetechalliance.org/wp-content/uploads/Dynamic-Security-Code-Card-WP-Final-July-2020.pdf)
  - HOTP on Wikipedia: [https://en.wikipedia.org/wiki/HMAC-based_one-time_password](https://en.wikipedia.org/wiki/HMAC-based_one-time_password)
  - TOTP on Wikipedia: [https://en.wikipedia.org/wiki/Time-based_one-time_password](https://en.wikipedia.org/wiki/Time-based_one-time_password)
  - Dynamic Data Authentication: [https://www.openscdp.org/scripts/tutorial/emv/DDA.html](https://www.openscdp.org/scripts/tutorial/emv/DDA.html)
  - Reducing Payment Card Fraud by Shifting over to EMV Chip Technology: [https://www.cryptomathic.com/news-events/blog/reducing-payment-card-fraud-by-shifting-over-to-emv-chip-technology](https://www.cryptomathic.com/news-events/blog/reducing-payment-card-fraud-by-shifting-over-to-emv-chip-technology)

  - emv

    - EMV SAD on flylib: [https://flylib.com/books/en/4.365.1.88/1/](https://flylib.com/books/en/4.365.1.88/1/)
    - EMV DDA on openscdp: [https://www.openscdp.org/scripts/tutorial/emv/DDA.html](https://www.openscdp.org/scripts/tutorial/emv/DDA.html)

  - How toadd additional security layers? (refs)

    - **Zero-knowledge proof:** [https://en.wikipedia.org/wiki/Zero-knowledge_proof](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
    - **Non-interactive zero-knowledge proof:** [https://en.wikipedia.org/wiki/Zero-knowledge_proof](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
    - **Zero-knowledge password proof:** [https://en.wikipedia.org/wiki/Zero-knowledge_password_proof](https://en.wikipedia.org/wiki/Zero-knowledge_password_proof)
    - **New Techniques for Non-interactive Zero-Knowledge**: [https://inst.eecs.berkeley.edu/~cs276/fa20/notes/New Techniques for NIZK.pdf](https://inst.eecs.berkeley.edu/~cs276/fa20/notes/New%20Techniques%20for%20NIZK.pdf)
