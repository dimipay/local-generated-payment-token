# Example

## Metadata Payload

### Payload Format Indicator

hex값 `4c 50`을 페이로드 포멧 지시자로 사용합니다.

```text
00000000: 4C 50                                            LP
```

### Application Identifier

애플리케이션 식별자로  hex값 `0x44 0x50 0xff 0xff`를 사용합니다. 

```text
00000000: 4C 50 44 50 FF FF                                LPDP..
```

### Version

버전 `0.3`은 hex값 `0x03`으로 나타냅니다.

```text
00000000: 4C 50 44 50 FF FF 03                             LPDP...
```

## Common Payload

### Auth Type

로컬 인증을 사용하는 경우, `0x10`을 사용합니다. 그리고 Auth Type은 1바이트 값이므로 TLV 포멧으로 나타내면 다음과 같습니다.

```text
  0001   0000  0001 0000    →  [0x10, 0x10]
└ tag ┘└ len ┘└   value  ┘
```

### User Identifier

사용자 식별자는 `320fae03-9d72-4c19-816d-2c2d1d5b7ca2`라고 하겠습니다.

```text
  0011   0100  0x32 0x0f 0xae .. 0xa2    →  [0x34, 0x32, 0x0c, .. ,0xa2]
└ tag ┘└ len ┘└         value        ┘
```

### Build Common Payload

계산된 TLV 블록을 연결하여 Common Payload를 완성합니다. TLV 블록을 연결하는 순서는 상관 없습니다.

```text
00000000: 10 10 34 32 0F AE 03 9D 72 4C 19 81 6D 2C 2D 1D  ..42....rL..m,-.
00000010: 5B 7C A2                                         [|.
```

## Private Payload / Encrypted Payload

### Auth Token

Auth token은 `adca79ec-7934-433c-acc0-a23088f39f58`이라고 하겠습니다.

```text
  0010   0010  0xad 0xca 0x79 .. 0x58    →  [0x22, 0xad, 0xca, .. ,0x58]
└ tag ┘└ len ┘└         value        ┘
```

#### Device Identifier

기기 식별자는 `265bed1a-9b4a-47fc-8765-b421d67a1458`라고 하겠습니다.

```text
  0010   0100  0x26 0x5b 0xed .. 0x58    →  [0x24, 0x26, 0x5b, .. ,0x58]
└ tag ┘└ len ┘└         value        ┘
```

#### Payment Method Identifier

결제 수단 사용자 수준에서 시퀀스 숫자로 구분되는 시스템이라고 가정해보겠습니다. 사용자가 두 번째 결제 수단을 선택했다고하면 `0x01` 값을 사용합니다.

```text
  0101   0000     0x01     →  [0x50, 0x01]
└ tag ┘└ len ┘└  value  ┘ 
```

### Nonce

16 바이트 랜덤 값으로 `ad05b8eb112c9d7bad79f89ce4e28319`를 사용하겠습니다.

```text
  0110   0100  0xad 0x05 0xb8 .. 0x19    →  [0x64, 0xad, 0x05, .. ,0x19]
└ tag ┘└ len ┘└         value        ┘
```

### Build Private Payload

계산한 TLV 블록을 연결하여 Private Payload를 완성합니다. TLV 블록을 연결하는 순서는 상관 없습니다.

```text
00000000: 24 AD CA 79 EC 79 34 43 3C AC C0 A2 30 88 F3 9F  $..y.y4C<...0...
00000010: 58 44 26 5B ED 1A 9B 4A 47 FC 87 65 B4 21 D6 7A  XD&[...JG..e.!.z
00000020: 14 58 50 01 64 AD 05 B8 EB 11 2C 9D 7B AD 79 F8  .XP.d.....,.{.y.
00000030: 9C E4 E2 83 19                                   .....
```

raw:

```text
24adca79ec7934433cacc0a23088f39f5844265bed1a9b4a47fc8765b421d67a1458500164ad05b8eb112c9d7bad79f89ce4e28319
```

## Encryption

### Prepare the key

사용하는 파라미터는 다음과 같습니다.

- `Rk`: `c0093def64d3b1880da182de861cec39`
- `c`: `506440433`
  - `T`: 1721089757738
  - `T0`: 1705896544745

