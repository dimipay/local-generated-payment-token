# Encryption

암호화는 프라이빗 페이로드(private payload)/암호화 페이로드(encrypted payload)를 암호화하기 위해 사용됩니다.

암호화를 진행하기 전, 암호화 페이로드는 [TLV](./TLV.md) 포맷이어야 합니다.

## Prepare key

결제 시스템은 사용자마다 고유한 키 `Rk`(root key)를 할당합니다. 시스템 호환성 목적이 아닌 이상, `Rk`는 OS의 CSPRNG를 사용하여 생성한 랜덤 256비트 값이어야 합니다. `Rk`를 직접적으로 이용하여 암호화하지 않고, 암호화를 위한 키 `k`를 `Rk`로부터 파생해야 합니다.

### Counter (time-step)

카운터는 토큰 자동 만료를 구현하기 사용되며, 30초마다 갱신됩니다.

$$
C=\left\lfloor {\frac {T-T_{0}}{30\cdot1000}}\right\rfloor
$$

여기서 T는 현재 Unix Epoch, T0는 선택한 결제 수단의 생성 Unix Epoch, Tx는 카운터 업데이트 주기입니다. T0는 사전에 결제 서버로부터 받아와 사용자 기기에 안전하게 저장해야 합니다.

계산된 `c`는 UTF8 문자열로 인코딩합니다.

> [!NOTE]  
> Unix Epoch는 반드시 64-bit 숫자를 사용해야 합니다.

### Apply HKDF

[HKDF](https://datatracker.ietf.org/doc/html/rfc5869)는 HMAC 기반의 키 유도함수(key derivation function)입니다.
사용하는 해시함수는 sha384입니다. `salt` 값은 바이너리 사용자 식별자, `info`는 문자열 "local-generated-payment-token"과 계산된 `c`를 연결한 값으로 사용합니다.

`len` 파라미터를 56으로 설정합니다. 첫 32바이트는 `k`, 나머지 24바이트는 XChaCha20-Poly1305에서 사용하는 nonce 값 `n`입니다.

> [!NOTE]
> `n`과 암호화 페이로드에서 사용되는 [nonce](./1-Payload.md#nonce)는 다릅니다.

공격자가 30초 안에 `k`를 알아낸다고 해도 `Rk`와 `c` 값을 알아낼 수 없습니다.

```text
tmp = hkdf_sha384(
  len = 56,
  ikm = Rk,
  info = 'local-generated-payment-token' || c,
  salt = user_id
);

k = tmp[0:32]
n = tmp[32:]
```

- `||` 는 문자열 결합자입니다.
- `user_id`는 바이너리 사용자 식별자 입니다.

## Encryption

LGPT 0.4 버전부터 [XChacha20-Poly1305](https://datatracker.ietf.org/doc/html/draft-arciszewski-xchacha-03)를 사용합니다.
Chacha20-Poly1305는 AEAD 알고리즘이고, 일반적으로 AES-GCM보다 더 빠르고 모바일 기기에서 더 적은 전력을 소비합니다.

```text
e = xchacha20_poly1305_encrypt(
  message = payload,
  key = k,
  nonce = n
  ad = metadata_payload || common_payload
);
```

- `||`는 문자열 결합자입니다.
- `ad`(Associated Data)는 메타데이터 페이로드, 일반 페이로드를 결합시킨 값입니다.
