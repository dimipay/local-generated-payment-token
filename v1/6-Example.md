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

버전 `0.4`는 hex값 `0x04`으로 나타냅니다.

```text
00000000: 4C 50 44 50 FF FF 04                             LPDP...
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

### Payment Method Identifier

결제 수단 사용자 수준에서 시퀀스로 구분되는 시스템이라고 가정해보겠습니다. 사용자가 두 번째 결제 수단을 선택했다고하면 `0x01` 값을 사용합니다.

```text
  0101   0000     0x01     →  [0x50, 0x01]
└ tag ┘└ len ┘└  value  ┘ 
```

### Payload Length Indicator

모든 TLV의 크기는 21 바이트 이므로 Payload Length Indicator는 다음과 같이 설정합니다.

```text
  0111   0000     0x15     →  [0x70, 0x15]
└ tag ┘└ len ┘└  value  ┘ 
```

### Build Common Payload

Payload Length Indicator TLV를 가장 앞에 위치시키고, 나머지 TLV는 순서에 관계없이 연결합니다.

```text
00000000: 70 15 10 10 34 32 0F AE 03 9D 72 4C 19 81 6D 2C  p...42....rL..m,
00000010: 2D 1D 5B 7C A2 50 01                             -.[|.P.
```

## Private Payload / Encrypted Payload

### Auth Token

Auth token은 `adca79ec-7934-433c-acc0-a23088f39f58`이라고 하겠습니다.

```text
  0010   0010  0xad 0xca 0x79 .. 0x58    →  [0x22, 0xad, 0xca, .. ,0x58]
└ tag ┘└ len ┘└         value        ┘
```

### Device Identifier

기기 식별자는 `265bed1a-9b4a-47fc-8765-b421d67a1458`라고 하겠습니다.

```text
  0010   0100  0x26 0x5b 0xed .. 0x58    →  [0x24, 0x26, 0x5b, .. ,0x58]
└ tag ┘└ len ┘└         value        ┘
```

### Nonce

UUIDv7를 발급하고 `-`를 제거합니다. `01934f0337777ac38dcb8066c646b7fb`

```text
  0110   0100  0xad 0x05 0xb8 .. 0x19    →  [0x64, 0xad, 0x05, .. ,0x19]
└ tag ┘└ len ┘└         value        ┘
```

### Payload Length Indicator

모든 TLV의 크기는 51 바이트 이므로 Payload Length Indicator는 다음과 같이 설정합니다.

```text
  0111   0000     0x33     →  [0x70, 0x33]
└ tag ┘└ len ┘└  value  ┘ 
```

### Build Private Payload

Payload Length Indicator TLV를 가장 앞에 위치시키고, 나머지 TLV는 순서에 관계없이 연결합니다.

```text
00000000: 70 33 24 AD CA 79 EC 79 34 43 3C AC C0 A2 30 88  p3$..y.y4C<...0.
00000010: F3 9F 58 44 26 5B ED 1A 9B 4A 47 FC 87 65 B4 21  ..XD&[...JG..e.!
00000020: D6 7A 14 58 64 01 93 4F 03 37 77 7A C3 8D CB 80  .z.Xd..O.7wz....
00000030: 66 C6 46 B7 FB                                   f.F..
```

raw:

```text
703324adca79ec7934433cacc0a23088f39f5844265bed1a9b4a47fc8765b421d67a14586401934f0337777ac38dcb8066c646b7fb
```

## Encryption

### Prepare the key

사용하는 파라미터는 다음과 같습니다.

- `Rk`: `c0093def64d3b1880da182de861cec39`
- `c`: `506440`
  - `T`: 1721089757738
  - `T0`: 1705896544745

$$
C=\left\lfloor {\frac {T-T_{0}}{30\cdot1000}}\right\rfloor=\left\lfloor {\frac {1721089757738-1705896544745}{30\cdot1000}}\right\rfloor=506440
$$

- `len`: 56

```text
tmp = hkdf_sha384(
  len = 56,
  ikm = c0093def64d3b1880da182de861cec39, // 바이너리 값입니다.
  info = 'local-generated-payment-token506440', // utf8 문자열입니다.
  salt = 320fae039d724c19816d2c2d1d5b7ca2 // 바이너리 값입니다.
)

k = tmp[0:32] = cf6fcb3780cba30a8f903841d19265d73cbc09a8b70eb16ba6dd51a2bb76d0c5
n = tmp[32:] = bd0ca49567a46cf892279fd6c9b3cb31b6a4c654827d0b67
```

### Encrypt

XChaCha20-Poly1305로 암호화합니다.

```text
e = xchacha20poly1305_encrypt(
  k = cf6fcb3780cba30a8f903841d19265d73cbc09a8b70eb16ba6dd51a2bb76d0c5, 
  n = bd0ca49567a46cf892279fd6c9b3cb31b6a4c654827d0b67, 
  ad: metadata_payload || common_payload,
  m = raw_private_payload
)
```

암호화 결과는 다음과 같습니다.

```text
00000000: 0C 17 F8 0A F5 27 C7 75 0E 36 B9 9F C2 4F E0 06  .....'.u.6...O..
00000010: C8 35 AB 3B E6 67 C4 B7 3B 24 D3 25 2A AF DE C0  .5.;.g..;$.%*...
00000020: D4 9B AB 73 26 1C 2F 8F B9 FC 3A 39 70 26 A1 63  ...s&./...:9p&.c
00000030: 13 93 78 C1 B9 67 1E AE 9B FC B0 71 74 59 AA EF  ..x..g.....qtY..
00000040: 4F 8D 5A 85 41                                   O.Z.A
```

raw:

```text
0c17f80af527c7750e36b99fc24fe006c835ab3be667c4b73b24d3252aafdec0d49bab73261c2f8fb9fc3a397026a163139378c1b9671eae9bfcb0717459aaef4f8d5a8541
```

### 6. Final data

메타이데이 필드, 일반 필드, 암호화된 암호화 필드를 모두 합친 결과는 다음과 같습니다.

```text
00000000: 4C 50 44 50 FF FF 04 70 15 10 10 34 32 0F AE 03  LPDP...p...42...
00000010: 9D 72 4C 19 81 6D 2C 2D 1D 5B 7C A2 50 01 0C 17  .rL..m,-.[|.P...
00000020: F8 0A F5 27 C7 75 0E 36 B9 9F C2 4F E0 06 C8 35  ...'.u.6...O...5
00000030: AB 3B E6 67 C4 B7 3B 24 D3 25 2A AF DE C0 D4 9B  .;.g..;$.%*.....
00000040: AB 73 26 1C 2F 8F B9 FC 3A 39 70 26 A1 63 13 93  .s&./...:9p&.c..
00000050: 78 C1 B9 67 1E AE 9B FC B0 71 74 59 AA EF 4F 8D  x..g.....qtY..O.
00000060: 5A 85 41                                         Z.A
```

raw:

```text
4c504450ffff047015101034320fae039d724c19816d2c2d1d5b7ca250010c17f80af527c7750e36b99fc24fe006c835ab3be667c4b73b24d3252aafdec0d49bab73261c2f8fb9fc3a397026a163139378c1b9671eae9bfcb0717459aaef4f8d5a8541
```

Base45 인코딩 결과는 다음과 같습니다.

```text
6T9SS8FGWBP0$T2822ZE6.:LV+J-R9DGGEQ50W31YF65AZN13GVT:UV9P%Z1:KNIPOKES/DP5TLX5T4*OKL78VQ$H597SM*QGUL  4P062NNAG708E5IKGL2/BFXJNO*3HWJYDM+VEJRLP2A/JBK1
```

### 7. QR Code

QR 코드를 생성하기위해 다음 파라미터를 사용합니다.

- Mode: Alphanumeric
- Error Correction Level: L

![result](./static/result.png)