$$
C=\left\lfloor {\frac {T-T_{0}}{30}}\right\rfloor=\left\lfloor {\frac {1721089757738-1705896544745}{30}}\right\rfloor=506440433
$$

- `len`: 56

```text
tmp = hkdf_sha384(
  len = 56,
  ikm = c0093def64d3b1880da182de861cec39, // 바이너리 값입니다.
  info = 'local-generated-payment-token506440433', // utf8 문자열 입니다.
  salt = 320fae039d724c19816d2c2d1d5b7ca2 // 바이너리 값입니다.
)

k = tmp[0:32] = 8dd44fadd3d5d574b9c6928a1a363843e0b0b4480a2ffab3ff489359eba16bd0
n = tmp[32:] = 806d3d1956b30e5263f7bd230628ba54db9971f3b06c556a
```

### Encrypt

XChaCha20-Poly1305로 암호화합니다.

```text
e = xchacha20poly1305_encrypt(
  k = 8dd44fadd3d5d574b9c6928a1a363843e0b0b4480a2ffab3ff489359eba16bd0, 
  n = 806d3d1956b30e5263f7bd230628ba54db9971f3b06c556a, 
  m = raw_private_payload
)
```

- `n`: 24바이트 랜덤 값

암호화 결과는 다음과 같습니다.

```text
00000000: 27 86 DD 2A 13 B4 2A B3 92 18 64 B5 EB 1E AE C0  '..*..*...d.....
00000010: FF 38 8A 2D 46 99 6F 39 7A E4 A7 12 83 06 40 F9  .8.-F.o9z.....@.
00000020: B8 00 E9 C0 B8 55 5E AB 5D 67 E5 5E 62 3B 75 7A  .....U^.]g.^b;uz
00000030: 07 69 A4 2C 3C 83 F3 92 8D B3 65 8A 5E A1 75 81  .i.,<.....e.^.u.
00000040: 04 92 86 8A 9A                                   .....
```

raw:

```text
2786dd2a13b42ab3921864b5eb1eaec0ff388a2d46996f397ae4a712830640f9b800e9c0b8555eab5d67e55e623b757a0769a42c3c83f3928db3658a5ea175810492868a9a
```

### 6. Final data

메타이데이 필드, 일반 필드, 암호화된 암호화 필드를 모두 합친 결과는 다음과 같습니다.

```text
00000000: 4C 50 44 50 FF FF 03 10 10 34 32 0F AE 03 9D 72  LPDP.....42....r
00000010: 4C 19 81 6D 2C 2D 1D 5B 7C A2 27 86 DD 2A 13 B4  L..m,-.[|.'..*..
00000020: 2A B3 92 18 64 B5 EB 1E AE C0 FF 38 8A 2D 46 99  *...d......8.-F.
00000030: 6F 39 7A E4 A7 12 83 06 40 F9 B8 00 E9 C0 B8 55  o9z.....@......U
00000040: 5E AB 5D 67 E5 5E 62 3B 75 7A 07 69 A4 2C 3C 83  ^.]g.^b;uz.i.,<.
00000050: F3 92 8D B3 65 8A 5E A1 75 81 04 92 86 8A 9A     ....e.^.u......
```

raw:

```text
4c504450ffff03101034320fae039d724c19816d2c2d1d5b7ca22786dd2a13b42ab3921864b5eb1eaec0ff388a2d46996f397ae4a712830640f9b800e9c0b8555eab5d67e55e623b757a0769a42c3c83f3928db3658a5ea175810492868a9a
```

Base45 인코딩 결과는 다음과 같습니다.

```text
6T9SS8FGWJH0822ZE6.:LV+J-R9DGGEQ50W31YF%:48/R4M2-H55LI-WCPWT64M-BW3LHS-8X2E5OFK5LHPGS98YBNZOTTDNP/BG B%:S$ICE%E7.0/XKBT7TZU5-HT$CF/BL%E0Q0H0HJ3
```

### 7. QR Code

QR 코드를 생성하기위해 다음 파라미터를 사용합니다.

- Mode: Alphanumeric
- Error Correction Level: L

![result](./static/result.png)